import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col justify-between">
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-brand-blue/10 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link href="/" className="text-xs font-bold text-brand-blue hover:text-brand-green inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="bg-white border border-brand-blue/10 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-brand-lightblue/20 p-2.5 rounded-xl text-brand-blue">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-brand-blue">
                Términos y Condiciones de Uso del Servicio
              </h1>
              <p className="text-xs text-slate-500 font-medium">Última actualización: Versión 1.0 (2026) — República de Chile</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-700">
            <h2 className="text-base font-bold text-brand-blue">1. Objeto del Servicio</h2>
            <p>
              Día Cero Capacitación SpA provee una plataforma tecnológica para la impartición, evaluación y certificación digital de módulos de capacitación continua en materia de seguridad, prevención de riesgos laborales y normativas técnicas conforme a la Ley 16.744 de la República de Chile.
            </p>

            <h2 className="text-base font-bold text-brand-blue">2. Registro de Usuarios y Código de Empresa</h2>
            <p>
              El acceso como estudiante exige contar con un código corporativo de 6 caracteres asignado por una empresa cliente válidamente registrada. El usuario declara y garantiza que los datos suministrados (nombre completo, RUT y fecha de contratación) corresponden fidedignamente a su identidad laboral.
            </p>

            <h2 className="text-base font-bold text-brand-blue">3. Emisión de Certificados y Trazabilidad</h2>
            <p>
              Los certificados emitidos a través de la plataforma son sellados de forma inmutable tras la aprobación del examen evaluativo. Contienen el código de verificación único (hash), fecha de emisión oficial y datos de la empresa capacitadora. La adulteración o uso fraudulento de dichos certificados será sancionado conforme a la legislación civil y penal chilena.
            </p>

            <h2 className="text-base font-bold text-brand-blue">4. Obligaciones del Usuario</h2>
            <p>
              El usuario se compromete a realizar los módulos de forma personal e indelegable, manteniendo la confidencialidad de sus credenciales y respondiendo por cualquier actividad efectuada desde su cuenta.
            </p>

            <h2 className="text-base font-bold text-brand-blue">5. Legislación y Jurisdicción Aplicable</h2>
            <p>
              Estos términos se rigen exclusivamente por las leyes de la República de Chile. Para cualquier controversia, las partes se someten a la competencia de los tribunales ordinarios de justicia de la ciudad de Santiago de Chile.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
