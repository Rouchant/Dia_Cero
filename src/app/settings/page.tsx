"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  User, 
  ShieldCheck, 
  Loader2, 
  Save, 
  KeyRound, 
  Download, 
  Building2, 
  Calendar, 
  CreditCard, 
  Scale, 
  UserX,
  FileCheck2
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profileData, setProfileData] = useState<any>(null);
  
  // Identity form
  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Portabilidad
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }
      
      setUserId(authData.user.id);
      setUserEmail(authData.user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, companies(*)')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profile) {
        setProfileData(profile);
        setName(profile.name || "");
      }
      setLoading(false);
    }
    loadUser();
  }, [router, supabase]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingName(true);
    
    const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
    await supabase.auth.updateUser({ data: { name } });

    if (error) {
       alert("Error de Infraestructura al actualizar perfil: " + error.message);
    } else {
       alert("Identidad actualizada correctamente. Los cambios se reflejarán en sus próximos certificados.");
    }
    setIsSavingName(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      alert("Por favor ingresa tu contraseña actual para confirmar la operación de seguridad.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      alert("La fortaleza requerida para la nueva contraseña es de al menos 6 caracteres.");
      return;
    }

    setIsSavingPassword(true);
    
    // 1. Verify current password by signing in
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword
    });

    if (authError) {
      alert("La contraseña actual ingresada es incorrecta. Por favor verifícala e intenta nuevamente.");
      setIsSavingPassword(false);
      return;
    }

    // 2. Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    if (updateError) {
      alert("Falla configurando encriptación: " + updateError.message);
    } else {
      alert("¡Contraseña actualizada con éxito en la plataforma!");
      setCurrentPassword("");
      setNewPassword("");
    }
    setIsSavingPassword(false);
  };

  // Portabilidad de Datos (Derecho a la Portabilidad Ley 21.719)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [
        { data: progress },
        { data: consents },
        { data: certs }
      ] = await Promise.all([
        supabase.from('user_progress').select('*, modules(title)').eq('user_id', userId),
        supabase.from('consent_audit_logs').select('*').eq('user_id', userId),
        supabase.from('certificates').select('*').eq('student_id', userId)
      ]);

      const dossier = {
        meta: {
          export_date: new Date().toISOString(),
          regulation: "Ley N° 21.719 sobre Protección de Datos Personales (Chile)",
          purpose: "Ejercicio del Derecho a la Portabilidad de Datos"
        },
        titular: {
          id: userId,
          nombre_completo: profileData?.name,
          rut: profileData?.rut,
          correo: userEmail,
          fecha_contratacion: profileData?.hire_date,
          rol: profileData?.role,
          empresa_empleadora: {
            id: profileData?.companies?.id,
            nombre: profileData?.companies?.name,
            razon_social: profileData?.companies?.business_name,
            rut_empresa: profileData?.companies?.rut,
            codigo_empresa: profileData?.company_code
          }
        },
        consentimientos_legales_registrados: consents || [],
        historial_capacitaciones_y_progreso: progress || [],
        certificados_inmutables_obtenidos: certs || []
      };

      const jsonStr = JSON.stringify(dossier, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expediente-diacero-${profileData?.rut || userId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error al compilar expediente de portabilidad: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col gap-4 items-center justify-center font-sans">
       <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
       <p className="text-brand-blue font-bold text-lg animate-pulse">Cargando Preferencias y Derechos ARCO...</p>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16">
      {/* Header Panel Light Theme */}
      <header className="bg-white/90 text-brand-blue px-6 py-4 shadow-sm border-b border-brand-blue/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              aria-label="Volver al panel principal"
              className="inline-flex items-center justify-center h-10 w-10 text-brand-blue hover:bg-brand-lightblue/20 mr-2 rounded-full border border-brand-blue/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver al panel principal</span>
            </Link>
            <Logo className="hidden sm:block" />
            <span className="font-headline font-black text-lg tracking-tight uppercase border-l border-brand-blue/20 sm:ml-2 sm:pl-3 mt-2.5 leading-none text-brand-blue">
              Preferencias & Privacidad
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">{userEmail}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         {/* Banner Empresa y Datos Laborales */}
         {profileData?.companies && (
           <div className="bg-white border border-brand-blue/10 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3.5">
               <div className="p-3 bg-brand-lightblue/20 text-brand-blue rounded-2xl border border-brand-blue/10">
                 <Building2 className="h-6 w-6" />
               </div>
               <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresa Empleadora Vinculada</span>
                 <p className="text-base font-bold text-brand-blue">{profileData.companies.business_name || profileData.companies.name}</p>
                 <p className="text-xs font-mono text-slate-500">RUT Empresa: {profileData.companies.rut} • Código: {profileData.company_code}</p>
               </div>
             </div>
             {profileData.rut && (
               <div className="text-left sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-100">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RUT del Colaborador</span>
                 <p className="text-sm font-mono font-bold text-slate-800">{profileData.rut}</p>
                 {profileData.hire_date && (
                   <p className="text-[11px] text-slate-500">Ingreso: {new Date(profileData.hire_date).toLocaleDateString('es-ES')}</p>
                 )}
               </div>
             )}
           </div>
         )}

         {/* Card 1: Identidad Personal */}
         <Card className="shadow-xl shadow-brand-blue/5 border-brand-blue/10 bg-white/90 backdrop-blur-sm border-t-[6px] border-t-brand-blue rounded-3xl overflow-hidden">
           <CardHeader className="bg-brand-lightblue/10 border-b border-brand-blue/10 pb-5">
             <CardTitle className="flex items-center gap-2 font-headline text-xl text-brand-blue">
               <User className="h-5 w-5 text-brand-blue"/> Identidad Registrada
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium pt-1">
               Este es el nombre exacto que será emitido en tus diplomas oficiales de seguridad ocupacional.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdateName} className="space-y-5">
               <div className="space-y-2">
                 <Label htmlFor="u-name" className="text-brand-blue font-bold uppercase tracking-wider text-xs">Nombre Completo</Label>
                 <Input id="u-name" value={name} onChange={e=>setName(e.target.value)} required className="h-12 bg-slate-50 border-brand-blue/10 focus:bg-white text-base font-bold text-brand-blue rounded-xl" />
               </div>
               <div className="flex justify-end pt-2">
                 <Button type="submit" disabled={isSavingName} className="hover-lift w-full sm:w-auto bg-brand-blue text-white h-11 px-6 font-bold rounded-xl active:scale-95 shadow-md">
                   {isSavingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                   Actualizar Nombre
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

         {/* Card 2: Seguridad de Acceso */}
         <Card className="shadow-xl shadow-brand-yellow/5 border-brand-yellow/30 bg-white/90 backdrop-blur-sm border-t-[6px] border-t-brand-gold rounded-3xl overflow-hidden">
           <CardHeader className="bg-brand-yellow/10 border-b border-brand-gold/10 pb-5">
             <CardTitle className="flex items-center gap-2 font-headline text-xl text-brand-blue">
               <ShieldCheck className="h-5 w-5 text-brand-gold fill-brand-gold/20"/> Seguridad de Acceso
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium pt-1">
               Actualización segura de contraseña de formación.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdatePassword} className="space-y-4">
               <div className="space-y-1.5">
                 <Label htmlFor="curr-pwd" className="text-brand-blue font-bold uppercase tracking-wider text-xs flex items-center gap-1.5">
                   <KeyRound className="h-3.5 w-3.5 text-brand-gold" /> Contraseña Actual
                 </Label>
                 <Input 
                   id="curr-pwd" 
                   type="password" 
                   placeholder="Ingresa tu contraseña actual" 
                   value={currentPassword} 
                   onChange={e => setCurrentPassword(e.target.value)} 
                   required 
                   className="h-11 bg-slate-50 border-slate-200 text-sm font-bold text-brand-blue rounded-xl" 
                 />
               </div>

               <div className="space-y-1.5">
                 <Label htmlFor="new-pwd" className="text-brand-blue font-bold uppercase tracking-wider text-xs">
                   Nueva Contraseña (mínimo 6 caracteres)
                 </Label>
                 <Input 
                   id="new-pwd" 
                   type="password" 
                   placeholder="Mínimo 6 caracteres" 
                   value={newPassword} 
                   onChange={e => setNewPassword(e.target.value)} 
                   required 
                   minLength={6} 
                   className="h-11 bg-slate-50 border-slate-200 text-sm font-bold text-brand-blue rounded-xl" 
                 />
               </div>

               <div className="flex justify-end pt-2">
                 <Button 
                   type="submit" 
                   disabled={isSavingPassword || !currentPassword || newPassword.length < 6} 
                   className="w-full sm:w-auto bg-brand-gold hover:bg-[#c2933d] text-white h-11 px-6 font-bold rounded-xl active:scale-95 shadow-md"
                 >
                   {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Actualizar Contraseña"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

         {/* Card 3: Derechos ARCO + P y Protección de Datos (Ley 21.719) */}
         <Card className="shadow-xl border-emerald-200 bg-white/95 backdrop-blur-sm border-t-[6px] border-t-emerald-600 rounded-3xl overflow-hidden">
           <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-5">
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2 font-headline text-xl text-brand-blue">
                 <Scale className="h-5 w-5 text-emerald-600"/> Centro de Cumplimiento ARCO + P
               </CardTitle>
               <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                 Privacidad y Datos
               </span>
             </div>
             <CardDescription className="text-slate-600 text-xs font-medium pt-1">
               Gestione sus derechos de acceso, rectificación, portabilidad y supresión de datos personales garantizados por la ley chilena.
             </CardDescription>
           </CardHeader>

           <CardContent className="pt-6 space-y-6">
             {/* Portabilidad */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
               <div>
                 <h4 className="text-sm font-bold text-brand-blue flex items-center gap-1.5">
                   <Download className="h-4 w-4 text-brand-blue" /> Derecho a la Portabilidad (Expediente Digital)
                 </h4>
                 <p className="text-xs text-slate-500 mt-0.5">
                   Descargue una copia completa y estructurada (formato JSON interoperable) de su perfil, consentimientos aceptados e historial académico.
                 </p>
               </div>
               <Button
                 type="button"
                 onClick={handleExportData}
                 disabled={isExporting}
                 className="bg-brand-blue hover:bg-[#163BB5] text-white text-xs font-bold rounded-xl h-10 px-5 shrink-0 shadow-sm"
               >
                 {isExporting ? (
                   <span className="flex items-center gap-1.5">
                     <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compilando...
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5">
                     <Download className="h-3.5 w-3.5" /> Exportar mis Datos
                   </span>
                 )}
               </Button>
             </div>

             {/* Supresión */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-50/50 border border-red-200/80">
               <div>
                 <h4 className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                   <UserX className="h-4 w-4 text-red-600" /> Derecho de Supresión (Derecho al Olvido)
                 </h4>
                 <p className="text-xs text-red-800/80 mt-0.5">
                   Solicite la baja o anonimización de su cuenta si ha cesado su relación laboral con la empresa cliente.
                 </p>
               </div>
               <Link href="/derecho-supresion">
                 <Button
                   type="button"
                   variant="outline"
                   className="border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl h-10 px-5 shrink-0"
                 >
                   Iniciar Solicitud de Baja
                 </Button>
               </Link>
             </div>

             <div className="pt-2 text-[11px] text-slate-500 text-center">
               Consulte los detalles en nuestra{" "}
               <Link href="/legal/privacidad" className="text-brand-blue font-bold underline">
                 Política de Privacidad Oficial
               </Link>.
             </div>
           </CardContent>
         </Card>

      </main>
    </div>
  );
}
