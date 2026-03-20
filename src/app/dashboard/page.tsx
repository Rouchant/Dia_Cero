"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Award, Clock, ArrowRight, User, Settings, LogOut, CheckCircle2, Sparkles } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from "@/components/ui/logo";
import { DIA_CERO_MODULE } from '@/lib/module-data';

export default function Dashboard() {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dia_cero_progress');
    if (saved) {
      const { completed } = JSON.parse(saved);
      const val = Math.round(((completed?.length || 0) / DIA_CERO_MODULE.sections.length) * 100);
      setProgress(val);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mt-1">
            <Logo className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Usuario Piloto</p>
              <p className="text-xs text-muted-foreground">Explorador de Aprendizaje</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left: User Stats & Progress */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-primary/5 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline font-bold">Tus Estadísticas de Aprendizaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Logro de Enfoque</p>
                    <p className="text-sm font-medium">Fundamentos Dominados</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <Clock className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-black text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Mins Aprendiendo</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <Award className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-2xl font-black text-foreground">85%</p>
                    <p className="text-xs text-muted-foreground">Promedio en Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start h-12 font-medium">
                <User className="h-5 w-5 mr-3" /> Configuración de Perfil
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 font-medium">
                <Settings className="h-5 w-5 mr-3" /> Preferencias
              </Button>
              <Link href="/admin/dashboard" className="block">
                <Button variant="outline" className="w-full justify-start h-12 font-bold border-accent/20 bg-accent/5 text-accent hover:bg-accent/10">
                  <Award className="h-5 w-5 mr-3" /> Panel de Administrador
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button variant="ghost" className="w-full justify-start h-12 font-medium text-destructive hover:text-destructive hover:bg-destructive/5">
                  <LogOut className="h-5 w-5 mr-3" /> Cerrar Sesión
                </Button>
              </Link>
            </nav>
          </div>

          {/* Right: Active Modules */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-black text-foreground tracking-tight">¡Bienvenido de nuevo!</h2>
              <p className="text-muted-foreground text-lg">Continúa donde lo dejaste en tu viaje de aprendizaje.</p>
            </div>

            <Card className="overflow-hidden border-primary/10 shadow-xl group hover:shadow-2xl transition-all">
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <Image 
                  src="https://picsum.photos/seed/learn1/1200/600" 
                  alt="Module Hero"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  data-ai-hint="online learning"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-headline font-bold text-white mb-2">{DIA_CERO_MODULE.title}</h3>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {DIA_CERO_MODULE.sections.length} Secciones</span>
                    <span className="flex items-center gap-1.5"><Award className="h-4 w-4" /> Certificación Disponible</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  {DIA_CERO_MODULE.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground uppercase tracking-wider">Progreso del Curso</span>
                    <span className="text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-primary/10" />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <Link href="/module/intro" className="flex-1">
                    <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                      {progress > 0 ? "Continuar Aprendizaje" : "Iniciar Módulo"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="h-14 px-8 text-lg font-bold border-2">
                    Ver Plan de Estudios
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-none bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-base font-headline font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Recomendado para Ti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Basado en tus intereses: Técnicas Avanzadas de Síntesis</p>
                  <Button variant="link" className="p-0 h-auto text-accent text-xs font-bold mt-2">EXPLORAR MÓDULO</Button>
                </CardContent>
              </Card>
              <Card className="border-none bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base font-headline font-bold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Biblioteca de Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Descarga la hoja de ruta "Línea Base de Enfoque" (PDF).</p>
                  <Button variant="link" className="p-0 h-auto text-primary text-xs font-bold mt-2">DESCARGAR AHORA</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
