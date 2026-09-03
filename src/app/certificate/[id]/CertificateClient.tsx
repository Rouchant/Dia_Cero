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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&ecc=L&data=${encodeURIComponent(verifyUrl)}&color=0F1F4B&bgcolor=FFFFFF`;

  useEffect(() => {
    async function loadCert() {
      // 1. Try to fetch verified certificate metadata via API endpoint
      try {
        const res = await fetch(`/api/verify/${moduleId}`);
        if (res.ok) {
          const verifyData = await res.json();
          if (verifyData.isValid) {
            setData({
              userName: verifyData.student,
              moduleTitle: verifyData.moduleTitle,
              score: verifyData.score,
              date: verifyData.date,
              certId: verifyData.certId
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("API verification lookup error:", err);
      }

      // 2. Direct student lookup fallback (when moduleId is a direct module ID like 'mod-1')
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const uid = authData.user.id;
        setUserId(uid);
        
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).maybeSingle();
        const { data: moduleData } = await supabase.from('modules').select('title, module_sections(*)').eq('id', moduleId).maybeSingle();
        const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', uid).eq('module_id', moduleId).maybeSingle();

        if (profile && moduleData && progress) {
          const totalSections = Math.max(1, moduleData.module_sections?.length || 1);
          const completedLen = Array.isArray(progress.completed_sections) ? progress.completed_sections.length : 0;
          const modPercentage = Math.round((completedLen / totalSections) * 100);

          setData({
            userName: profile.name,
            moduleTitle: moduleData.title,
            score: modPercentage > 100 ? 100 : modPercentage,
            date: new Date(progress.updated_at || new Date()).toLocaleDateString('es-ES', { timeZone: 'America/Santiago', year: 'numeric', month: 'long', day: 'numeric' }),
            certId: generateCertId(uid, moduleId)
          });
        }
      }
      setLoading(false);
    }
    loadCert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

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
        <p className="font-bold font-headline animate-pulse">Generando certificado en papel virtual...</p>
     </div>
  );

  if (!data) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-brand-blue">No hay registros de aprobación.</h2>
        <p className="text-slate-500 max-w-sm text-center">No pudimos verificar que poseas los requisitos en este módulo en este momento.</p>
        <Button onClick={()=>router.push('/dashboard')} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Seguridad</Button>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 md:py-10 print:bg-white print:py-0 print:min-h-0 flex flex-col items-center overflow-x-hidden">
      
      {/* Reglas CSS de Impresión Universales (Garantiza fondo blanco puro y proporciones perfectas en Carta y A4) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: letter portrait; 
            margin: 0; 
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #__next, body > div, .min-h-screen { 
             width: 100% !important; 
             height: 100% !important; 
             margin: 0 !important; 
             padding: 0 !important; 
             overflow: visible !important;
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
          }
          .certificate-paper {
             width: 8.5in !important;
             height: 11in !important;
             max-width: 8.5in !important;
             max-height: 11in !important;
             aspect-ratio: 8.5/11 !important;
             page-break-after: avoid !important;
             page-break-before: avoid !important;
             page-break-inside: avoid !important;
             border: none !important;
             box-shadow: none !important;
             position: relative !important;
             top: 0 !important;
             left: 0 !important;
             padding: 0.35in !important;
             margin: 0 auto !important;
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
          }
          .certificate-paper-inner {
             position: relative !important;
             inset: auto !important;
             width: 100% !important;
             height: 100% !important;
             padding: 1.5rem !important;
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
             border: 5px double rgba(29, 78, 216, 0.4) !important;
          }
          .certificate-paper-inner::before {
             display: none !important;
             content: none !important;
          }
        }
      `}} />

      {/* Action Bar - Hidden in Print */}
      <div className="w-full max-w-[8.5in] flex flex-col sm:flex-row justify-between items-center mb-8 px-4 gap-4 print:hidden">
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

      {/* Actual Certificate Document Wrapper */}
      <div className="certificate-paper w-full max-w-[8.5in] sm:aspect-[8.5/11] bg-white text-brand-blue relative shadow-2xl mx-auto flex flex-col items-center rounded-2xl sm:rounded-none overflow-hidden">
         
         {/* Internal Borders and Graphics */}
         <div className="certificate-paper-inner w-full sm:absolute sm:inset-6 md:inset-8 border-[4px] sm:border-[6px] border-double border-brand-blue/30 flex flex-col items-center p-4 sm:p-8 md:p-10 text-center bg-white z-10 print:inset-6 print:p-6">
            
            {/* Header: Auth Badges & Logo */}
            <div className="w-full flex justify-between items-start mb-3 sm:mb-6 md:mb-8 print:mb-3">
               <div className="flex items-center gap-2 md:gap-3 bg-brand-lightblue/10 px-4 py-2 rounded-lg border border-brand-blue/10 shadow-sm print:shadow-none print:border-none print:bg-transparent print:px-0">
                 <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-brand-gold" />
                 <div className="text-left leading-tight">
                   <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Validación Oficial</p>
                   <p className="text-[10px] md:text-sm font-black text-brand-blue font-mono tracking-wider">ID-{certId}</p>
                 </div>
               </div>
               <Logo className="opacity-90" />
            </div>

            <Award className="h-10 w-10 sm:h-16 sm:w-16 md:h-20 md:w-20 text-brand-blue/10 mb-2 sm:mb-4 md:mb-6 print:mb-3 print:h-12 print:w-12 block pointer-events-none" />

            {/* Core Typography Block */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-headline font-semibold tracking-tight text-brand-blue mb-1 uppercase print:text-4xl">
               Certificado
            </h1>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-headline font-light text-brand-green tracking-widest mb-3 sm:mb-6 md:mb-8 uppercase print:text-2xl print:mb-4">
               de Aprobación
            </h2>
            
            <p className="text-[9px] sm:text-xs text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3 md:mb-4 font-medium print:text-[10px] print:mb-2">
               El presente documento formativo reconoce formalmente a
            </p>

            <h3 className="text-xl sm:text-3xl md:text-4xl font-semibold text-brand-blue font-headline mb-3 sm:mb-6 md:mb-8 border-b-[2px] sm:border-b-[3px] border-brand-lightblue/40 pb-1.5 sm:pb-3 inline-block px-4 md:px-12 uppercase tracking-wide print:text-3xl print:mb-4">
               {data.userName}
            </h3>

            <p className="text-xs md:text-sm text-slate-600 font-medium mb-2 sm:mb-3 max-w-xl leading-relaxed mx-auto px-4 print:text-xs print:max-w-xl print:mb-2">
              Por haber participado, asimilado y completado exitosamente con nivel de suficiencia, la examinación integral del programa de instrucción técnica:
            </p>
            
            <h4 className="text-sm sm:text-lg lg:text-xl font-semibold text-brand-green max-w-xl mx-auto uppercase py-1 sm:py-2 leading-snug print:text-base print:py-1">
              "{data.moduleTitle}"
            </h4>

            {/* Flexible Spacer */}
            <div className="flex-1 min-h-4"></div>

            {/* Footer Signatures & QR */}
            <div className="w-full flex justify-between items-end mt-6 md:mt-12 px-2 md:px-8 pb-2 print:mt-auto print:pb-2">
               <div className="text-center w-1/3 flex flex-col items-center justify-end">
                 <div className="relative mb-1">
                   <span className="font-signature text-2xl sm:text-3xl md:text-4xl text-brand-blue font-bold tracking-wide transform -rotate-6 block select-none pointer-events-none drop-shadow-sm print:text-2xl">
                     DiaCero
                   </span>
                 </div>
                 <div className="h-px w-20 md:w-32 bg-brand-blue/30 mx-auto mb-2 print:bg-brand-blue/40"></div>
                 <p className="text-[8px] md:text-[10px] font-black text-brand-blue uppercase tracking-wider print:text-[9px]">Comité Evaluador</p>
                 <p className="text-[6px] md:text-[8px] text-slate-500 font-medium uppercase mt-0.5 print:text-[7px]">Plataforma Diacero</p>
               </div>
               
               <div className="flex flex-col items-center justify-end w-1/3">
                 <div className="bg-brand-yellow/10 text-brand-gold border-[3px] border-brand-gold/30 rounded-full h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 flex flex-col items-center justify-center p-2 shadow-lg relative -top-2 sm:-top-4 print:h-18 print:w-18 print:shadow-none print:bg-white print:border-brand-gold">
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider opacity-80 mb-0.5 print:text-[7px]">Rendimiento</span>
                    <span className="text-base sm:text-xl md:text-2xl font-black tracking-tight print:text-lg">{data.score}%</span>
                 </div>
               </div>

               <div className="text-center w-1/3 flex flex-col items-center justify-end">
                 <a 
                   href={verifyUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   title="Verificar Sello Electrónico Oficial"
                   className="inline-block mb-1 group cursor-pointer"
                 >
                   <img 
                     src={qrCodeUrl} 
                     alt="QR Sello Electrónico Formal" 
                     className="h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 print:h-14 print:w-14 object-contain mx-auto border-0 rounded-none shadow-none group-hover:scale-105 transition-all duration-200" 
                   />
                 </a>
                 <div className="h-px w-20 md:w-32 bg-brand-blue/30 mx-auto mb-2 print:bg-brand-blue/40"></div>
                 <p className="text-[8px] md:text-[10px] font-black text-brand-blue uppercase tracking-wider print:text-[9px]">Otorgado el {data.date}</p>
                 <a 
                   href={verifyUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="hover:underline cursor-pointer"
                 >
                   <p className="text-[6px] md:text-[8px] text-slate-500 font-medium uppercase mt-0.5 print:text-[7px]">Sello Electrónico Formal (ID-{certId})</p>
                 </a>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
