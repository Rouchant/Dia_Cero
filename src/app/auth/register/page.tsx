"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, 
  User, 
  CreditCard, 
  Calendar, 
  Mail, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft 
} from "lucide-react";
import { validateRut, formatRut } from '@/lib/rut';

export default function RegisterPage() {
  const router = useRouter();

  // Form State
  const [companyCode, setCompanyCode] = useState('');
  const [companyInfo, setCompanyInfo] = useState<{ id: string; name: string; businessName: string } | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');

  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hireDate, setHireDate] = useState('');

  // Opt-in checkboxes (desmarcadas por defecto - Ley 21.719)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validar código de empresa en tiempo real
  useEffect(() => {
    const trimmed = companyCode.trim().toUpperCase();
    if (trimmed.length === 6) {
      setIsValidatingCode(true);
      setCodeError('');
      fetch(`/api/companies/validate-code?code=${trimmed}`)
        .then(res => res.json())
        .then(data => {
          if (data.isValid && data.company) {
            setCompanyInfo(data.company);
            setCodeError('');
          } else {
            setCompanyInfo(null);
            setCodeError(data.error || 'Código de empresa no válido o inactivo.');
          }
        })
        .catch(() => {
          setCompanyInfo(null);
          setCodeError('Error de conexión al validar código.');
        })
        .finally(() => setIsValidatingCode(false));
    } else {
      setCompanyInfo(null);
      if (trimmed.length > 0 && trimmed.length < 6) {
        setCodeError('El código debe contener 6 caracteres alfanuméricos.');
      } else {
        setCodeError('');
      }
    }
  }, [companyCode]);

  // Formateo y validación de RUT en vivo
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRut(raw);
    setRut(formatted);

    if (formatted.length >= 8) {
      if (!validateRut(formatted)) {
        setRutError('RUT inválido (revise el dígito verificador)');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!companyInfo) {
      setFormError('Debe ingresar un código de empresa válido de 6 caracteres.');
      return;
    }

    if (!validateRut(rut)) {
      setFormError('El RUT ingresado no es válido según el Módulo 11 oficial.');
      return;
    }

    if (!hireDate) {
      setFormError('Debe indicar su fecha de contratación en la empresa.');
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setFormError('Debe aceptar expresamente los Términos y Condiciones y la Política de Privacidad.');
      return;
    }

    if (password.length < 6) {
      setFormError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          rut,
          email,
          password,
          hireDate,
          companyCode: companyCode.trim().toUpperCase(),
          termsAccepted,
          privacyAccepted
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Ocurrió un error al procesar el registro.');
        setLoading(false);
        return;
      }

      setSuccessMessage(`¡Registro completado exitosamente con ${companyInfo.name}! Redirigiendo al inicio de sesión...`);
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);
    } catch (err: any) {
      setFormError('Error de red al intentar registrar la cuenta: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-brand-green/30 relative flex flex-col justify-between">
      {/* Background Ambience Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-lightblue/25 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-yellow/30 rounded-full blur-[150px] opacity-50" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full bg-white/80 backdrop-blur-xl border-b border-brand-blue/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
          </Link>
          <Link 
            href="/auth/login" 
            className="text-xs font-bold text-brand-blue hover:text-brand-green inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> ¿Ya tienes cuenta? Iniciar Sesión
          </Link>
        </div>
      </header>

      {/* Main Registration Container */}
      <main className="relative z-10 flex-1 max-w-xl w-full mx-auto px-4 py-10">
        <div className="bg-white/95 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,31,75,0.08)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-brand-lightblue/30 p-2.5 rounded-xl border border-brand-blue/20">
              <ShieldCheck className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-black text-brand-blue leading-tight">Registro de Estudiante</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Acceso a capacitaciones y diplomas corporativos</p>
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 text-red-700 text-xs font-bold p-3.5 rounded-xl mb-6 border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3.5 rounded-xl mb-6 border border-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Paso 1: Código de Empresa Obligatorio */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="companyCode" className="text-brand-blue font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-brand-blue" /> Código de Empresa (6 Caracteres)
                </Label>
                {isValidatingCode && <Loader2 className="h-3 w-3 animate-spin text-brand-blue" />}
              </div>
              <Input
                id="companyCode"
                type="text"
                maxLength={6}
                placeholder="Ej: DC2026"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                required
                className="h-11 bg-white font-mono font-bold tracking-widest text-center text-lg uppercase border-slate-300 focus:border-brand-blue"
              />
              {companyInfo && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 p-2 rounded-lg mt-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Empresa validada: <strong>{companyInfo.name}</strong></span>
                </div>
              )}
              {codeError && (
                <div className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {codeError}
                </div>
              )}
              <p className="text-[10px] text-slate-500">
                Proporcionado por el Departamento de Prevención o Recursos Humanos de tu empleador.
              </p>
            </div>

            {/* Paso 2: Datos Personales Sensibles Obligatorios */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-brand-blue font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <User className="h-3 w-3" /> Nombre Completo Oficial
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej: Juan Andrés Pérez González"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11 bg-slate-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rut" className="text-brand-blue font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> RUT Chileno
                </Label>
                <Input
                  id="rut"
                  type="text"
                  placeholder="12.345.678-K"
                  value={rut}
                  onChange={handleRutChange}
                  required
                  className="h-11 bg-slate-50/50 font-mono text-sm"
                />
                {rutError && (
                  <span className="text-[10px] font-semibold text-red-600 block">{rutError}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hireDate" className="text-brand-blue font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Fecha de Contratación
                </Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            {/* Paso 3: Credenciales de Acceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-brand-blue font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.correo@empresa.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-brand-blue font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            {/* Paso 4: Consentimientos Explícitos (Opt-in Activo Ley 21.719) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs text-slate-600 font-medium leading-tight cursor-pointer">
                  Acepto los <Link href="/legal/terminos" target="_blank" className="text-brand-blue underline font-bold">Términos y Condiciones del Servicio</Link> de Día Cero.
                </Label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(!!checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="privacy" className="text-xs text-slate-600 font-medium leading-tight cursor-pointer">
                  Acepto la <Link href="/legal/privacidad" target="_blank" className="text-brand-blue underline font-bold">Política de Privacidad y Tratamiento de Datos Personales</Link>.
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !companyInfo || !termsAccepted || !privacyAccepted}
              className="w-full h-12 text-sm font-black bg-emerald-700 hover:bg-emerald-800 text-white mt-4 rounded-xl shadow-lg shadow-emerald-700/25 transition-all uppercase tracking-wide active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Registrando Estudiante...
                </span>
              ) : (
                "Crear Cuenta de Estudiante"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            ¿Ya tienes una cuenta creada?{" "}
            <Link href="/auth/login" className="text-brand-blue font-bold hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
