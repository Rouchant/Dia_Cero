import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, email, role: requestedRole } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Obtener datos de Auth para comprobar metadatos
    let authUser: any = null;
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      authUser = data.user;
    } catch {
      // Si no tiene permisos de admin auth, continuar con lo disponible
    }

    const userEmail = authUser?.email || email || '';
    const emailLower = userEmail.toLowerCase();
    const metaRole = (authUser?.user_metadata?.role || authUser?.app_metadata?.role || requestedRole || '').toLowerCase();

    // 2. Determinar rol con mayor privilegio
    let determinedRole = 'estudiante';
    if (
      emailLower === 'admin@diacero.com' ||
      emailLower.includes('superadmin') ||
      metaRole === 'superadmin' ||
      requestedRole === 'superadmin'
    ) {
      determinedRole = 'superadmin';
    } else if (
      metaRole === 'admin' ||
      requestedRole === 'admin' ||
      emailLower.includes('admin')
    ) {
      determinedRole = 'admin';
    }

    // 3. Consultar perfil en DB
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      // Crear perfil que faltaba en profiles
      const newProfile = {
        id: userId,
        email: userEmail,
        name: authUser?.user_metadata?.name || authUser?.user_metadata?.full_name || (userEmail ? userEmail.split('@')[0] : 'Usuario'),
        role: determinedRole,
        last_active: new Date().toISOString()
      };

      const { data: created, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        created: true,
        profile: created,
        isSuperadmin: created.role === 'superadmin',
        isAdmin: created.role === 'admin' || created.role === 'superadmin'
      });
    } else {
      // Si el perfil existe pero se detectó que es superadmin/admin en Auth o email
      let currentRole = existingProfile.role;
      if (
        determinedRole === 'superadmin' &&
        currentRole !== 'superadmin'
      ) {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'superadmin', last_active: new Date().toISOString() })
          .eq('id', userId);
        currentRole = 'superadmin';
      } else if (
        determinedRole === 'admin' &&
        currentRole === 'estudiante'
      ) {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin', last_active: new Date().toISOString() })
          .eq('id', userId);
        currentRole = 'admin';
      }

      return NextResponse.json({
        success: true,
        created: false,
        profile: { ...existingProfile, role: currentRole },
        isSuperadmin: currentRole === 'superadmin' || emailLower === 'admin@diacero.com',
        isAdmin: currentRole === 'admin' || currentRole === 'superadmin' || emailLower === 'admin@diacero.com'
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
