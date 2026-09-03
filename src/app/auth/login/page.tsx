"use client"

import Link from 'next/link';
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="mb-8" aria-label="Ir a la página de inicio">
        <Logo />
      </Link>

      <LoginForm 
        className="w-full max-w-md shadow-2xl border-primary/5"
        title="Acceso Piloto"
        description="Ingresa tus credenciales para acceder al módulo"
      />
      
      <p className="mt-8 text-xs text-slate-600 max-w-xs text-center font-medium">
        Esta es una versión piloto controlada. Para asistencia técnica, contacta a help@diacero.com
      </p>
    </main>
  );
}
