import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email, password, name)' }, { status: 400 });
    }

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
        role: 'estudiante'
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
        role: 'estudiante'
      });

      if (profileError) {
        return NextResponse.json({ error: "Usuario creado en Auth pero falló el Perfil: " + profileError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Estudiante dado de alta exitosamente sin requerir verificación de correo', user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
