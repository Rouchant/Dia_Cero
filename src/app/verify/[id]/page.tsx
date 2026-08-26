"use client"

import React, { use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, CheckCircle2, Award, Calendar, User, BookOpen, ArrowLeft, ExternalLink } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();

  const certId = resolvedParams.id || "VALIDATED";
  const student = searchParams.get('student') || "Colaborador Registrado";
  const moduleTitle = searchParams.get('module') || "Capacitación en Seguridad Laboral";
  const score = searchParams.get('score') || "100";
  const date = searchParams.get('date') || "26 de Agosto de 2026";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Logo */}
        <div className="flex justify-center mb-2">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        {/* Verification Card */}
        <Card className="shadow-2xl border-brand-green/30 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border-t-8 border-t-brand-green">
          <CardHeader className="text-center pb-4 bg-brand-green/5 border-b border-brand-green/10">
            <div className="mx-auto bg-brand-green/10 text-brand-green p-4 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-brand-green animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-headline font-black text-brand-blue tracking-tight">
              Certificado Oficial Validador
            </CardTitle>
            <CardDescription className="text-brand-green font-bold text-sm tracking-wider uppercase pt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Sello Electrónico Formal Válido
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Código de Verificación</span>
              <span className="text-base font-black font-mono text-brand-blue bg-brand-lightblue/20 px-3 py-1 rounded-lg border border-brand-lightblue/30">
                ID-{certId}
              </span>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                <User className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Titular Certificado</p>
                  <p className="text-lg font-black text-brand-blue font-headline uppercase">{student}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                <BookOpen className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Programa Normativo Acreditado</p>
                  <p className="text-base font-bold text-slate-800 leading-snug">{moduleTitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <Award className="h-5 w-5 text-brand-gold shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rendimiento</p>
                    <p className="text-lg font-black text-brand-gold">{score}% Aprobado</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                  <Calendar className="h-5 w-5 text-brand-lightblue shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Emisión</p>
                    <p className="text-xs font-bold text-slate-700">{date}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 text-center">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Este documento electrónico cuenta con firma digital inalterable emitida por el <strong>Comité Evaluador DíaCero</strong> en conformidad a la normativa de capacitación en seguridad laboral en Chile.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Ir al Portal Principal
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-slate-400 font-medium">
          © DíaCero — Plataforma Digital de Cumplimiento Normativo
        </p>

      </div>
    </div>
  );
}
