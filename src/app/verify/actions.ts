'use server';

import { createClient } from '@supabase/supabase-js';
import { matchesCertId, verifySignedCertId } from '@/lib/cert-hash';

export interface PublicVerifyResult {
  isValid: boolean;
  student?: string;
  studentRut?: string;
  studentHireDate?: string;
  moduleTitle?: string;
  companyName?: string;
  companyRut?: string;
  companyLogoUrl?: string;
  signerName?: string;
  signerRole?: string;
  score?: number;
  date?: string;
  certId?: string;
}

export async function verifyCertificateAction(
  certId: string, 
  fallbackStudent?: string | null, 
  fallbackModule?: string | null, 
  fallbackScore?: string | null, 
  fallbackDate?: string | null
): Promise<PublicVerifyResult> {
  if (!certId) return { isValid: false };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Consulta Prioritaria a la tabla inmutable public.certificates
    const { data: certRecord } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('id', certId)
      .maybeSingle();

    if (certRecord && certRecord.status === 'valid') {
      return {
        isValid: true,
        certId: certRecord.id,
        student: certRecord.student_name,
        studentRut: certRecord.student_rut,
        studentHireDate: certRecord.student_hire_date ? new Date(certRecord.student_hire_date).toLocaleDateString('es-ES', { timeZone: 'America/Santiago' }) : undefined,
        moduleTitle: certRecord.module_title,
        companyName: certRecord.company_name,
        companyRut: certRecord.company_rut,
        companyLogoUrl: certRecord.company_logo_url,
        signerName: certRecord.signer_name,
        signerRole: certRecord.signer_role,
        score: certRecord.score || 100,
        date: new Date(certRecord.issued_at || certRecord.created_at).toLocaleDateString('es-ES', {
          timeZone: 'America/Santiago',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    }

    // 2. Token criptográfico firmado
    const signedCheck = verifySignedCertId(certId);
    if (signedCheck.isValid && signedCheck.data) {
      return {
        isValid: true,
        certId,
        student: signedCheck.data.student,
        moduleTitle: signedCheck.data.moduleTitle,
        score: signedCheck.data.score,
        date: signedCheck.data.date
      };
    }

    // 3. Verificación dinámica desde progreso de usuario y auto-sellado inmutable en certificates
    const { data: allProgress } = await supabaseAdmin.from('user_progress').select('*');
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*, companies(*)');
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

          const comp = profile.companies;
          const companyName = comp?.business_name || comp?.name || 'Día Cero Prevención SpA';
          const companyRut = comp?.rut || '76.543.210-K';
          const companyLogoUrl = comp?.logo_url || null;

          const studentName = profile.name || 'Colaborador Registrado';
          const studentRut = profile.rut || '11.111.111-1';
          const studentHireDate = profile.hire_date || null;
          const signerName = 'Director de Capacitación y Prevención';
          const signerRole = 'Representante Técnico Autorizado';

          // Auto-inscribir en tabla certificates para inmutabilidad futura
          await supabaseAdmin.from('certificates').upsert({
            id: certId,
            student_id: profile.id,
            student_name: studentName,
            student_rut: studentRut,
            student_hire_date: studentHireDate,
            company_id: profile.company_id || null,
            company_name: companyName,
            company_rut: companyRut,
            company_logo_url: companyLogoUrl,
            signer_name: signerName,
            signer_role: signerRole,
            module_id: moduleData.id,
            module_title: moduleData.title,
            score: scorePerc > 100 ? 100 : scorePerc,
            status: 'valid',
            issued_at: matchingProgress.updated_at || new Date().toISOString()
          });

          return {
            isValid: true,
            certId,
            student: studentName,
            studentRut,
            studentHireDate: studentHireDate ? new Date(studentHireDate).toLocaleDateString('es-ES') : undefined,
            moduleTitle: moduleData.title || 'Capacitación en Seguridad Laboral',
            companyName,
            companyRut,
            companyLogoUrl,
            signerName,
            signerRole,
            score: scorePerc > 100 ? 100 : scorePerc,
            date: new Date(matchingProgress.updated_at || new Date()).toLocaleDateString('es-ES', {
              timeZone: 'America/Santiago',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          };
        }
      }
    }

    // 4. Fallback para registros demo iniciales
    if (fallbackStudent && fallbackModule && (certId === 'VALIDATED' || certId === 'FHUJK2')) {
      return {
        isValid: true,
        certId,
        student: fallbackStudent,
        moduleTitle: fallbackModule,
        score: parseInt(fallbackScore || '100', 10),
        date: fallbackDate || '26 de Agosto de 2026'
      };
    }
  } catch (error) {
    console.error('Error verifying certificate on server:', error);
  }

  return { isValid: false };
}
