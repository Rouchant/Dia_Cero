"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/layout/Footer";
import { Search, ShieldCheck, ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";

export default function VerifySearchPage() {
  const router = useRouter();
  const [certCode, setCertCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = certCode.trim();
    if (!clean) {
      setErrorMsg('Por favor ingrese un código o identificador de certificado.');
      return;
    }
    router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col justify-between">
      {/* Ambience glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-lightblue/25 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-green/20 rounded-full blur-[150px] opacity-50" />
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
      <main className="relative z-10 flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col justify-center">
        <div className="bg-white/95 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,31,75,0.08)] text-center space-y-6">
          
          <div className="mx-auto w-16 h-16 bg-brand-lightblue/20 rounded-2xl flex items-center justify-center text-brand-blue border border-brand-blue/10 shadow-inner">
            <ShieldCheck className="h-9 w-9 text-brand-blue" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-headline font-black text-brand-blue leading-tight">
              Portal Público de Verificación
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-md mx-auto">
              Consulte la autenticidad e inmutabilidad de los certificados emitidos conforme a la Ley 16.744 en Chile.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="certCode" className="text-[11px] font-bold text-brand-blue uppercase tracking-wider block">
                Código Único de Certificado o Hash
              </Label>
              <div className="relative">
                <Input
                  id="certCode"
                  type="text"
                  placeholder="Ej: DC-c000... o VALIDATED"
                  value={certCode}
                  onChange={(e) => {
                    setCertCode(e.target.value);
                    setErrorMsg('');
                  }}
                  className="h-12 bg-slate-50 border-slate-300 font-mono font-bold text-sm text-brand-blue pl-4 pr-12 focus:border-brand-blue rounded-xl uppercase"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              {errorMsg && (
                <p className="text-[11px] font-bold text-red-600 mt-1">{errorMsg}</p>
              )}
              <p className="text-[10px] text-slate-400">
                El código se encuentra impreso en la parte superior e inferior del diploma o debajo del código QR.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-lg shadow-brand-blue/20"
            >
              Verificar Autenticidad Ahora <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Registro Inalterable
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Consulta Gratuita
            </span>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
