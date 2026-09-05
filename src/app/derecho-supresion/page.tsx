"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/layout/Footer';
import { 
  ShieldAlert, 
  UserX, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Scale, 
  Info 
} from 'lucide-react';
import { validateRut, formatRut } from '@/lib/rut';

export default function DerechoSupresionPage() {
  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [reason, setReason] = useState('Ya no trabajo en la empresa empleadora');
  const [details, setDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketResult, setTicketResult] = useState<string | null>(null);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    if (formatted.length >= 8 && !validateRut(formatted)) {
      setRutError('RUT inválido (revise el dígito verificador)');
    } else {
      setRutError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (rut && !validateRut(rut)) {
      setErrorMsg('Por favor ingrese un RUT chileno válido o déjelo en blanco si no lo recuerda.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/suppression-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          rut,
          email,
          companyCode: companyCode.trim().toUpperCase(),
          reason,
          details
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo procesar la solicitud.');
        setLoading(false);
        return;
      }

      setTicketResult(data.ticketNumber);
    } catch (err: any) {
      setErrorMsg('Error de conexión al enviar la solicitud: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-brand-green/30 flex flex-col justify-between">
      {/* Ambience glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-100/50 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-lightblue/20 rounded-full blur-[150px] opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full bg-white/80 backdrop-blur-xl border-b border-brand-blue/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <Link 
            href="/" 
            className="text-xs font-bold text-brand-blue hover:text-brand-green inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-12">
        <div className="bg-white/95 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,31,75,0.06)]">
          
          <div className="flex items-center gap-3.5 mb-6">
            <div className="bg-red-50 p-3 rounded-2xl border border-red-200">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 uppercase tracking-widest bg-red-50/80 px-2.5 py-0.5 rounded-full mb-1 border border-red-200/50">
                <Scale className="h-3 w-3" /> Derechos ARCO
              </div>
              <h1 className="text-2xl font-headline font-black text-brand-blue leading-tight">
                Canal de Supresión de Datos Personales
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ejercicio del Derecho al Olvido y Cancelación de Cuenta de Capacitación
              </p>
            </div>
          </div>

          {/* Banner de Información Legal y Plazos */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-xs text-slate-600 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 text-brand-blue font-bold">
              <Info className="h-4 w-4 text-brand-blue shrink-0" />
              <span>¿Cómo procesamos su solicitud de supresión?</span>
            </div>
            <p>
              Conforme a la <strong>Ley 21.719 sobre Protección de Datos Personales</strong>, usted tiene derecho a solicitar la eliminación o anonimización de sus datos de perfil cuando termine su relación laboral con la empresa cliente o revoque su consentimiento.
            </p>
            <p className="text-[11px] text-slate-500">
              <em>Nota legal:</em> Los certificados de capacitación obligatoria en prevención de riesgos laborales (Ley 16.744 / D.S. 40) previamente emitidos quedan archivados de manera restringida e inmutable para efectos de fiscalización laboral ante la Dirección del Trabajo o SUSESO.
            </p>
          </div>

          {ticketResult ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-emerald-900 font-headline">
                Solicitud Registrada Exitosamente
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Hemos generado su ticket de supresión de datos personales. El administrador de su empresa y el equipo de Día Cero procesarán la baja y anonimización de su cuenta.
              </p>
              <div className="bg-white p-3 rounded-xl border border-emerald-200 inline-block">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-bold">Número de Ticket Oficial</span>
                <span className="text-lg font-mono font-black text-brand-blue tracking-widest">{ticketResult}</span>
              </div>
              <div className="pt-2">
                <Link href="/">
                  <Button variant="outline" className="text-xs font-bold">
                    Volver a la Página Principal
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-700 text-xs font-bold p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                  Correo Electrónico de la Cuenta *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50"
                />
                <p className="text-[10px] text-slate-400">
                  El correo con el que se registraba o recibía sus certificados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                    Nombre Completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Su nombre y apellidos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rut" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                    RUT del Solicitante
                  </Label>
                  <Input
                    id="rut"
                    type="text"
                    placeholder="12.345.678-K"
                    value={rut}
                    onChange={handleRutChange}
                    className="h-11 bg-slate-50/50 font-mono text-sm"
                  />
                  {rutError && <span className="text-[10px] text-red-600 block">{rutError}</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyCode" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                  Código de Empresa o Nombre del Empleador
                </Label>
                <Input
                  id="companyCode"
                  type="text"
                  placeholder="Ej: DC2026 o Nombre de la Empresa"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="h-11 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                  Motivo de la Solicitud *
                </Label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="Ya no trabajo en la empresa empleadora">Ya no trabajo en la empresa empleadora (Término de Contrato)</option>
                  <option value="Revocación de Consentimiento">Revocación de Consentimiento</option>
                  <option value="Eliminación de datos personales de la base de datos">Eliminación directa de datos personales</option>
                  <option value="Inexactitud o duplicidad de cuenta">Inexactitud o duplicidad de cuenta</option>
                  <option value="Otro motivo justificado">Otro motivo justificado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="details" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
                  Observaciones o Detalles Adicionales
                </Label>
                <textarea
                  id="details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Indique cualquier antecedente relevante para validar su identidad..."
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-black bg-red-600 hover:bg-red-700 text-white mt-4 rounded-xl shadow-lg shadow-red-600/20 transition-all uppercase tracking-wide active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando Ticket...
                  </span>
                ) : (
                  "Enviar Solicitud de Supresión"
                )}
              </Button>
            </form>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
