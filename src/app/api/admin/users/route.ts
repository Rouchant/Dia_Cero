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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const isSuperadmin = url.searchParams.get('isSuperadmin') === 'true';

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Obtener módulos y secciones
    const { data: modules, error: modError } = await supabaseAdmin
      .from('modules')
      .select('*, module_sections(*)');

    if (modError) {
      return NextResponse.json({ error: 'Error cargando módulos: ' + modError.message }, { status: 500 });
    }

    // 2. Obtener perfiles de usuario
    let profilesQuery = supabaseAdmin.from('profiles').select('*, companies(*)');
    if (!isSuperadmin && companyId) {
      profilesQuery = profilesQuery.eq('company_id', companyId);
    }
    const { data: profiles, error: profError } = await profilesQuery;

    if (profError) {
      return NextResponse.json({ error: 'Error cargando perfiles: ' + profError.message }, { status: 500 });
    }

    // 3. Obtener el progreso real registrado
    let progressQuery = supabaseAdmin.from('user_progress').select('*');
    if (!isSuperadmin && companyId && profiles) {
      const userIds = profiles.map((p: any) => p.id);
      if (userIds.length > 0) {
        progressQuery = progressQuery.in('user_id', userIds);
      } else {
        return NextResponse.json({
          users: [],
          progressData: [],
          modules: modules || []
        });
      }
    }
    const { data: progressData, error: progError } = await progressQuery;

    if (progError) {
      return NextResponse.json({ error: 'Error cargando progreso: ' + progError.message }, { status: 500 });
    }

    return NextResponse.json({
      users: profiles || [],
      progressData: progressData || [],
      modules: modules || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      name,
      role = 'estudiante',
      rut,
      hireDate,
      companyId,
      companyCode
    } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email, password, name)' }, { status: 400 });
    }

    const assignedRole = (role === 'admin' || role === 'superadmin') ? role : 'estudiante';

    let formattedRut: string | null = null;
    if (rut && rut.trim()) {
      if (!validateRut(rut)) {
        return NextResponse.json({ error: 'El RUT ingresado no es válido según el Módulo 11 chileno.' }, { status: 400 });
      }
      formattedRut = formatRut(rut);
    }

    const supabaseAdmin = getSupabaseAdmin();

    const userMetadata: Record<string, any> = {
      name: name.trim(),
      role: assignedRole
    };
    if (formattedRut) userMetadata.rut = formattedRut;
    if (companyId) userMetadata.company_id = companyId;
    if (companyCode) userMetadata.company_code = companyCode;

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: userMetadata
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: assignedRole,
        rut: formattedRut,
        hire_date: hireDate || null,
        company_id: companyId || null,
        company_code: companyCode || null,
        last_active: new Date().toISOString()
      });

      if (profileError) {
        return NextResponse.json({ error: "Usuario creado en Auth pero falló el Perfil: " + profileError.message }, { status: 400 });
      }
    }

    await recordAuditLog({
      action: 'USUARIO_CREADO_POR_ADMIN',
      targetType: 'PROFILE',
      targetId: authData.user?.id,
      companyId: companyId || null,
      metadata: { role: assignedRole, email: email.trim().toLowerCase() }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Usuario (${assignedRole === 'admin' ? 'Administrador' : 'Estudiante'}) dado de alta exitosamente`, 
      user: authData.user 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, newPassword, newRole, hireDate, rut, name } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta el parámetro userId requerido' }, { status: 400 });
    }

    if (!newPassword && !newRole && hireDate === undefined && rut === undefined && name === undefined) {
      return NextResponse.json({ error: 'Se requiere newPassword, newRole, hireDate, rut o name para actualizar' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Si se provee nueva contraseña
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe contener al menos 6 caracteres' }, { status: 400 });
      }

      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (passError) {
        return NextResponse.json({ error: passError.message }, { status: 400 });
      }
    }

    // 2. Si se provee nuevo rol
    if (newRole) {
      if (!['admin', 'estudiante', 'superadmin'].includes(newRole)) {
        return NextResponse.json({ error: 'Rol no válido. Debe ser "admin", "superadmin" o "estudiante"' }, { status: 400 });
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, email, company_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.email === 'admin@diacero.com' && newRole !== 'admin' && newRole !== 'superadmin') {
        return NextResponse.json({ error: 'No está permitido degradar el rol de la cuenta principal de Administrador' }, { status: 403 });
      }

      // Regla de seguridad: Impedir degradar al último admin activo de la empresa
      if (profile?.role === 'admin' && newRole === 'estudiante' && profile.company_id) {
        const { data: companyAdmins } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('company_id', profile.company_id)
          .eq('role', 'admin');

        if ((companyAdmins || []).length <= 1) {
          return NextResponse.json({
            error: 'No está permitido degradar al último encargado activo de la organización. Debe existir al menos 1 administrador operativo.'
          }, { status: 403 });
        }
      }

      // Actualizar metadata de auth
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      });

      if (authError) {
        return NextResponse.json({ error: 'Error actualizando rol en autenticación: ' + authError.message }, { status: 500 });
      }

      // Actualizar en tabla profiles
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (profileError) {
        return NextResponse.json({ error: 'Error actualizando rol en perfiles: ' + profileError.message }, { status: 500 });
      }

      await recordAuditLog({
        action: 'CAMBIO_DE_ROL',
        targetType: 'PROFILE',
        targetId: userId,
        companyId: profile?.company_id || null,
        metadata: { oldRole: profile?.role, newRole }
      });
    }

    // 3. Si se provee fecha de contratación
    if (hireDate !== undefined) {
      const formattedDate = hireDate && hireDate.trim() ? hireDate.trim() : null;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('hire_date, email, company_id')
        .eq('id', userId)
        .maybeSingle();

      const { error: hireError } = await supabaseAdmin
        .from('profiles')
        .update({ hire_date: formattedDate })
        .eq('id', userId);

      if (hireError) {
        return NextResponse.json({ error: 'Error actualizando fecha de contratación: ' + hireError.message }, { status: 500 });
      }

      await recordAuditLog({
        action: 'CAMBIO_FECHA_CONTRATACION',
        targetType: 'PROFILE',
        targetId: userId,
        companyId: profile?.company_id || null,
        metadata: { oldHireDate: profile?.hire_date, newHireDate: formattedDate }
      });
    }

    // 4. Si se provee RUT
    if (rut !== undefined) {
      let formattedRut: string | null = null;
      if (rut && rut.trim()) {
        if (!validateRut(rut)) {
          return NextResponse.json({ error: 'El RUT ingresado no es válido según el Módulo 11 chileno.' }, { status: 400 });
        }
        formattedRut = formatRut(rut);
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('rut, email, company_id')
        .eq('id', userId)
        .maybeSingle();

      const { error: rutError } = await supabaseAdmin
        .from('profiles')
        .update({ rut: formattedRut })
        .eq('id', userId);

      if (rutError) {
        return NextResponse.json({ error: 'Error actualizando RUT: ' + rutError.message }, { status: 500 });
      }

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { rut: formattedRut }
      });

      await recordAuditLog({
        action: 'CAMBIO_RUT',
        targetType: 'PROFILE',
        targetId: userId,
        companyId: profile?.company_id || null,
        metadata: { oldRut: profile?.rut, newRut: formattedRut }
      });
    }

    // 5. Si se provee nombre
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
      }

      const trimmedName = name.trim();

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('name, email, company_id')
        .eq('id', userId)
        .maybeSingle();

      const { error: nameError } = await supabaseAdmin
        .from('profiles')
        .update({ name: trimmedName })
        .eq('id', userId);

      if (nameError) {
        return NextResponse.json({ error: 'Error actualizando nombre en perfiles: ' + nameError.message }, { status: 500 });
      }

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { name: trimmedName }
      });

      await recordAuditLog({
        action: 'CAMBIO_NOMBRE',
        targetType: 'PROFILE',
        targetId: userId,
        companyId: profile?.company_id || null,
        metadata: { oldName: profile?.name, newName: trimmedName }
      });
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta userId requerido' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, email, company_id')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.email === 'admin@diacero.com') {
      return NextResponse.json({ error: 'No está permitido eliminar la cuenta principal de Administrador del sistema' }, { status: 403 });
    }

    // Regla de seguridad: Impedir eliminar al último admin activo de la empresa
    if (profile?.role === 'admin' && profile.company_id) {
      const { data: companyAdmins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('role', 'admin');

      if ((companyAdmins || []).length <= 1) {
        return NextResponse.json({
          error: 'No está permitido eliminar al último encargado activo de la organización. Debe existir al menos 1 administrador operativo.'
        }, { status: 403 });
      }
    }

    // 1. Eliminar progreso y asignaciones del usuario
    await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    // 2. Eliminar perfil de la tabla profiles
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // 3. Eliminar usuario de Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: 'Error al eliminar usuario de autenticación: ' + authError.message }, { status: 500 });
    }

    await recordAuditLog({
      action: 'USUARIO_ELIMINADO',
      targetType: 'PROFILE',
      targetId: userId,
      companyId: profile?.company_id || null,
      metadata: { deletedEmail: profile?.email }
    });

    return NextResponse.json({ success: true, message: 'Alumno eliminado exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
