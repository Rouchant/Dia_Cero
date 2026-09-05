import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, Scale, Building2 } from 'lucide-react';

export default function DpaPage() {
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
            <div className="bg-brand-blue/10 p-2.5 rounded-xl text-brand-blue">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-brand-blue">
                Acuerdo de Tratamiento de Datos (DPA Corporativo)
              </h1>
              <p className="text-xs text-slate-500 font-medium">Contrato tipo entre Empresa Cliente (Responsable) y Día Cero (Encargado) — Ley 21.719</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-700">
            <h2 className="text-base font-bold text-brand-blue">1. Objeto del Acuerdo</h2>
            <p>
              El presente Data Processing Agreement (DPA) regula las condiciones bajo las cuales Día Cero Capacitación SpA (el “Encargado”) trata datos personales por cuenta de la Empresa Cliente adherida (el “Responsable”), en el marco de la prestación de servicios de capacitación técnica y seguridad ocupacional.
            </p>

            <h2 className="text-base font-bold text-brand-blue">2. Instrucciones y Alcance del Tratamiento</h2>
            <p>
              El Encargado tratará los datos personales de los colaboradores única y exclusivamente conforme a las instrucciones documentadas del Responsable y para las finalidades estipuladas en el contrato principal: creación de cuentas, registro de avance, evaluaciones y emisión de certificados de cumplimiento normativo.
            </p>

            <h2 className="text-base font-bold text-brand-blue">3. Medidas Técnicas y Organizativas de Seguridad</h2>
            <p>
              El Encargado implementa y mantiene controles técnicos acordes al estado del arte:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Segregación estricta de bases de datos y control de accesos multi-tenant por código de empresa.</li>
              <li>Cifrado de datos en tránsito (TLS 1.3) y en reposo.</li>
              <li>Pistas de auditoría inmutables para operaciones de consulta y modificación de datos sensibles.</li>
              <li>Procedimientos de respaldo diario y contingencia operativa.</li>
            </ul>

            <h2 className="text-base font-bold text-brand-blue">4. Asistencia en el Ejercicio de Derechos de los Titulares</h2>
            <p>
              El Encargado provee al Responsable un panel de administración para gestionar, revisar y dar curso a las solicitudes de supresión, rectificación y portabilidad formuladas por los trabajadores bajo la Ley 21.719.
            </p>

            <h2 className="text-base font-bold text-brand-blue">5. Notificación de Incidentes de Seguridad</h2>
            <p>
              En caso de detectarse una vulneración de seguridad que afecte a datos personales del Responsable, el Encargado lo notificará sin dilación indebida y en todo caso dentro de las 72 horas siguientes a su toma de conocimiento, cooperando en la adopción de medidas correctivas.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
