"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Shield, Zap, Target, Lock, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    // First try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (signUpError) {
          setErrorMsg(signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        setErrorMsg(signInError.message);
        setLoading(false);
        return;
      }
    }

    // Success! Redirect
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-brand-pink/30 relative">
      
      {/* Background Ambience Mesh (Light Theme using Brand Colors) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-lightblue/30 rounded-full blur-[120px] opacity-60 animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-yellow/40 rounded-full blur-[150px] opacity-60 animate-pulse" style={{animationDuration: '12s'}} />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-brand-pink/20 rounded-full blur-[100px] opacity-50" />
      </div>

      {/* Navigation Layer */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-brand-blue/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-brand-blue font-bold text-sm tracking-wide">
              Módulo de Entrenamiento Continuo
            </span>
          </div>
        </div>
      </nav>

      {/* Unified Single-Screen Portal */}
      <main className="relative min-h-[100dvh] pt-24 pb-8 px-6 lg:px-8 flex flex-col justify-center z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center gap-10 sm:gap-14 lg:gap-16 mt-4">
          
          {/* Top Half: Hero & Login */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center w-full">
            
            {/* Typographic Pillar */}
            <div className="space-y-6 relative z-20 text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lightblue/30 border border-brand-blue/20 text-brand-blue text-[11px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md">
                <Zap className="h-3 w-3 fill-brand-gold text-brand-gold" />
                Cero Papeleo. 100% Digital.
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-headline font-black leading-[1.05] tracking-tighter text-brand-blue">
                Entrenamiento <br className="hidden lg:block" />
                <span className="text-brand-pink lg:block">
                  Directo y Vital.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-lg font-medium mx-auto lg:mx-0">
                Bienvenido a <strong className="text-brand-blue font-black">DiaCero</strong>. Nuestra misión es <strong className="text-brand-blue">erradicar el tiempo de inactividad</strong>. Absorbe normativas técnicas en minutos, supera módulos rápidos directamente desde tu teléfono, y obtén tus <strong>certificados</strong> al instante para volver a la acción en faena sin atascos burocráticos.
              </p>
            </div>

            {/* Action/Login Block */}
            <div className="relative z-10 mx-auto lg:ml-auto lg:mr-0 w-full max-w-md mt-6 lg:mt-0 text-left">
              {/* Halo Glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-brand-pink/20 to-brand-lightblue/20 blur-[50px] rounded-full" />
              
              {/* Login Container (Light Mode) */}
              <div className="relative bg-white/90 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(63,108,166,0.15)]">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="bg-brand-lightblue/30 p-2.5 rounded-xl border border-brand-blue/20">
                     <Lock className="h-5 w-5 text-brand-blue" />
                   </div>
                   <div>
                     <h2 className="text-xl font-headline font-bold text-brand-blue leading-tight">Acceso Directo</h2>
                     <p className="text-xs text-slate-500 mt-0.5">Ingresa a tu Módulo Asignado</p>
                   </div>
                 </div>

                 {errorMsg && (
                   <div className="bg-red-50 text-red-600 text-xs font-bold p-2.5 rounded-lg mb-4 border border-red-200 text-center">
                     {errorMsg}
                   </div>
                 )}

                 <form onSubmit={handleLogin} className="space-y-4">
                   <div className="space-y-1.5">
                     <Label htmlFor="email" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">Correo Electrónico Asignado</Label>
                     <Input 
                       id="email" 
                       type="email" 
                       placeholder="Inserte su correo" 
                       required 
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="h-12 bg-slate-50 border-slate-200 text-brand-blue placeholder:text-slate-400 focus:border-brand-pink focus:ring-brand-pink/50 text-sm rounded-xl transition-colors"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <div className="flex justify-between items-center">
                       <Label htmlFor="password" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">Código de Seguridad Único</Label>
                     </div>
                     <Input 
                       id="password" 
                       type="password" 
                       required 
                       placeholder="Inserte su contraseña"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="h-12 bg-slate-50 border-slate-200 text-brand-blue placeholder:text-slate-400 focus:border-brand-pink focus:ring-brand-pink/50 text-sm rounded-xl transition-colors"
                     />
                   </div>
                   <Button 
                     type="submit" 
                     className="w-full h-12 text-sm font-black bg-brand-pink hover:bg-[#c9788d] text-white mt-4 rounded-xl shadow-lg shadow-brand-pink/30 transition-all uppercase tracking-wide" 
                     disabled={loading}
                   >
                     {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Formación Ahora"}
                   </Button>
                 </form>
              </div>
            </div>
          </div>

          {/* Bottom Half: Feature Architecture Base (Light Mode Cards) */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 w-full">
            <div className="bg-white/80 backdrop-blur-md border border-brand-blue/10 rounded-3xl p-6 sm:p-7 hover:border-brand-blue/30 transition-colors shadow-xl shadow-brand-blue/5">
              <div className="bg-brand-lightblue/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-brand-blue/10">
                <BookOpen className="h-5 w-5 text-brand-blue" />
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold text-brand-blue mb-2">Módulos Simplificados</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">Las normativas se descomponen en piezas digeribles combinando texto interactivo, material de YouTube y gráficos visuales explícitos.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md border border-brand-blue/10 rounded-3xl p-6 sm:p-7 hover:border-brand-blue/30 transition-colors shadow-xl shadow-brand-blue/5">
              <div className="bg-brand-yellow/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-brand-gold/30">
                <Target className="h-5 w-5 text-brand-gold" />
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold text-brand-blue mb-2">Exámenes Interactivos</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">Olvídate del papel y el lápiz. Nuestra suite genera cuestionarios automáticos para validar instantáneamente tu aprendizaje.</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-md border border-brand-blue/10 rounded-3xl p-6 sm:p-7 hover:border-brand-blue/30 transition-colors shadow-xl shadow-brand-blue/5">
              <div className="bg-brand-pink/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-brand-pink/30">
                <Shield className="h-5 w-5 text-brand-pink" />
              </div>
              <h3 className="text-lg sm:text-xl font-headline font-bold text-brand-blue mb-2">Diplomas Encriptados</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">DiaCero firma encriptadamente tu evaluación finalizada, emitiendo PDFs directos ajustados automáticamente a hoja física formato A4.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
