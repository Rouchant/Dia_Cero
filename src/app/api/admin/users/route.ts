import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email, password, name)' }, { status: 400 });
    }

    // Usamos el cliente regular pero deshabilitamos la persistencia en cookies.
    // Esto es CLAVE para poder crear en Auth.Users sin que se cierre la sesión 
    // del Administrador que está activo operando en el navegador.
    const adminAuthClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: signUpError } = await adminAuthClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: 'estudiante' // Por defecto se crean como estudiantes normales
        }
      }
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // Insertar su perfil explícitamente en la tabla pública usando 
    // la sesión recién generada en memoria de este cliente.
    if (authData.user) {
      const { error: profileError } = await adminAuthClient.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'estudiante'
      });

      if (profileError) {
        return NextResponse.json({ error: "Usuario creado en Auth pero falló el Perfil: " + profileError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario creado exitosamente en Auth y Profiles', user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
