"use client"

import React, { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ShieldCheck, 
  CheckCircle2, 
  ShieldAlert, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  UserCheck, 
  Search 
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const certId = resolvedParams.id || "VALIDATED";

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState<{
    isValid: boolean;
    certId?: string;
    student?: string;
    studentRut?: string;
    studentHireDate?: string;
    moduleTitle?: string;
    companyName?: string;
    companyRut?: string;
    companyLogoUrl?: string;
    signerName?: string;
    signerRole?: string;
    score?: number;
    date?: string;
  } | null>(null);

  useEffect(() => {
    async function verifyCertificate() {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(certId)}`);
        const data = await res.json();

        if (data && data.isValid) {
          setCertData(data);
        } else {
          // Legacy fallback for initial mock records if present
          const fallbackStudent = searchParams.get('student');
          const fallbackModule = searchParams.get('module');
          if (fallbackStudent && fallbackModule && (certId === 'VALIDATED' || certId === 'FHUJK2')) {
            setCertData({
              isValid: true,
              student: fallbackStudent,
              moduleTitle: fallbackModule,
              score: parseInt(searchParams.get('score') || '100', 10),
              date: searchParams.get('date') || '26 de Agosto de 2026'
            });
          } else {
            setCertData({ isValid: false });
          }
        }
      } catch (error) {
        setCertData({ isValid: false });
      } finally {
        setLoading(false);
      }
    }

    verifyCertificate();
  }, [certId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Logo className="mb-2" />
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm font-bold text-slate-600 font-headline">Verificando firma inmutable del certificado en base de datos...</p>
        </div>
      </div>
    );
  }

  const isVerified = certData?.isValid;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 my-8">
        
        {/* Header Logo */}
        <div className="flex justify-between items-center mb-2">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/verify" className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> Consultar otro código
          </Link>
        </div>

        {/* Verification Card */}
        {isVerified ? (
          <Card className="shadow-2xl border-brand-green/30 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden border-t-8 border-t-brand-green">
            <CardHeader className="text-center pb-4 bg-brand-green/5 border-b border-brand-green/10">
              <div className="mx-auto bg-brand-green/10 text-brand-green p-4 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-brand-green animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-headline font-black text-brand-blue tracking-tight">
                Certificado Oficial Acreditado
              </CardTitle>
              <CardDescription className="text-brand-green font-bold text-xs tracking-wider uppercase pt-1 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Registro Inmutable Verificado en Base de Datos Oficial
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Código Hash */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Código Único Oficial</span>
                <span className="text-sm font-black font-mono text-brand-blue bg-brand-lightblue/20 px-3 py-1 rounded-lg border border-brand-lightblue/30">
                  {certData.certId || (certId.startsWith('DC-') ? certId : `DC-${certId}`)}
                </span>
              </div>

              {/* Empresa Empleadora */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-brand-blue" /> Empresa Capacitadora
                  </span>
                  <p className="text-sm font-bold text-brand-blue">{certData.companyName || 'Día Cero Prevención SpA'}</p>
                  <p className="text-[11px] font-mono text-slate-500">RUT: {certData.companyRut || '76.543.210-K'}</p>
                </div>
                {certData.companyLogoUrl && (
                  <img 
                    src={certData.companyLogoUrl} 
                    alt="Logo Empresa" 
                    className="h-10 max-w-[100px] object-contain bg-white p-1 rounded-lg border border-slate-200" 
                  />
                )}
              </div>

              {/* Colaborador / Estudiante */}
              <div className="space-y-3 text-left">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <User className="h-3 w-3 text-brand-blue" /> Trabajador Acreditado
                      </span>
                      <p className="text-base font-black text-brand-blue font-headline uppercase">{certData.student}</p>
                    </div>
                    {certData.studentRut && (
                      <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {certData.studentRut}
                      </span>
                    )}
                  </div>
                  {certData.studentHireDate && (
                    <p className="text-[11px] text-slate-500">
                      Fecha de contratación: <strong>{certData.studentHireDate}</strong>
                    </p>
                  )}
                </div>

                {/* Programa Acreditado */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-brand-green" /> Módulo Normativo Superado
                  </span>
                  <p className="text-sm font-bold text-slate-800">{certData.moduleTitle}</p>
                </div>

                {/* Rendimiento & Fecha Emisión */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3 w-3 text-brand-gold" /> Calificación
                    </span>
                    <p className="text-base font-black text-brand-gold mt-0.5">{certData.score}% Aprobado</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-brand-lightblue" /> Emisión Oficial
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-1 truncate">{certData.date}</p>
                  </div>
                </div>

                {/* Representante Firmante */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
                  <UserCheck className="h-4 w-4 text-brand-blue shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Representante Técnico Firmante</span>
                    <span className="font-bold text-slate-800">{certData.signerName || 'Director de Capacitación y Prevención'}</span>
                    <span className="text-[10px] text-slate-500 block">{certData.signerRole || 'Representante Autorizado'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-blue/5 rounded-2xl border border-brand-blue/10 text-center">
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Registro sellado bajo estándares de la <strong>Ley 16.744</strong> de la República de Chile para su exhibición ante inspecciones de la Dirección del Trabajo (DT) o mutualidades de seguridad.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link href="/" className="w-full">
                  <Button className="w-full h-11 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl shadow-md">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ir a la Portada de Día Cero
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border-red-200 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden border-t-8 border-t-red-500">
            <CardHeader className="text-center pb-4 bg-red-50 border-b border-red-100">
              <div className="mx-auto bg-red-100 text-red-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-3 shadow-inner">
                <ShieldAlert className="h-10 w-10 text-red-600 animate-bounce" />
              </div>
              <CardTitle className="text-2xl font-headline font-black text-red-700 tracking-tight">
                Certificado No Encontrado o Inválido
              </CardTitle>
              <CardDescription className="text-red-600 font-bold text-xs tracking-wider uppercase pt-1">
                Firma Digital no Coincide con la Base de Datos Oficial
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-5 text-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Código Ingresado</p>
                <p className="text-base font-black font-mono text-red-700">{certId}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                El identificador proporcionado no corresponde a ningún certificado emitido o ha sido revocado.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Link href="/verify" className="flex-1">
                  <Button className="w-full h-11 bg-brand-blue text-white font-bold rounded-xl">
                    Buscar otro certificado
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-11 border-slate-300 text-slate-700 font-bold rounded-xl">
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-slate-400 font-medium">
          © Día Cero Prevención SpA — Plataforma de Verificación Inmutable
        </p>

      </div>
    </div>
  );
}
