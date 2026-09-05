"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, Loader2, Image as ImageIcon, ShieldCheck, KeyRound } from "lucide-react";
import { formatRut } from '@/lib/rut';

interface CompanyManagementTabProps {
  companyData: any | null;
  onUpdateCompany: (updates: any) => Promise<boolean>;
}

export function CompanyManagementTab({ companyData, onUpdateCompany }: CompanyManagementTabProps) {
  const [businessName, setBusinessName] = useState(companyData?.business_name || '');
  const [businessLine, setBusinessLine] = useState(companyData?.business_line || '');
  const [legalAddress, setLegalAddress] = useState(companyData?.legal_address || '');
  const [logoUrl, setLogoUrl] = useState(companyData?.logo_url || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar si cambia companyData externamente
  React.useEffect(() => {
    if (companyData) {
      setBusinessName(companyData.business_name || '');
      setBusinessLine(companyData.business_line || '');
      setLegalAddress(companyData.legal_address || '');
      setLogoUrl(companyData.logo_url || '');
    }
  }, [companyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateCompany({
      businessName: businessName.trim(),
      businessLine: businessLine.trim(),
      legalAddress: legalAddress.trim(),
      logoUrl: logoUrl.trim() || null
    });
    setIsSaving(false);
  };

  if (!companyData) {
    return (
      <Card className="rounded-3xl border-brand-blue/10 bg-white p-8 text-center">
        <p className="text-xs text-slate-500 font-medium">
          No hay una empresa asociada a su cuenta de administrador.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-brand-blue/10 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-lightblue/20 text-brand-blue rounded-2xl border border-brand-blue/10">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold font-headline text-brand-blue">
                    {companyData.name}
                  </CardTitle>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-mono font-black">
                    CÓDIGO: {companyData.code}
                  </span>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Autogestión corporativa. Los datos actualizados se inyectarán en los certificados emitidos a sus trabajadores.
                </CardDescription>
              </div>
            </div>
            {logoUrl && (
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
                <img src={logoUrl} alt="Logo empresa" className="h-10 object-contain" />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Razón Social
                </Label>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  RUT Empresa (Oficial)
                </Label>
                <Input
                  value={companyData.rut}
                  disabled
                  className="h-11 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400">El RUT tributario corporativo es inmutable por seguridad.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Giro Comercial
                </Label>
                <Input
                  value={businessLine}
                  onChange={(e) => setBusinessLine(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-brand-blue uppercase tracking-wider">
                  Dirección Legal
                </Label>
                <Input
                  value={legalAddress}
                  onChange={(e) => setLegalAddress(e.target.value)}
                  required
                  className="h-11 bg-slate-50/50 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" /> URL del Logo Corporativo Vigente
              </Label>
              <Input
                placeholder="https://.../logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="h-11 bg-slate-50/50 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Este logo se estampará en la esquina superior de todos los diplomas oficiales generados para sus alumnos.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-brand-blue hover:bg-[#163BB5] text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Guardando Cambios...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="h-4 w-4" /> Guardar Información Corporativa
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
