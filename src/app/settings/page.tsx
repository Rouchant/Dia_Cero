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
    
    // Update explicitly on public.profiles
    const { error } = await supabase.from('profiles').update({ name }).eq('id', userId);
    
    // Also mirror to auth user metadata to keep auth.users in sync if needed
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
      alert("La fortaleza criptográfica requiere al menos 6 caracteres alfanuméricos.");
      return;
    }
    setIsSavingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      alert("Falla de Motor Auth al encriptar: " + error.message);
    } else {
      alert("¡Contraseña maestra actualizada con éxito en la bóveda! Tus accesos futuros están asegurados.");
      setNewPassword("");
    }
    setIsSavingPassword(false);
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex flex-col gap-4 items-center justify-center">
       <Loader2 className="h-8 w-8 animate-spin text-primary" />
       <p className="text-slate-500 font-medium animate-pulse">Desencriptando bóveda central...</p>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header Panel */}
      <header className="bg-primary text-primary-foreground px-6 py-4 shadow-md bg-opacity-95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mr-2 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo variant="white" className="h-8 w-auto hidden sm:block" />
            <span className="font-headline font-black text-lg tracking-tight uppercase border-l border-white/20 sm:ml-2 sm:pl-3">Settings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium opacity-80 bg-black/10 px-3 py-1.5 rounded-full border border-white/10 hidden sm:block">{userEmail}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 pt-6 sm:pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <div className="mb-4">
           <h1 className="text-3xl font-headline font-black text-slate-800 tracking-tight">Centro de Preferencias</h1>
           <p className="text-slate-500 mt-2 text-base">Edita tu identificación oficial o fuerza una rotación de las credenciales de seguridad de tu cuenta.</p>
         </div>

         <Card className="shadow-lg border-primary/10 overflow-hidden">
           <CardHeader className="bg-white border-b pb-4 bg-gradient-to-r from-primary/5 to-transparent">
             <CardTitle className="flex items-center gap-2 font-headline text-xl"><User className="h-5 w-5 text-primary"/> Identidad Oficial</CardTitle>
             <CardDescription className="text-sm">
               Este es el nombre con el que tu supervisor te visualiza en el panel de analíticas, y es el nombre exacto que será impreso de forma indeleble en tus <strong>Certificados y Diplomas A4</strong>.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdateName} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="u-name" className="text-slate-800 font-bold uppercase tracking-wider text-xs">Nombre Completo Registrado</Label>
                 <Input id="u-name" value={name} onChange={e=>setName(e.target.value)} required className="h-12 bg-slate-50 border-slate-200 focus:bg-white text-lg font-medium text-slate-800" />
               </div>
               <div className="flex justify-end pt-2">
                 <Button type="submit" disabled={isSavingName} className="bg-primary hover:bg-primary/90 h-11 px-6 shadow-md shadow-primary/20 font-bold">
                   {isSavingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                   Sellar Identidad
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

         <Card className="shadow-lg border-indigo-100 border-t-[4px] border-t-indigo-500 overflow-hidden">
           <CardHeader className="bg-slate-50 border-b pb-4">
             <CardTitle className="flex items-center gap-2 font-headline text-xl"><ShieldCheck className="h-5 w-5 text-indigo-500"/> Seguridad de Acceso</CardTitle>
             <CardDescription className="text-sm">
               Cambia tu contraseña maestra si sientes que tu conexión ha sido comprometida. Por razones de seguridad del motor Supabase, se desloguearán automáticamente el resto de dispositivos vinculados.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-6">
             <form onSubmit={handleUpdatePassword} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="u-pwd" className="text-slate-800 font-bold uppercase tracking-wider text-xs">Inyectar Nueva Contraseña</Label>
                 <Input id="u-pwd" type="password" placeholder="Mínimo 6 caracteres alfanuméricos" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={6} className="h-12 border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-lg" />
               </div>
               <div className="flex justify-end pt-2">
                 <Button type="submit" disabled={isSavingPassword || newPassword.length < 6} className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-6 shadow-md shadow-indigo-200 font-bold tracking-wide">
                   {isSavingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Encriptar Nueva Contraseña"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>

      </main>
    </div>
  );
}
