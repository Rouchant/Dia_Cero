import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, name, role = 'estudiante' } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email, password, name)' }, { status: 400 });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'estudiante';

    // Usamos la Service Role Key (solo disponible en el servidor) para
    // crear usuarios como admin, lo que evita el envío del email de verificación.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← Confirma el email automáticamente, sin requerir verificación
      user_metadata: {
        name: name,
        role: assignedRole
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Insertar su perfil en la tabla pública de perfiles
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: assignedRole
      });

      if (profileError) {
        return NextResponse.json({ error: "Usuario creado en Auth pero falló el Perfil: " + profileError.message }, { status: 400 });
      }
    }

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
    const { userId, newPassword, newRole } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Falta el parámetro userId requerido' }, { status: 400 });
    }

    if (!newPassword && !newRole) {
      return NextResponse.json({ error: 'Se requiere newPassword o newRole para actualizar' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
      if (!['admin', 'estudiante'].includes(newRole)) {
        return NextResponse.json({ error: 'Rol no válido. Debe ser "admin" o "estudiante"' }, { status: 400 });
      }

      // No permitir degradar la cuenta administradora raíz
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.email === 'admin@diacero.com' && newRole !== 'admin') {
        return NextResponse.json({ error: 'No está permitido degradar el rol de la cuenta principal de Administrador' }, { status: 403 });
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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Evitar que se elimine a la cuenta administradora principal del sistema
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.email === 'admin@diacero.com') {
      return NextResponse.json({ error: 'No está permitido eliminar la cuenta principal de Administrador del sistema' }, { status: 403 });
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

    return NextResponse.json({ success: true, message: 'Alumno eliminado exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
