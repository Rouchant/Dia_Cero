import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRut, formatRut, cleanRut } from '@/lib/rut';
import { recordConsentAuditLog, recordAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      rut,
      email,
      password,
      hireDate,
      companyCode,
      termsAccepted,
      privacyAccepted
    } = body;

    // 1. Validar campos obligatorios
    if (!fullName || !rut || !email || !password || !hireDate || !companyCode) {
      return NextResponse.json({
        error: 'Todos los campos son obligatorios: nombre completo, RUT, correo, contraseña, fecha de contratación y código de empresa.'
      }, { status: 400 });
    }

    // 2. Validar formato chileno de RUT
    if (!validateRut(rut)) {
      return NextResponse.json({
        error: 'El RUT ingresado no es válido según el formato oficial chileno (Módulo 11).'
      }, { status: 400 });
    }
    const formattedRutStr = formatRut(rut);

    // 3. Validar opt-in activo de términos y privacidad (Ley 21.719)
    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json({
        error: 'Debe aceptar los Términos y Condiciones y la Política de Privacidad para registrar su cuenta.'
      }, { status: 400 });
    }

    // 4. Validar contraseña
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({
        error: 'La contraseña debe tener al menos 6 caracteres.'
      }, { status: 400 });
    }

    // 5. Validar existencia y vigencia de la empresa
    const cleanCompanyCode = companyCode.trim().toUpperCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, code, name, business_name, is_active')
      .eq('code', cleanCompanyCode)
      .maybeSingle();

    if (companyError || !company || !company.is_active) {
      return NextResponse.json({
        error: 'El código de empresa proporcionado no existe o no está autorizado en la plataforma.'
      }, { status: 400 });
    }

    // 6. Extraer IP y User-Agent para Audit Trail
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const userAgent = request.headers.get('user-agent') || 'Desconocido';

    // 7. Crear usuario en Supabase Auth con confirmación automática
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        name: fullName.trim(),
        role: 'estudiante',
        rut: formattedRutStr,
        company_id: company.id,
        company_code: company.code
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({
          error: 'El correo electrónico ya se encuentra registrado en la plataforma.'
        }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'No se pudo generar el usuario en el sistema de autenticación.' }, { status: 500 });
    }

    // 8. Crear o actualizar perfil en public.profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: email.trim().toLowerCase(),
      name: fullName.trim(),
      role: 'estudiante',
      rut: formattedRutStr,
      hire_date: hireDate,
      company_id: company.id,
      company_code: company.code,
      last_active: new Date().toISOString()
    });

    if (profileError) {
      console.error('Error al guardar perfil de estudiante:', profileError);
    }

    // 9. Asignar automáticamente el módulo de inducción obligatoria (mod-1) si existe
    try {
      const { data: defaultMod } = await supabaseAdmin
        .from('modules')
        .select('id')
        .eq('id', 'mod-1')
        .maybeSingle();

      if (defaultMod) {
        await supabaseAdmin.from('user_progress').insert({
          user_id: userId,
          module_id: defaultMod.id,
          completed_sections: [],
          quiz_scores: {},
          current_section_index: 0,
          last_ip_address: ipAddress,
          last_active_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error asignando módulo piloto:', e);
    }

    // 10. Registrar Audit Trail de consentimiento legal Ley 21.719
    await recordConsentAuditLog({
      userId,
      email: email.trim().toLowerCase(),
      termsVersion: 'v1.0-2026',
      privacyVersion: 'v1.0-ley-21719',
      ipAddress,
      userAgent
    });

    // 11. Registrar en logs de auditoría general
    await recordAuditLog({
      actorId: userId,
      actorEmail: email.trim().toLowerCase(),
      action: 'ESTUDIANTE_REGISTRADO',
      targetType: 'PROFILE',
      targetId: userId,
      companyId: company.id,
      ipAddress,
      metadata: {
        companyCode: company.code,
        rut: formattedRutStr,
        hireDate
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registro de estudiante completado exitosamente.',
      userId,
      companyName: company.name
    });

  } catch (err: any) {
    console.error('Error en API register:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
