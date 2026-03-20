"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Lock } from "lucide-react";
import Link from 'next/link';
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock authentication
    setTimeout(() => {
      localStorage.setItem('dia_cero_auth', 'true');
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="mb-8">
        <Logo className="h-10 w-auto" />
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-primary/5">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Acceso Piloto</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al módulo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="piloto@diacero.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-primary/10"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button type="button" className="text-xs text-primary font-medium hover:underline">¿Olvidaste tu contraseña?</button>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-primary/10"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 mt-4" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center border-t py-6 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href="#" className="text-primary font-bold hover:underline">Solicita acceso piloto</Link>
          </p>
        </CardFooter>
      </Card>
      
      <p className="mt-8 text-xs text-muted-foreground/60 max-w-xs text-center">
        Esta es una versión piloto controlada. Para asistencia técnica, contacta a help@diacero.com
      </p>
    </div>
  );
}
