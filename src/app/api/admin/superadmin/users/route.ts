import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordAuditLog } from '@/lib/audit';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// GET: Listar todos los usuarios y perfiles para la consola Superadmin
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Obtener perfiles con su empresa asociada
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*, companies(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener usuarios' }, { status: 500 });
  }
}

// PATCH: Asignar/Desasignar empresa o cambiar rol de usuario (Admin / Superadmin / Estudiante)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, companyId, unassignCompany, actorEmail, actorId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'El ID de usuario es obligatorio.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Obtener perfil actual
    const { data: currentProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !currentProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos.' }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {
      last_active: new Date().toISOString()
    };

    let newRole = currentProfile.role;
    let newCompanyId = currentProfile.company_id;
    let newCompanyCode = currentProfile.company_code;

    // 2. Gestión de Rol
    if (role) {
      if (!['estudiante', 'admin', 'superadmin'].includes(role)) {
        return NextResponse.json({ error: 'Rol no válido. Permitidos: estudiante, admin, superadmin.' }, { status: 400 });
      }
      updatePayload.role = role;
      newRole = role;

      // Sincronizar en auth.users user_metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { role }
        });
      } catch (authErr) {
        console.warn('No se pudo actualizar metadata en Auth:', authErr);
      }
    }

    // 3. Gestión de Empresa: Desasignar
    if (unassignCompany === true) {
      updatePayload.company_id = null;
      updatePayload.company_code = null;
      newCompanyId = null;
      newCompanyCode = null;
    } 
    // Gestión de Empresa: Asignar o Cambiar Empresa
    else if (companyId !== undefined && companyId !== null) {
      const { data: comp, error: compErr } = await supabaseAdmin
        .from('companies')
        .select('id, code, name')
        .eq('id', companyId)
        .maybeSingle();

      if (compErr || !comp) {
        return NextResponse.json({ error: 'La empresa especificada no existe.' }, { status: 404 });
      }

      updatePayload.company_id = comp.id;
      updatePayload.company_code = comp.code;
      newCompanyId = comp.id;
      newCompanyCode = comp.code;
    }

    // 4. Actualizar tabla profiles
    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*, companies(*)')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Registrar trazabilidad en audit_logs
    await recordAuditLog({
      actorId: actorId || null,
      actorEmail: actorEmail || 'superadmin@diacero.com',
      action: 'SUPERADMIN_UPDATE_USER',
      targetType: 'PROFILE',
      targetId: userId,
      companyId: newCompanyId,
      metadata: {
        previousRole: currentProfile.role,
        newRole,
        previousCompanyId: currentProfile.company_id,
        newCompanyId,
        unassigned: unassignCompany === true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedProfile
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno al actualizar usuario' }, { status: 500 });
  }
}
