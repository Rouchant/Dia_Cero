import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRut, formatRut } from '@/lib/rut';
import { recordAuditLog } from '@/lib/audit';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// GET: Listar todas las empresas con estadísticas para Superadmin
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, company_id');

    // Enriquecer con conteo de usuarios y administradores
    const enriched = (companies || []).map(comp => {
      const companyProfiles = profiles?.filter(p => p.company_id === comp.id) || [];
      const admins = companyProfiles.filter(p => p.role === 'admin' || p.role === 'superadmin');
      const students = companyProfiles.filter(p => p.role === 'estudiante');
      return {
        ...comp,
        totalUsers: companyProfiles.length,
        totalStudents: students.length,
        totalAdmins: admins.length,
        admins: admins.map(a => ({ id: a.id, name: a.name, email: a.email }))
      };
    });

    return NextResponse.json({ companies: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Crear nueva empresa y su primer Encargado (Admin)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      businessName,
      rut,
      legalAddress,
      businessLine,
      code,
      logoUrl,
      adminName,
      adminEmail,
      adminRut,
      adminPassword
    } = body;

    if (!name || !businessName || !rut || !legalAddress || !businessLine || !code) {
      return NextResponse.json({
        error: 'Todos los datos de la empresa son requeridos (Nombre, Razón Social, RUT, Dirección, Giro, Código).'
      }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      return NextResponse.json({ error: 'El código de empresa debe tener exactamente 6 caracteres.' }, { status: 400 });
    }

    if (!validateRut(rut)) {
      return NextResponse.json({ error: 'El RUT de la empresa no es válido (Módulo 11).' }, { status: 400 });
    }
    const formattedCompanyRut = formatRut(rut);

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Crear empresa en public.companies
    const { data: newCompany, error: compError } = await supabaseAdmin
      .from('companies')
      .insert({
        code: cleanCode,
        name: name.trim(),
        business_name: businessName.trim(),
        rut: formattedCompanyRut,
        legal_address: legalAddress.trim(),
        business_line: businessLine.trim(),
        logo_url: logoUrl || null,
        is_active: true
      })
      .select()
      .single();

    if (compError) {
      if (compError.message.includes('unique') || compError.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Ya existe una empresa registrada con ese código de 6 caracteres.' }, { status: 409 });
      }
      return NextResponse.json({ error: compError.message }, { status: 500 });
    }

    // 2. Si se suministraron datos para crear el primer administrador
    let createdAdminUser = null;
    if (adminEmail && adminPassword && adminName) {
      if (adminPassword.length < 6) {
        return NextResponse.json({ error: 'La contraseña del administrador debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      let formattedAdminRut = null;
      if (adminRut && adminRut.trim()) {
        if (validateRut(adminRut)) {
          formattedAdminRut = formatRut(adminRut);
        }
      }

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: adminName.trim(),
          role: 'admin',
          company_id: newCompany.id,
          company_code: newCompany.code
        }
      });

      if (!authErr && authUser.user) {
        await supabaseAdmin.from('profiles').upsert({
          id: authUser.user.id,
          email: adminEmail.trim().toLowerCase(),
          name: adminName.trim(),
          role: 'admin',
          rut: formattedAdminRut,
          company_id: newCompany.id,
          company_code: newCompany.code,
          last_active: new Date().toISOString()
        });
        createdAdminUser = authUser.user;
      }
    }

    // Registrar en auditoría
    await recordAuditLog({
      action: 'EMPRESA_CREADA',
      targetType: 'COMPANY',
      targetId: newCompany.id,
      companyId: newCompany.id,
      metadata: { code: newCompany.code, businessName: newCompany.business_name }
    });

    return NextResponse.json({
      success: true,
      message: 'Empresa creada exitosamente.',
      company: newCompany,
      adminCreated: !!createdAdminUser
    }, { status: 201 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Modificar información completa de la empresa o su logo
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      name, 
      businessName, 
      rut, 
      code,
      legalAddress, 
      businessLine, 
      logoUrl, 
      isActive,
      actorId,
      actorEmail
    } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updatePayload.name = name.trim();
    if (businessName !== undefined) updatePayload.business_name = businessName.trim();
    if (legalAddress !== undefined) updatePayload.legal_address = legalAddress.trim();
    if (businessLine !== undefined) updatePayload.business_line = businessLine.trim();
    if (logoUrl !== undefined) updatePayload.logo_url = logoUrl ? logoUrl.trim() : null;
    if (isActive !== undefined) updatePayload.is_active = Boolean(isActive);
    
    if (rut) {
      if (!validateRut(rut)) {
        return NextResponse.json({ error: 'RUT de empresa no válido (Módulo 11).' }, { status: 400 });
      }
      updatePayload.rut = formatRut(rut);
    }

    let codeChanged = false;
    let cleanCode = '';
    if (code) {
      cleanCode = code.trim().toUpperCase();
      if (cleanCode.length !== 6) {
        return NextResponse.json({ error: 'El código de empresa debe tener exactamente 6 caracteres alfanuméricos.' }, { status: 400 });
      }
      updatePayload.code = cleanCode;
      codeChanged = true;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('companies')
      .update(updatePayload)
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return NextResponse.json({ error: 'Ya existe otra empresa registrada con ese código de 6 caracteres.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si cambió el código, sincronizar en profiles para mantener consistencia
    if (codeChanged) {
      await supabaseAdmin
        .from('profiles')
        .update({ company_code: cleanCode })
        .eq('company_id', companyId);
    }

    // Registrar en auditoría
    await recordAuditLog({
      actorId: actorId || null,
      actorEmail: actorEmail || 'superadmin@diacero.com',
      action: 'EMPRESA_ACTUALIZADA',
      targetType: 'COMPANY',
      targetId: companyId,
      companyId: companyId,
      metadata: updatePayload
    });

    return NextResponse.json({ success: true, message: 'Empresa actualizada correctamente.', company: updated });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Eliminar o dar de baja una empresa cliente
export async function DELETE(request: Request) {
  try {
    const { companyId, hardDelete, actorId, actorEmail } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId requerido.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: company, error: findError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (findError || !company) {
      return NextResponse.json({ error: 'Empresa no encontrada.' }, { status: 404 });
    }

    if (hardDelete === true) {
      // 1. Desvincular perfiles asociados para no romper integridad
      await supabaseAdmin
        .from('profiles')
        .update({ company_id: null, company_code: null })
        .eq('company_id', companyId);

      // 2. Eliminar empresa
      const { error: deleteError } = await supabaseAdmin
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      await recordAuditLog({
        actorId: actorId || null,
        actorEmail: actorEmail || 'superadmin@diacero.com',
        action: 'EMPRESA_ELIMINADA_DEFINITIVA',
        targetType: 'COMPANY',
        targetId: companyId,
        metadata: { deletedName: company.name, deletedCode: company.code }
      });

      return NextResponse.json({ success: true, message: 'Empresa eliminada permanentemente del sistema.' });
    } else {
      // Baja lógica (desactivación)
      const { data: deactivated, error: deactError } = await supabaseAdmin
        .from('companies')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', companyId)
        .select()
        .single();

      if (deactError) {
        return NextResponse.json({ error: deactError.message }, { status: 500 });
      }

      await recordAuditLog({
        actorId: actorId || null,
        actorEmail: actorEmail || 'superadmin@diacero.com',
        action: 'EMPRESA_DADA_DE_BAJA',
        targetType: 'COMPANY',
        targetId: companyId,
        metadata: { companyName: company.name, code: company.code }
      });

      return NextResponse.json({ success: true, message: 'Empresa dada de baja operativamente (inactiva).', company: deactivated });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

