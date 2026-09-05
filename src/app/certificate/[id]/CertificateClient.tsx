"use client"

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Printer, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { generateCertId } from '@/lib/cert-hash';

export default function CertificateClient({ moduleId }: { moduleId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  const certId = React.useMemo(() => {
    if (data?.certId) {
      return data.certId;
    }
    if (userId && moduleId) {
      return generateCertId(userId, moduleId);
    }
    if (moduleId && moduleId.startsWith('DC-')) {
      return moduleId;
    }
    return 'DC-VALIDATED';
  }, [userId, moduleId, data?.certId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const verifyUrl = `${origin || 'http://localhost:9002'}/verify/${certId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&ecc=L&data=${encodeURIComponent(verifyUrl)}&color=0F1F4B&bgcolor=FFFFFF`;

  useEffect(() => {
    async function loadCert() {
      setLoading(true);

      // 1. Intentar consultar primero la tabla inmutable public.certificates
      try {
        const { data: certDb } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', moduleId)
          .maybeSingle();

        if (certDb) {
          setData({
            userName: certDb.student_name,
            userRut: certDb.student_rut,
            userHireDate: certDb.student_hire_date,
            companyName: certDb.company_name,
            companyRut: certDb.company_rut,
            companyLogoUrl: certDb.company_logo_url,
            signerName: certDb.signer_name,
            signerRole: certDb.signer_role,
            moduleTitle: certDb.module_title,
            score: certDb.score || 100,
            date: new Date(certDb.issued_at || certDb.created_at).toLocaleDateString('es-ES', {
              timeZone: 'America/Santiago',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            certId: certDb.id
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error consultando certificates table:", err);
      }

      // 2. Consulta a API de verificación
      try {
        const res = await fetch(`/api/verify/${moduleId}`);
        if (res.ok) {
          const verifyData = await res.json();
          if (verifyData.isValid) {
            setData({
              userName: verifyData.student,
              userRut: verifyData.studentRut,
              userHireDate: verifyData.studentHireDate,
              companyName: verifyData.companyName,
              companyRut: verifyData.companyRut,
              companyLogoUrl: verifyData.companyLogoUrl,
              signerName: verifyData.signerName,
              signerRole: verifyData.signerRole,
              moduleTitle: verifyData.moduleTitle,
              score: verifyData.score,
              date: verifyData.date,
              certId: verifyData.certId || moduleId
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("API verification lookup error:", err);
      }

      // 3. Consulta de estudiante autenticado con datos de empresa enriquecidos
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const uid = authData.user.id;
        setUserId(uid);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, companies(*)')
          .eq('id', uid)
          .maybeSingle();

        const { data: moduleData } = await supabase
          .from('modules')
          .select('id, title, module_sections(*)')
          .eq('id', moduleId)
          .maybeSingle();

        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', uid)
          .eq('module_id', moduleId)
          .maybeSingle();

        if (profile && moduleData && progress) {
          const totalSections = Math.max(1, moduleData.module_sections?.length || 1);
          const completedLen = Array.isArray(progress.completed_sections) ? progress.completed_sections.length : 0;
          const modPercentage = Math.round((completedLen / totalSections) * 100);
          const computedCertId = generateCertId(uid, moduleId);

          const comp = profile.companies;
          const compName = comp?.business_name || comp?.name || 'Día Cero Prevención SpA';
          const compRut = comp?.rut || '76.543.210-K';
          const compLogo = comp?.logo_url || null;

          const certPayload = {
            userName: profile.name,
            userRut: profile.rut,
            userHireDate: profile.hire_date ? new Date(profile.hire_date).toLocaleDateString('es-ES', { timeZone: 'America/Santiago' }) : undefined,
            companyName: compName,
            companyRut: compRut,
            companyLogoUrl: compLogo,
            signerName: 'Director de Capacitación y Prevención',
            signerRole: 'Representante Técnico Autorizado',
            moduleTitle: moduleData.title,
            score: modPercentage > 100 ? 100 : modPercentage,
            date: new Date(progress.updated_at || new Date()).toLocaleDateString('es-ES', { timeZone: 'America/Santiago', year: 'numeric', month: 'long', day: 'numeric' }),
            certId: computedCertId
          };

          // Auto-inscribir de forma inmutable en tabla certificates
          try {
            await supabase.from('certificates').upsert({
              id: computedCertId,
              student_id: profile.id,
              student_name: profile.name,
              student_rut: profile.rut || '11.111.111-1',
              student_hire_date: profile.hire_date || null,
              company_id: profile.company_id || null,
              company_name: compName,
              company_rut: compRut,
              company_logo_url: compLogo,
              signer_name: certPayload.signerName,
              signer_role: certPayload.signerRole,
              module_id: moduleData.id,
              module_title: moduleData.title,
              score: certPayload.score,
              status: 'valid',
              issued_at: progress.updated_at || new Date().toISOString()
            });
          } catch (e) {
            console.error('Error sellando en certificates:', e);
          }

          setData(certPayload);
        }
      }
      setLoading(false);
    }
    loadCert();
  }, [moduleId, supabase]);

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      try {
        window.print();
      } catch (err) {
        console.error('Error invoking print dialog:', err);
      }
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 text-brand-blue/70">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
        <p className="font-semibold font-headline animate-pulse">Generando certificado oficial y sellado inmutable...</p>
     </div>
  );

  if (!data) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-brand-blue">No hay registros de aprobación.</h2>
        <p className="text-slate-500 max-w-sm text-center text-xs">No pudimos verificar que poseas los requisitos en este módulo en este momento.</p>
        <Button onClick={()=>router.push('/dashboard')} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel</Button>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-900/90 py-8 px-2 sm:px-4 flex flex-col items-center justify-center font-sans print:bg-white print:p-0 print:m-0">
      
      {/* Estilos CSS estrictos para impresión Landscape */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: letter landscape;
          margin: 0 !important;
        }
        @media print {
          html, body {
            width: 279.4mm !important;
            height: 215.9mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          .certificate-paper {
            width: 279.4mm !important;
            height: 215.9mm !important;
            max-width: 279.4mm !important;
            max-height: 215.9mm !important;
            margin: 0 !important;
            padding: 9mm 14mm !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      {/* Action Bar - Hidden in Print */}
      <div className="w-full max-w-[860px] flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4 print:hidden">
        <Button 
          type="button"
          onClick={() => router.push('/dashboard')} 
          className="w-full sm:w-auto hover-lift bg-brand-lightblue hover:bg-[#0ea5e9] text-white font-semibold shadow-lg shadow-brand-lightblue/20 rounded-xl px-6 h-12 active:scale-95 transition-all"
        >
           <ArrowLeft className="mr-2 h-4 w-4"/> Volver al Panel
        </Button>
        <Button 
          type="button"
          onClick={handlePrint} 
          className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold shadow-lg shadow-brand-blue/20 border border-brand-blue rounded-xl px-6 h-12 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
           <Printer className="h-5 w-5"/> Imprimir o Guardar PDF
        </Button>
      </div>

      {/* Documento Certificado Oficial */}
      <div className="w-full max-w-[860px] px-2 sm:px-4 mx-auto print:p-0 print:m-0 print:max-w-none">
        <div 
          className="certificate-paper [container-type:inline-size] w-full aspect-[11/8.5] bg-white text-brand-blue relative shadow-2xl rounded-2xl mx-auto flex flex-col justify-between p-[3.5cqw] sm:p-[4cqw] print:p-0 print:shadow-none print:rounded-none"
        >
           <div className="certificate-paper-inner w-full h-full flex flex-col justify-between items-center text-center bg-white z-10 print:p-0">
              
              {/* Header: Código Hash, Empresa y Logos */}
              <div className="w-full flex justify-between items-center">
                 <div className="flex items-center gap-[1cqw] bg-brand-lightblue/10 px-[1.5cqw] py-[0.5cqw] rounded-lg border border-brand-blue/10 shadow-xs print:shadow-none print:border-none print:bg-transparent print:px-0">
                   <ShieldCheck className="h-[2.8cqw] w-[2.8cqw] text-brand-gold print:h-5 print:w-5" />
                   <div className="text-left leading-tight">
                     <p className="text-[0.9cqw] font-bold text-slate-500 uppercase tracking-widest print:text-[8px]">Certificado Acreditado</p>
                     <p className="text-[1.2cqw] font-bold text-brand-blue font-mono tracking-wider print:text-[11px]">{certId}</p>
                   </div>
                 </div>

                 {/* Logos Corporativos Vigentes */}
                 <div className="flex items-center gap-3">
                   {data.companyLogoUrl ? (
                     <img 
                       src={data.companyLogoUrl} 
                       alt={data.companyName || 'Logo Empresa'} 
                       className="h-[4.5cqw] max-w-[120px] object-contain print:h-[10mm]" 
                     />
                   ) : (
                     <div className="text-right">
                       <p className="text-[1cqw] font-bold text-slate-800 uppercase print:text-[8px]">{data.companyName}</p>
                       <p className="text-[0.8cqw] font-mono text-slate-500 print:text-[7px]">RUT: {data.companyRut}</p>
                     </div>
                   )}
                   <div className="h-6 w-px bg-slate-200 mx-1 print:hidden" />
                   <Logo className="h-[4cqw] w-auto object-contain opacity-90 print:h-[8.5mm]" />
                 </div>
              </div>

              {/* Título Principal */}
              <div className="flex flex-col items-center my-auto pt-[0.5cqw]">
                <Award className="h-[4.8cqw] w-[4.8cqw] text-brand-blue/15 mb-[0.4cqw] block pointer-events-none print:h-8 print:w-8 print:mb-1" />
                <h1 className="text-[3.6cqw] font-headline font-bold tracking-tight text-brand-blue mb-[0.1cqw] uppercase leading-none print:text-2xl">
                   Certificado
                </h1>
                <h2 className="text-[2.2cqw] font-headline font-light text-brand-green tracking-[0.25em] uppercase leading-snug print:text-base">
                   de Acreditación Laboral
                </h2>
              </div>

              {/* Receptor, RUT, Empresa y Curso */}
              <div className="flex flex-col items-center my-auto max-w-[85%] py-[0.5cqw]">
                <p className="text-[1cqw] text-slate-500 uppercase tracking-[0.2em] mb-[0.8cqw] font-medium print:text-[10px] print:mb-1.5">
                   Por cuanto se reconoce formalmente a
                </p>

                <h3 className="text-[3.2cqw] font-bold text-brand-blue font-headline mb-[0.3cqw] border-b-2 border-brand-lightblue/40 pb-[0.4cqw] inline-block px-[4cqw] uppercase tracking-wide leading-none print:text-2xl print:mb-1">
                   {data.userName}
                </h3>

                {data.userRut && (
                  <p className="text-[1.1cqw] font-mono font-bold text-slate-600 mb-[0.6cqw] print:text-xs">
                    RUT: {data.userRut} {data.userHireDate ? `• Fecha de Ingreso: ${data.userHireDate}` : ''}
                  </p>
                )}

                <p className="text-[1.1cqw] text-slate-600 font-medium mb-[0.6cqw] leading-relaxed mx-auto px-[2cqw] print:text-xs print:mb-1.5">
                  Colaborador de <strong>{data.companyName}</strong> (RUT: {data.companyRut}), por haber superado satisfactoriamente la examinación del programa normativo de seguridad ocupacional:
                </p>
                
                <h4 className="text-[1.8cqw] font-bold text-brand-green uppercase leading-snug print:text-sm">
                  "{data.moduleTitle}"
                </h4>
              </div>

              {/* Pie de firmas, Sello de Rendimiento y Código QR */}
              <div className="w-full flex justify-between items-end pt-[1.5cqw] border-t border-brand-blue/15 mt-auto">
                 <div className="text-center w-1/3 flex flex-col items-center justify-end">
                   <div className="relative mb-[0.2cqw]">
                     <span className="font-signature text-[2.8cqw] text-brand-blue font-bold tracking-wide transform -rotate-6 block select-none pointer-events-none drop-shadow-xs leading-none print:text-xl">
                       DiaCero
                     </span>
                   </div>
                   <div className="h-px w-[12cqw] bg-brand-blue/30 mx-auto mb-[0.5cqw] print:w-20 print:mb-1"></div>
                   <p className="text-[0.9cqw] font-bold text-brand-blue uppercase tracking-wider print:text-[8px]">{data.signerName || 'Representante Técnico'}</p>
                   <p className="text-[0.7cqw] text-slate-500 font-medium uppercase mt-[0.2cqw] print:text-[6px]">{data.signerRole || 'Comité Evaluador Día Cero'}</p>
                 </div>
                 
                 <div className="flex flex-col items-center justify-end w-1/3">
                   <div className="certificate-seal bg-amber-50 text-brand-gold border-2 border-brand-gold/40 rounded-full h-[7.5cqw] w-[7.5cqw] max-w-[58px] max-h-[58px] flex flex-col items-center justify-center p-[0.4cqw] shadow-xs print:h-12 print:w-12">
                      <span className="text-[0.7cqw] font-bold uppercase tracking-wider opacity-80 mb-[0.1cqw] text-amber-800 print:text-[6px]">Calificación</span>
                      <span className="text-[2cqw] font-bold tracking-tight text-amber-700 leading-none print:text-sm">{data.score}%</span>
                   </div>
                 </div>

                 <div className="text-center w-1/3 flex flex-col items-center justify-end">
                   <a 
                     href={verifyUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     title="Verificar Sello Electrónico Oficial"
                     className="inline-block mb-[0.2cqw] group cursor-pointer"
                   >
                     <img 
                       src={qrCodeUrl} 
                       alt="QR Sello Electrónico Formal" 
                       className="certificate-qr-img h-[4.8cqw] w-[4.8cqw] max-w-[46px] max-h-[46px] object-contain mx-auto group-hover:scale-105 transition-all duration-200" 
                     />
                   </a>
                   <div className="h-px w-[12cqw] bg-brand-blue/30 mx-auto mb-[0.5cqw] print:w-20 print:mb-1"></div>
                   <p className="text-[0.9cqw] font-bold text-brand-blue uppercase tracking-wider print:text-[8px]">Otorgado el {data.date}</p>
                   <a 
                     href={verifyUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="hover:underline cursor-pointer"
                   >
                     <p className="text-[0.7cqw] text-slate-500 font-medium uppercase mt-[0.2cqw] print:text-[6px]">Sello Inmutable (ID-{certId})</p>
                   </a>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
