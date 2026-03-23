"use client"

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Printer, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function CertificateClient({ moduleId }: { moduleId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const certId = React.useMemo(() => Math.random().toString(36).substring(2, 8).toUpperCase(), []);

  useEffect(() => {
    async function loadCert() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }

      const uid = authData.user.id;
      
      const { data: profile } = await supabase.from('profiles').select('name').eq('id', uid).single();
      const { data: moduleData } = await supabase.from('modules').select('title, module_sections(*)').eq('id', moduleId).single();
      const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', uid).eq('module_id', moduleId).single();

      if (profile && moduleData && progress) {
        const totalSections = Math.max(1, moduleData.module_sections?.length || 1);
        const completedLen = Array.isArray(progress.completed_sections) ? progress.completed_sections.length : 0;
        const modPercentage = Math.round((completedLen / totalSections) * 100);

        setData({
          userName: profile.name,
          moduleTitle: moduleData.title,
          score: modPercentage > 100 ? 100 : modPercentage,
          date: new Date(progress.updated_at || new Date()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        });
      }
      setLoading(false);
    }
    loadCert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="font-bold font-headline animate-pulse">Forjando certificado en papel virtual...</p>
     </div>
  );

  if (!data) return (
     <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">No hay registros de aprobación.</h2>
        <p className="text-slate-500 max-w-sm text-center">No pudimos verificar que poseas los requisitos en este módulo en este momento.</p>
        <Button onClick={()=>router.push('/dashboard')} className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Seguridad</Button>
     </div>
  );

  // Layout specifically engineered for Strict US LETTER PORTRAIT length
  return (
    <div className="min-h-screen bg-slate-100 py-6 md:py-10 print:bg-white print:py-0 print:min-h-0 flex flex-col items-center overflow-x-hidden">
      
      {/* Forzar tamaño Carta (Letter) Vertical en la impresora física + Prevenir Salto de Página */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: letter portrait; margin: 0; }
          html, body { 
             width: 8.5in !important; 
             height: 11in !important; 
             margin: 0 !important; 
             padding: 0 !important; 
             overflow: hidden !important;
             -webkit-print-color-adjust: exact; 
             print-color-adjust: exact; 
             background-color: white !important;
          }
          .certificate-paper {
             width: 8.5in !important;
             height: 11in !important;
             max-height: 11in !important;
             page-break-after: avoid !important;
             page-break-before: avoid !important;
             page-break-inside: avoid !important;
             border: none !important;
             box-shadow: none !important;
             position: absolute !important;
             top: 0 !important;
             left: 0 !important;
             padding: 0 !important;
             margin: 0 !important;
          }
        }
      `}} />

      {/* Action Bar - Hidden in Print */}
      <div className="w-full max-w-[8.5in] flex flex-col sm:flex-row justify-between items-center mb-8 px-4 gap-4 print:hidden">
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="bg-white hover:bg-slate-50 border-slate-300 font-bold shadow-sm">
           <ArrowLeft className="mr-2 h-4 w-4"/> Volver al Panel
        </Button>
        <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-200">
           <Printer className="mr-2 h-5 w-5"/> Imprimir Diploma Oficial
        </Button>
      </div>

      {/* Actual Certificate Document Wrapper (Strict US Letter Format: 8.5 x 11 inches) */}
      <div className="certificate-paper w-full max-w-[8.5in] aspect-[8.5/11] bg-white text-slate-900 relative overflow-hidden shadow-2xl mx-auto flex flex-col items-center">
         
         {/* Internal Borders and Graphics */}
         <div className="absolute inset-4 sm:inset-6 md:inset-8 border-[6px] border-double border-indigo-200/60 flex flex-col items-center p-6 sm:p-8 md:p-12 text-center bg-white z-10 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] before:from-indigo-50/20 before:to-transparent before:-z-10 print:inset-6 print:p-8">
            
            {/* Header: Auth Badges & Logo */}
            <div className="w-full flex justify-between items-start mb-6 md:mb-12 print:mb-14">
               <div className="flex items-center gap-2 md:gap-3 bg-slate-50/80 px-4 py-2 rounded-lg border border-slate-100 shadow-sm print:shadow-none print:border-none print:bg-transparent print:px-0">
                 <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
                 <div className="text-left leading-tight">
                   <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validación Oficial</p>
                   <p className="text-[10px] md:text-sm font-black text-emerald-600 font-mono tracking-wider">ID-{certId}</p>
                 </div>
               </div>
               <Logo className="h-10 md:h-12 w-auto grayscale opacity-80 mix-blend-multiply" />
            </div>

            <Award className="h-16 w-16 md:h-24 md:w-24 text-indigo-500/10 mb-6 md:mb-8 print:mb-10" />

            {/* Core Typography Block */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black tracking-tighter text-slate-800 mb-1 uppercase print:text-5xl">
               Certificado
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-headline font-light text-slate-500 tracking-widest mb-8 md:mb-12 uppercase print:text-3xl print:mb-16">
               de Aprobación
            </h2>
            
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-[0.2em] mb-4 md:mb-6 font-medium print:text-[11px]">
               El presente documento formativo reconoce formalmente a
            </p>

            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-indigo-700 font-headline mb-8 md:mb-12 border-b-[3px] border-indigo-100 pb-2 md:pb-4 inline-block px-4 md:px-12 uppercase tracking-wide print:text-4xl print:mb-16">
               {data.userName}
            </h3>

            <p className="text-xs md:text-sm lg:text-base text-slate-600 font-medium mb-4 max-w-xl leading-relaxed mx-auto px-4 print:text-sm print:max-w-2xl">
              Por haber participado, asimilado y completado exitosamente con nivel de suficiencia, la examinación integral del programa de instrucción técnica:
            </p>
            
            <h4 className="text-base md:text-lg lg:text-xl font-black text-slate-800 max-w-xl mx-auto uppercase py-4 leading-snug print:text-lg">
              "{data.moduleTitle}"
            </h4>

            {/* Spacer against overflowing bounds */}
            <div className="flex-1"></div>

            {/* Footer Signatures (Stacked or spaced differently for Vertical) */}
            <div className="w-full flex justify-between items-end mt-12 md:mt-24 px-2 md:px-8 pb-4 print:mt-16">
               <div className="text-center w-1/3">
                 <div className="h-px w-20 md:w-32 bg-slate-300 mx-auto mb-3 print:bg-slate-400"></div>
                 <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-wider print:text-[10px]">Comité Evaluador</p>
                 <p className="text-[6px] md:text-[8px] text-slate-500 font-medium uppercase mt-1 print:text-[8px]">Plataforma Diacero</p>
               </div>
               
               <div className="flex flex-col items-center justify-end w-1/3">
                 <div className="bg-amber-50 text-amber-600 border-[3px] border-amber-200 rounded-full h-16 w-16 md:h-24 md:w-24 flex flex-col items-center justify-center shadow-lg relative -top-6 md:-top-8 print:shadow-none print:bg-white print:border-amber-300">
                    <span className="text-[6px] md:text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5 print:text-[8px]">Rendimiento</span>
                    <span className="text-xl md:text-3xl font-black tracking-tighter print:text-3xl">{data.score}%</span>
                 </div>
               </div>

               <div className="text-center w-1/3">
                 <div className="h-px w-20 md:w-32 bg-slate-300 mx-auto mb-3 print:bg-slate-400"></div>
                 <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-wider print:text-[10px]">Otorgado el {data.date}</p>
                 <p className="text-[6px] md:text-[8px] text-slate-500 font-medium uppercase mt-1 print:text-[8px]">Sello Electrónico Formal</p>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
