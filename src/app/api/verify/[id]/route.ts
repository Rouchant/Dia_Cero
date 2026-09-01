import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchesCertId, verifySignedCertId } from '@/lib/cert-hash';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const certId = id || '';

    if (!certId) {
      return NextResponse.json({ isValid: false, error: 'Código de certificado requerido' }, { status: 400 });
    }

    // 1. Check signed certificate token
    const signedCheck = verifySignedCertId(certId);
    if (signedCheck.isValid && signedCheck.data) {
      return NextResponse.json({
        isValid: true,
        certId,
        student: signedCheck.data.student,
        moduleTitle: signedCheck.data.moduleTitle,
        score: signedCheck.data.score,
        date: signedCheck.data.date
      });
    }

    // 2. Query Supabase using Service Role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: allProgress } = await supabaseAdmin.from('user_progress').select('*');
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const { data: modules } = await supabaseAdmin.from('modules').select('*, module_sections(*)');

    if (allProgress && profiles && modules) {
      const matchingProgress = allProgress.find(p => matchesCertId(certId, p.user_id, p.module_id));

      if (matchingProgress) {
        const profile = profiles.find(pr => pr.id === matchingProgress.user_id);
        const moduleData = modules.find(m => m.id === matchingProgress.module_id);

        if (profile && moduleData) {
          const totalSections = Math.max(1, moduleData.module_sections?.length || 1);
          const completedLen = Array.isArray(matchingProgress.completed_sections) ? matchingProgress.completed_sections.length : 0;
          const scorePerc = Math.round((completedLen / totalSections) * 100);

          return NextResponse.json({
            isValid: true,
            certId,
            student: profile.name || 'Colaborador Registrado',
            moduleTitle: moduleData.title || 'Capacitación en Seguridad Laboral',
            score: scorePerc > 100 ? 100 : scorePerc,
            date: new Date(matchingProgress.updated_at || new Date()).toLocaleDateString('es-ES', {
              timeZone: 'America/Santiago',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          });
        }
      }
    }

    return NextResponse.json({ isValid: false, certId, error: 'Certificado no encontrado en la base de datos' }, { status: 404 });
  } catch (error: any) {
    console.error('Error en GET /api/verify/[id]:', error);
    return NextResponse.json({ isValid: false, error: error?.message || 'Error del servidor' }, { status: 500 });
  }
}
