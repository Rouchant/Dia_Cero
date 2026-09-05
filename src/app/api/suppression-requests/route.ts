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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, rut, fullName, companyCode, reason, details } = body;

    if (!email || !reason) {
      return NextResponse.json({
        error: 'El correo electrónico y el motivo de la solicitud son obligatorios.'
      }, { status: 400 });
    }

    let formattedRut: string | null = null;
    if (rut && rut.trim()) {
      if (!validateRut(rut)) {
        return NextResponse.json({
          error: 'El RUT ingresado no es válido según el Módulo 11 chileno.'
        }, { status: 400 });
      }
      formattedRut = formatRut(rut);
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Determinar la empresa asociada
    let companyId: string | null = null;
    if (companyCode && companyCode.trim()) {
      const { data: comp } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('code', companyCode.trim().toUpperCase())
        .maybeSingle();
      if (comp) {
        companyId = comp.id;
      }
    }

    // Si no se proveyó código de empresa, buscar en perfiles existentes por email o RUT
    if (!companyId) {
      const query = supabaseAdmin.from('profiles').select('company_id');
      if (formattedRut) {
        const { data: profRut } = await query.eq('rut', formattedRut).maybeSingle();
        if (profRut?.company_id) companyId = profRut.company_id;
      }
      if (!companyId) {
        const { data: profEmail } = await supabaseAdmin
          .from('profiles')
          .select('company_id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        if (profEmail?.company_id) companyId = profEmail.company_id;
      }
    }

    // Generar ticket único
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `SUP-${year}-${randomSuffix}`;

    // Obtener IP y User-Agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const userAgent = request.headers.get('user-agent') || 'Desconocido';

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('suppression_requests')
      .insert({
        ticket_number: ticketNumber,
        email: email.trim().toLowerCase(),
        rut: formattedRut,
        full_name: fullName?.trim() || null,
        company_id: companyId,
        reason: reason.trim(),
        details: details?.trim() || null,
        status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al registrar ticket de supresión:', insertError);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud: ' + insertError.message }, { status: 500 });
    }

    // Registrar en auditoría administrativa
    await recordAuditLog({
      actorEmail: email.trim().toLowerCase(),
      action: 'SOLICITUD_SUPRESION_CREADA',
      targetType: 'SUPPRESSION_TICKET',
      targetId: ticketNumber,
      companyId: companyId,
      ipAddress,
      metadata: { reason, email: email.trim().toLowerCase(), rut: formattedRut }
    });

    return NextResponse.json({
      success: true,
      ticketNumber,
      message: 'Solicitud de supresión de datos registrada exitosamente.'
    });

  } catch (err: any) {
    console.error('Error en POST suppression-requests:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from('suppression_requests')
      .select('*, companies(name, code)')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, status, resolutionNotes, adminId } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: 'ticketId y status son requeridos.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('suppression_requests')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Actualizar estado del ticket
    const { error: updateError } = await supabaseAdmin
      .from('suppression_requests')
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        processed_by: adminId || null,
        processed_at: now
      })
      .eq('id', ticketId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Si fue aprobado, ejecutar anonimización del perfil y retención legal del certificado
    if (status === 'approved') {
      const email = ticket.email;
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        // Anonimizar perfil en tabla pública
        const anonymizedName = `Usuario Anonimizado (${ticket.ticket_number})`;
        await supabaseAdmin
          .from('profiles')
          .update({
            name: anonymizedName,
            rut: 'ANONIMIZADO',
            email: `anonimo_${Date.now()}@diacero.anonymized.local`
          })
          .eq('id', profile.id);

        // Bloquear o archivar certificados para cumplimiento legal acotado (Ley 16.744 / SUSESO)
        await supabaseAdmin
          .from('certificates')
          .update({
            status: 'archived',
            metadata: {
              suppression_ticket: ticket.ticket_number,
              archived_reason: 'Ejercicio de Derecho de Supresión Ley 21.719 - Conservación legal acotada D.S. 40',
              archived_at: now
            }
          })
          .eq('student_id', profile.id);

        // Desactivar usuario en Supabase Auth
        try {
          await supabaseAdmin.auth.admin.deleteUser(profile.id);
        } catch (e) {
          console.error('Error al deshabilitar usuario auth:', e);
        }
      }
    }

    // Registrar en auditoría
    await recordAuditLog({
      actorId: adminId || null,
      action: `TICKET_SUPRESION_${status.toUpperCase()}`,
      targetType: 'SUPPRESSION_TICKET',
      targetId: ticket.ticket_number,
      companyId: ticket.company_id,
      metadata: { status, resolutionNotes }
    });

    return NextResponse.json({
      success: true,
      message: `Solicitud ${status === 'approved' ? 'aprobada y procesada con anonimización legal' : 'actualizada'}.`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
