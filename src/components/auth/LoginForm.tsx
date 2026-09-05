"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import { cn } from "@/lib/utils";

interface LoginFormProps {
  className?: string;
  title?: string;
  description?: string;
  showIcon?: boolean;
}

export function LoginForm({ 
  className, 
  title = "Acceso Directo", 
  description = "Ingresa a tu Módulo Asignado",
  showIcon = true
}: LoginFormProps) {
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
    
    // Autenticación real contra la base de datos de Supabase Auth
    const { data: authResult, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Correo electrónico o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Redirección directa al panel de usuario / estudiante para todos los roles
    router.push('/dashboard');
  };

  return (
    <div className={cn(
      "relative bg-white/90 backdrop-blur-xl border border-brand-blue/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(63,108,166,0.15)]",
      className
    )}>
      {showIcon && (
        <div className="flex items-center gap-4 mb-6 text-left">
          <div className="bg-brand-lightblue/30 p-2.5 rounded-xl border border-brand-blue/20">
            <Lock className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-brand-blue leading-tight">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-600 text-xs font-bold p-2.5 rounded-lg mb-4 border border-red-200 text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="user-email" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
            Correo Electrónico Asignado
          </Label>
          <Input 
            id="user-email" 
            name="username"
            type="email" 
            autoComplete="username"
            placeholder="Inserte su correo" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-slate-50 border-slate-200 text-brand-blue placeholder:text-slate-400 focus:ring-brand-blue/20 text-base rounded-xl transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="user-password" className="text-brand-blue font-bold uppercase tracking-wider text-[10px]">
              Contraseña
            </Label>
          </div>
          <Input 
            id="user-password" 
            name="password"
            type="password" 
            autoComplete="current-password"
            spellCheck={false}
            autoCorrect="off"
            required 
            placeholder="Inserte su contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 bg-slate-50 border-slate-200 text-brand-blue placeholder:text-slate-400 focus:ring-brand-blue/20 text-base rounded-xl transition-colors"
          />
        </div>
        <Button 
          type="submit" 
          className="hover-lift w-full h-12 text-sm font-black bg-emerald-700 hover:bg-emerald-800 text-white mt-4 rounded-xl shadow-lg shadow-emerald-700/25 transition-all uppercase tracking-wide active:scale-95" 
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Formación Ahora"}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 font-medium">
          ¿Eres estudiante nuevo con código de empresa?
        </p>
        <a 
          href="/auth/register" 
          className="inline-block mt-1 text-xs font-bold text-brand-blue hover:text-brand-green transition-colors underline"
        >
          Crear cuenta de estudiante aquí →
        </a>
      </div>
    </div>
  );
}
