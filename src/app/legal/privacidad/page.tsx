import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function PrivacidadPage() {
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
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-brand-blue">
                Política de Privacidad y Protección de Datos Personales
              </h1>
              <p className="text-xs text-slate-500 font-medium">Adaptada plenamente a la Ley N° 21.719 de la República de Chile</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4 text-slate-700">
            <h2 className="text-base font-bold text-brand-blue">1. Identidad y Rol del Responsable y Encargado</h2>
            <p>
              En virtud de la <strong>Ley 21.719</strong> sobre Protección de Datos Personales, la empresa cliente en la que usted presta servicios laborales actúa como <strong>Responsable del Tratamiento</strong> de sus datos personales. Día Cero Capacitación SpA actúa en calidad de <strong>Encargado del Tratamiento</strong>, procesando los datos estrictamente para impartir, evaluar y certificar su cumplimiento en seguridad laboral.
            </p>

            <h2 className="text-base font-bold text-brand-blue">2. Datos Recolectados y Bases de Licitud</h2>
            <p>
              Recolectamos y tratamos los siguientes datos: Nombre completo, Rol Único Tributario (RUT), fecha de contratación, correo electrónico, dirección IP de conexión, marcas temporales de avance pedagógico y resultados de evaluaciones.
            </p>
            <p>
              La base legal para el tratamiento reside en el cumplimiento de obligaciones legales de seguridad y salud en el trabajo impuestas al empleador por el Código del Trabajo y la Ley 16.744, así como en su consentimiento libre, informado y expreso (opt-in activo).
            </p>

            <h2 className="text-base font-bold text-brand-blue">3. Derechos ARCO + P (Acceso, Rectificación, Cancelación/Supresión, Oposición y Portabilidad)</h2>
            <p>
              Usted tiene garantizados los siguientes derechos:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acceso:</strong> Consultar en cualquier momento los datos personales y registros académicos almacenados.</li>
              <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos desde su perfil.</li>
              <li><strong>Supresión (Derecho al Olvido):</strong> Solicitar la baja o anonimización de su cuenta a través de nuestro <Link href="/derecho-supresion" className="text-brand-blue font-bold underline">Canal de Supresión</Link>.</li>
              <li><strong>Portabilidad:</strong> Descargar una copia estructurada e interoperable (formato JSON estándar) de su historial completo desde el menú de Ajustes.</li>
            </ul>

            <h2 className="text-base font-bold text-brand-blue">4. Plazos de Retención y Conservación Legal</h2>
            <p>
              Los datos personales de perfil activo se conservarán mientras dure su vinculación con la empresa o hasta que ejerza su derecho de supresión. No obstante, en observancia de las exigencias del Decreto Supremo N° 40 y la Ley 16.744, los certificados de capacitación emitidos serán conservados de forma inmutable y con acceso legalmente restringido durante los plazos de prescripción fiscal (5 años) para su acreditación ante la Dirección del Trabajo y la Superintendencia de Seguridad Social (SUSESO).
            </p>

            <h2 className="text-base font-bold text-brand-blue">5. Medidas de Seguridad de la Información</h2>
            <p>
              Implementamos cifrado robusto de contraseñas, conexiones seguras mediante protocolo HTTPS (TLS 1.3), segregación estricta multi-tenant entre empresas y pistas de auditoría para cada acceso a datos sensibles.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
