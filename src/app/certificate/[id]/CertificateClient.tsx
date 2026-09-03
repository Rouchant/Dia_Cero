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

      // 2. Direct Certificate Hash/Code Lookup (DC-...)
      if (moduleId.startsWith('DC-')) {
        const { data: allProgress } = await supabase.from('user_progress').select('*, profiles(name), modules(title)');
        if (allProgress) {
          const match = allProgress.find(p => generateCertId(p.user_id, p.module_id) === moduleId);
          if (match) {
            setData({
              userName: match.profiles?.name || 'Estudiante Día Cero',
              moduleTitle: match.modules?.title || 'Programa de Capacitación',
              score: 100,
              date: new Date(match.updated_at || match.created_at || new Date()).toLocaleDateString('es-ES', { timeZone: 'America/Santiago', year: 'numeric', month: 'long', day: 'numeric' }),
              certId: moduleId
            });
            setLoading(false);
            return;
          }
        }
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
        <p className="font-semibold font-headline animate-pulse">Generando certificado en papel virtual...</p>
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
      
      {/* Reglas CSS de Impresión Universales (Compacto, sin bordes, 1 sola página garantizada) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: portrait; 
            margin: 8mm 10mm; 
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #__next, body > div, .min-h-screen { 
             width: 100% !important; 
             height: auto !important; 
             min-height: 0 !important;
             margin: 0 !important; 
             padding: 0 !important; 
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
          }
          .certificate-paper {
             width: 100% !important;
             max-width: 172mm !important;
             height: auto !important;
             max-height: 200mm !important;
             margin: 0 auto !important;
             padding: 0 !important;
             box-sizing: border-box !important;
             border: none !important;
             box-shadow: none !important;
             page-break-inside: avoid !important;
             break-inside: avoid !important;
             page-break-after: avoid !important;
             break-after: avoid !important;
             page-break-before: avoid !important;
             -webkit-column-break-inside: avoid !important;
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
          }
          .certificate-paper-inner {
             position: relative !important;
             inset: auto !important;
             width: 100% !important;
             height: auto !important;
             border: none !important;
             padding: 0 !important;
             display: flex !important;
             flex-direction: column !important;
             align-items: center !important;
             background: #FFFFFF !important;
             background-color: #FFFFFF !important;
             page-break-inside: avoid !important;
             break-inside: avoid !important;
          }
          .certificate-paper-inner::before {
             display: none !important;
             content: none !important;
          }
          .certificate-qr-img {
             width: 44px !important;
             height: 44px !important;
             max-width: 44px !important;
             max-height: 44px !important;
             object-fit: contain !important;
             margin: 0 auto !important;
             display: block !important;
          }
          .certificate-seal {
             width: 52px !important;
             height: 52px !important;
             max-width: 52px !important;
             max-height: 52px !important;
          }
          .certificate-logo {
             height: 8mm !important;
             width: auto !important;
             max-height: 8mm !important;
             object-fit: contain !important;
          }
        }
      `}} />

      {/* Action Bar - Hidden in Print */}
      <div className="w-full max-w-[760px] flex flex-col sm:flex-row justify-between items-center mb-6 px-4 gap-4 print:hidden">
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

      {/* Actual Certificate Document Wrapper (Compressed vertical flow, borderless) */}
      <div className="w-full max-w-[760px] px-2 sm:px-4 mx-auto print:p-0 print:m-0 print:max-w-none">
        <div 
          className="certificate-paper [container-type:inline-size] w-full bg-white text-brand-blue relative shadow-2xl rounded-2xl mx-auto flex flex-col items-center p-[5cqw] sm:p-[6cqw] print:p-0 print:shadow-none print:rounded-none"
        >
           {/* Internal Container - Sin bordes, limpio y compacto */}
           <div className="certificate-paper-inner w-full flex flex-col items-center text-center bg-white z-10 print:p-0">
              
              {/* Header: Auth Badges & Logo */}
              <div className="w-full flex justify-between items-center mb-[2.5cqw] print:mb-3">
                 <div className="flex items-center gap-[1cqw] bg-brand-lightblue/10 px-[1.5cqw] py-[0.6cqw] rounded-lg border border-brand-blue/10 shadow-xs print:shadow-none print:border-none print:bg-transparent print:px-0">
                   <ShieldCheck className="h-[3.2cqw] w-[3.2cqw] text-brand-gold print:h-5 print:w-5" />
                   <div className="text-left leading-tight">
                     <p className="text-[1cqw] font-bold text-slate-500 uppercase tracking-widest print:text-[8px]">Validación Oficial</p>
                     <p className="text-[1.3cqw] font-bold text-brand-blue font-mono tracking-wider print:text-[11px]">ID-{certId}</p>
                   </div>
                 </div>
                 <div className="flex items-center justify-end">
                   <Logo className="certificate-logo h-[4.2cqw] w-auto object-contain opacity-90 print:h-[8mm]" />
                 </div>
              </div>

              {/* Top Block: Award Icon + Title */}
              <div className="flex flex-col items-center mb-[2.5cqw] print:mb-3">
                <Award className="h-[5cqw] w-[5cqw] text-brand-blue/15 mb-[0.5cqw] block pointer-events-none print:h-8 print:w-8 print:mb-1" />
                <h1 className="text-[3.8cqw] font-headline font-bold tracking-tight text-brand-blue mb-[0.2cqw] uppercase leading-none print:text-2xl">
                   Certificado
                </h1>
                <h2 className="text-[2.2cqw] font-headline font-light text-brand-green tracking-[0.25em] uppercase leading-snug print:text-base">
                   de Aprobación
                </h2>
              </div>

              {/* Middle Block: Recipient + Course */}
              <div className="flex flex-col items-center max-w-[90%] mb-[3cqw] print:mb-4">
                <p className="text-[1.1cqw] text-slate-500 uppercase tracking-[0.2em] mb-[1cqw] font-medium print:text-[10px] print:mb-1.5">
                   El presente documento formativo reconoce formalmente a
                </p>

                <h3 className="text-[3.4cqw] font-bold text-brand-blue font-headline mb-[1cqw] border-b-2 border-brand-lightblue/40 pb-[0.5cqw] inline-block px-[4cqw] uppercase tracking-wide leading-none print:text-2xl print:mb-1.5">
                   {data.userName}
                </h3>

                <p className="text-[1.3cqw] text-slate-600 font-medium mb-[1cqw] leading-relaxed mx-auto px-[2cqw] print:text-xs print:mb-1.5">
                  Por haber participado, asimilado y completado exitosamente con nivel de suficiencia, la examinación integral del programa de instrucción técnica:
                </p>
                
                <h4 className="text-[1.9cqw] font-bold text-brand-green uppercase leading-snug print:text-sm">
                  "{data.moduleTitle}"
                </h4>
              </div>

              {/* Footer Signatures & QR */}
              <div className="w-full flex justify-between items-end pt-[2cqw] border-t border-brand-blue/15 print:pt-3">
                 <div className="text-center w-1/3 flex flex-col items-center justify-end">
                   <div className="relative mb-[0.3cqw]">
                     <span className="font-signature text-[3cqw] text-brand-blue font-bold tracking-wide transform -rotate-6 block select-none pointer-events-none drop-shadow-xs leading-none print:text-xl">
                       DiaCero
                     </span>
                   </div>
                   <div className="h-px w-[14cqw] bg-brand-blue/30 mx-auto mb-[0.6cqw] print:w-20 print:mb-1"></div>
                   <p className="text-[1cqw] font-bold text-brand-blue uppercase tracking-wider print:text-[8px]">Comité Evaluador</p>
                   <p className="text-[0.8cqw] text-slate-500 font-medium uppercase mt-[0.2cqw] print:text-[6px]">Plataforma Diacero</p>
                 </div>
                 
                 <div className="flex flex-col items-center justify-end w-1/3">
                   <div className="certificate-seal bg-amber-50 text-brand-gold border-2 border-brand-gold/40 rounded-full h-[8cqw] w-[8cqw] max-w-[58px] max-h-[58px] flex flex-col items-center justify-center p-[0.5cqw] shadow-xs print:h-12 print:w-12">
                      <span className="text-[0.8cqw] font-bold uppercase tracking-wider opacity-80 mb-[0.2cqw] text-amber-800 print:text-[6px]">Rendimiento</span>
                      <span className="text-[2cqw] font-bold tracking-tight text-amber-700 leading-none print:text-sm">{data.score}%</span>
                   </div>
                 </div>

                 <div className="text-center w-1/3 flex flex-col items-center justify-end">
                   <a 
                     href={verifyUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     title="Verificar Sello Electrónico Oficial"
                     className="inline-block mb-[0.3cqw] group cursor-pointer"
                   >
                     <img 
                       src={qrCodeUrl} 
                       alt="QR Sello Electrónico Formal" 
                       className="certificate-qr-img h-[5cqw] w-[5cqw] max-w-[46px] max-h-[46px] object-contain mx-auto group-hover:scale-105 transition-all duration-200" 
                     />
                   </a>
                   <div className="h-px w-[14cqw] bg-brand-blue/30 mx-auto mb-[0.6cqw] print:w-20 print:mb-1"></div>
                   <p className="text-[1cqw] font-bold text-brand-blue uppercase tracking-wider print:text-[8px]">Otorgado el {data.date}</p>
                   <a 
                     href={verifyUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="hover:underline cursor-pointer"
                   >
                     <p className="text-[0.8cqw] text-slate-500 font-medium uppercase mt-[0.2cqw] print:text-[6px]">Sello Electrónico Formal (ID-{certId})</p>
                   </a>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
