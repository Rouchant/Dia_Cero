import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Shield, FileText, CheckCircle, Scale, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white/95 border-t border-brand-blue/10 pt-12 pb-8 px-6 relative z-10 text-slate-600 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Columna 1: Identidad Corporativa */}
        <div className="space-y-4 md:col-span-1">
          <Logo />
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Plataforma digital para la acreditación continua en seguridad y salud ocupacional conforme a la Ley 16.744 y gobernanza de datos en Chile.
          </p>
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60 w-fit">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Protección de Datos Garantizada</span>
          </div>
        </div>

        {/* Columna 2: Derechos ARCO + P & Supresión */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="h-4 w-4 text-brand-blue" /> Derechos ARCO + P
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <Link 
                href="/derecho-supresion" 
                className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 group font-bold"
              >
                <span>Solicitud de Supresión (Derecho al Olvido)</span>
                <ArrowUpRight className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </li>
            <li>
              <Link href="/derecho-supresion" className="hover:text-brand-blue transition-colors">
                Baja por Término de Relación Laboral
              </Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-brand-blue transition-colors">
                Portabilidad de Datos & Historial
              </Link>
            </li>
          </ul>
        </div>

        {/* Columna 3: Verificación & Transparencia */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-brand-blue" /> Validación Oficial
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <Link 
                href="/verify" 
                className="text-brand-blue hover:text-brand-blue/80 transition-colors flex items-center gap-1 group font-bold"
              >
                <span>Portal de Verificación de Diplomas</span>
                <ArrowUpRight className="h-3 w-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </li>
            <li>
              <span className="text-[11px] text-slate-400 block">
                Verificación inmutable para fiscalizadores, mutualidades y prevencionistas.
              </span>
            </li>
          </ul>
        </div>

        {/* Columna 4: Marco Jurídico */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-brand-blue" /> Marco Jurídico
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <Link href="/legal/terminos" className="hover:text-brand-blue transition-colors">
                Términos y Condiciones
              </Link>
            </li>
            <li>
              <Link href="/legal/privacidad" className="hover:text-brand-blue transition-colors">
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link href="/legal/dpa" className="hover:text-brand-blue transition-colors">
                Acuerdo de Tratamiento (DPA Empresas)
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Franja Inferior de Copyright y Jurisdicción */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Día Cero Capacitación SpA. Todos los derechos reservados.</p>
        <p className="flex items-center gap-2">
          <span>Jurisdicción y Leyes aplicables: República de Chile</span>
        </p>
      </div>
    </footer>
  );
}
