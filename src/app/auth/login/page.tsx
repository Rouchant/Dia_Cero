"use client"

import Link from 'next/link';
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="mb-8">
        <Logo className="h-10 w-auto" />
      </Link>

      <LoginForm 
        className="w-full max-w-md shadow-2xl border-primary/5"
        title="Acceso Piloto"
        description="Ingresa tus credenciales para acceder al módulo"
      />
      
      <p className="mt-8 text-xs text-muted-foreground/60 max-w-xs text-center">
        Esta es una versión piloto controlada. Para asistencia técnica, contacta a help@diacero.com
      </p>
    </div>
  );
}
