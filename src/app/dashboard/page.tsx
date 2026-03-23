"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, User, Star, Trophy, Clock, LogOut, Settings, Bell, ChevronRight, Award } from "lucide-react";
import Link from 'next/link';
import { Logo } from "@/components/ui/logo";
import { createClient } from '@/utils/supabase/client';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [assignedModules, setAssignedModules] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("Usuario Alumno");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    async function fetchModules() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      
      if (authData.user?.email) {
        setUserEmail(authData.user.email);
      }
      if (authData.user?.user_metadata?.role === 'admin') {
        setIsAdmin(true);
      }

      if (!currentUserId) return;

      // 1. Fetch user progress for current user
      const { data: upData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUserId);

      if (!upData || upData.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Fetch module records for those module_ids
      const modIds = upData.map(p => p.module_id);
      const { data: modsData } = await supabase
        .from('modules')
        .select('*, module_sections(*)')
        .in('id', modIds);

      if (modsData) {
        const enriched = modsData.map(mod => {
           const prog = upData.find(p => p.module_id === mod.id);
           const totalSections = Math.max(1, mod.module_sections?.length || 1);
           const completedSections = Array.isArray(prog?.completed_sections) ? prog.completed_sections : [];
           const progressPerc = Math.round((completedSections.length / totalSections) * 100);
           
           return {
             ...mod,
             progress_percentage: progressPerc > 100 ? 100 : progressPerc,
             completed_sections: completedSections,
             total_sections: totalSections
           };
        });
        setAssignedModules(enriched);
      }
      setLoading(false);
    }

    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Panel */}
      <header className="bg-primary text-primary-foreground px-6 py-4 shadow-md bg-opacity-95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="white" className="h-8 w-auto" />
            <span className="font-headline font-black text-lg tracking-tight hidden sm:inline">Portal Piloto</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full border border-white/10">
              <div className="bg-primary-foreground text-primary rounded-full p-1 border-2 border-primary-foreground/20">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium mr-1 hidden sm:inline">{userEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Welcome Section */}
        <section className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-headline font-bold text-slate-800 tracking-tight">
            Hola, <span className="text-primary pr-1">Estudiante</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Aquí tienes un resumen de todos los currículums de aprendizaje que te han sido asignados.</p>
        </section>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Course Feed */}
          <div className="flex-1 space-y-6">
            <h2 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" /> Tus Módulos Activos
            </h2>
            
            {loading ? (
              <div className="text-center py-16 animate-pulse opacity-50 bg-slate-100 rounded-xl border border-slate-200">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                <p className="font-medium text-slate-500">Cargando material académico desde la nube...</p>
              </div>
            ) : assignedModules.length === 0 ? (
              <Card className="border-dashed shadow-sm text-center py-16 border-slate-300">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="text-slate-400 h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Sin Módulos Asignados</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">Tu administrador aún no te ha matriculado en ningún currículum dinámico. ¡Vuelve pronto!</p>
              </Card>
            ) : (
                assignedModules.map((mod, index) => (
                  <Card key={mod.id} className="shadow-lg border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors"></div>
                    <CardHeader className="bg-white pb-4 relative z-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="inline-block px-3 py-1 mb-3 text-xs font-black tracking-widest rounded-full bg-primary/10 text-primary uppercase">
                            CÁPSULA ACADÉMICA {index + 1}
                          </div>
                          <CardTitle className="text-2xl font-headline font-black text-slate-800 leading-tight">{mod.title}</CardTitle>
                          <CardDescription className="text-slate-600 mt-2 text-base leading-relaxed">{mod.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 bg-slate-50/50">
                      {/* Progress Metrics */}
                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-slate-600 flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-500"/> Avance General</span>
                        <span className="font-bold flex items-center gap-1.5 text-slate-700">{mod.progress_percentage}%<span className="text-slate-400 font-normal text-xs">/ 100%</span></span>
                      </div>
                      <Progress value={mod.progress_percentage || 0} className="h-3 mb-6 bg-slate-200" />
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href={`/module/${mod.id}`} className={mod.progress_percentage >= 100 ? "flex-1" : "w-full"}>
                          <Button className={`w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all ${mod.progress_percentage >= 100 ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" : ""}`} variant={mod.progress_percentage >= 100 ? "outline" : "default"} size="lg">
                            {mod.progress_percentage > 0 && mod.progress_percentage < 100 ? "Continuar Entrenando" : 
                             mod.progress_percentage >= 100 ? "Repasar Módulo" : "Comenzar Ahora"}
                          </Button>
                        </Link>
                        {mod.progress_percentage >= 100 && (
                          <Link href={`/certificate/${mod.id}`} className="flex-1">
                            <Button className="w-full h-12 text-base font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all bg-indigo-600 hover:bg-indigo-700 text-white" size="lg">
                              <Award className="mr-2 h-5 w-5"/> Ir al Certificado
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>

          {/* Sidebar Area */}
          <div className="w-full md:w-80 space-y-6">
            <Card className="shadow-md border-slate-200">
              <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-lg font-headline font-bold flex items-center gap-2 text-slate-800">
                  <User className="h-5 w-5 text-primary" /> Atajos de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link href="/settings" className="block">
                  <Button variant="ghost" className="w-full justify-start h-12 font-medium text-slate-600 hover:text-primary hover:bg-primary/5">
                    <Settings className="h-5 w-5 mr-3" /> Preferencias 
                  </Button>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin/dashboard" className="block">
                    <Button variant="outline" className="w-full justify-start h-12 font-bold border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                      <Award className="h-5 w-5 mr-3" /> Panel de Administrador <ChevronRight className="h-4 w-4 ml-auto opacity-50"/>
                    </Button>
                  </Link>
                )}
                
                <div className="h-px bg-slate-100 my-2 w-full"></div>
                
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full justify-start h-12 font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors">
                    <LogOut className="h-5 w-5 mr-3" /> Cerrar Sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 shadow-inner">
               <CardContent className="p-5 flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">Ritmo de Aprendizaje</h4>
                  <p className="text-xs text-slate-600 font-medium">Mantén una racha constante para absorber las normativas más eficientemente.</p>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
