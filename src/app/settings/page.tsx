"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, ShieldCheck, Loader2, Save } from "lucide-react";
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
  
  // Identity form
  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  
  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }
      
      setUserId(authData.user.id);
      setUserEmail(authData.user.email || '');

      const { data: profile } = await supabase.from('profiles').select('name').eq('id', authData.user.id).single();
      if (profile) {
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
       alert("Identidad actualizada y sellada correctamente. Los cambios se reflejarán instantáneamente en tus próximos certificados.");
    }
    setIsSavingName(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("La fortaleza requerida es de al menos 6 caracteres.");
      return;
    }
    setIsSavingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      alert("Falla configurando encriptación: " + error.message);
    } else {
      alert("¡Contraseña maestra actualizada con éxito en la plataforma! Tus accesos futuros están asegurados.");
      setNewPassword("");
    }
    setIsSavingPassword(false);
  };

  if (loading) return (
     <div className="min-h-screen bg-[#F8FAFC] flex flex-col gap-4 items-center justify-center">
       <Loader2 className="h-10 w-10 animate-spin text-brand-pink" />
       <p className="text-brand-blue font-bold text-lg animate-pulse">Autenticando Preferencias...</p>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Header Panel Light Theme */}
      <header className="bg-white/90 text-brand-blue px-6 py-4 shadow-sm border-b border-brand-blue/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-brand-blue hover:bg-brand-lightblue/20 mr-2 rounded-full border border-brand-blue/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo className="h-8 w-auto hidden sm:block" />
            <span className="font-headline font-black text-lg tracking-tight uppercase border-l border-brand-blue/20 sm:ml-2 sm:pl-3 mt-2.5 leading-none text-brand-blue">Preferencias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold bg-brand-lightblue/20 px-4 py-2 rounded-full border border-brand-lightblue/50 hidden sm:block text-brand-blue">{userEmail}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 pt-6 sm:pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <div className="mb-6">
           <h1 className="text-3xl font-headline font-black text-brand-blue tracking-tight">Centro de Preferencias</h1>
           <p className="text-slate-500 mt-2 text-base font-medium">Edita tu identificación oficial o cambia las credenciales de seguridad de tu cuenta.</p>
         </div>

         <Card className="shadow-xl shadow-brand-blue/5 border-brand-blue/10 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
           <CardHeader className="bg-brand-lightblue/10 border-b border-brand-blue/5 pb-5">
             <CardTitle className="flex items-center gap-2 font-headline text-xl text-brand-blue">
               <User className="h-5 w-5 text-brand-pink fill-brand-pink/20"/> Identidad Oficial
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium pt-1">
               Este es el nombre con el que tu supervisor te visualiza, y es el nombre exacto que será impreso de forma indeleble en tus <strong>Certificados A4</strong>.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdateName} className="space-y-5">
               <div className="space-y-2">
                 <Label htmlFor="u-name" className="text-brand-blue font-bold uppercase tracking-wider text-xs">Nombre Completo Registrado</Label>
                 <Input id="u-name" value={name} onChange={e=>setName(e.target.value)} required className="h-12 bg-slate-50 border-brand-blue/10 focus:bg-white focus:border-brand-pink focus:ring-brand-pink/30 text-lg font-bold text-brand-blue rounded-xl" />
               </div>
               <div className="flex justify-end pt-2">
                 <Button type="submit" disabled={isSavingName} className="hover-lift w-full sm:w-auto bg-brand-blue hover:hover:bg-opacity-90 h-12 px-8 shadow-lg shadow-brand-blue/20 font-bold rounded-xl text-white active:scale-95">
                   {isSavingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                   Sellar Identidad
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

         <Card className="shadow-xl shadow-brand-yellow/5 border-brand-yellow/30 bg-white/90 backdrop-blur-sm border-t-[6px] border-t-brand-gold rounded-3xl overflow-hidden">
           <CardHeader className="bg-brand-yellow/10 border-b border-brand-gold/10 pb-5">
             <CardTitle className="flex items-center gap-2 font-headline text-xl text-brand-blue">
               <ShieldCheck className="h-5 w-5 text-brand-gold fill-brand-gold/20"/> Seguridad de Acceso
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium pt-1">
               Cambia tu contraseña si sientes que tu dispositivo ha sido comprometido. Se cerrará la sesión automáticamente en el resto de dispositivos vinculados.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdatePassword} className="space-y-5">
               <div className="space-y-2">
                 <Label htmlFor="u-pwd" className="text-brand-blue font-bold uppercase tracking-wider text-xs">Inyectar Nueva Contraseña</Label>
                 <Input id="u-pwd" type="password" placeholder="Inserte nueva contraseña" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={6} className="h-12 bg-slate-50 border-brand-gold/20 focus:bg-white focus:border-brand-gold focus:ring-brand-gold/30 text-lg rounded-xl text-brand-blue pl-4" />
               </div>
               <div className="flex justify-end pt-2">
                 <Button type="submit" disabled={isSavingPassword || newPassword.length < 6} className="hover-lift w-full sm:w-auto bg-brand-gold hover:bg-[#c2933d] text-white h-12 px-8 shadow-lg shadow-brand-gold/20 font-bold tracking-wide rounded-xl active:scale-95">
                   {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Reforzar Contraseña"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

      </main>
    </div>
  );
}
