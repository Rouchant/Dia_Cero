"use client"

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, User, Star, Trophy, Clock, LogOut, Settings, Bell, ChevronRight, Award, LayoutDashboard } from "lucide-react";
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

      const { data: upData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', currentUserId);

      if (!upData || upData.length === 0) {
        setLoading(false);
        return;
      }

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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header Panel Light Theme */}
      <header className="bg-white/90 text-brand-blue px-6 py-4 shadow-sm border-b border-brand-blue/10 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <span className="font-headline font-black text-lg tracking-tight hidden sm:inline mt-2.5 leading-none border-l border-brand-blue/20 pl-3">Portal Piloto</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-brand-blue hover:text-brand-blue hover:bg-brand-lightblue/20 rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 bg-brand-lightblue/10 px-3 py-1.5 rounded-full border border-brand-blue/10 shadow-sm">
              <div className="bg-white text-brand-blue rounded-full p-1 border border-brand-blue/20">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold mr-1 hidden sm:inline">{userEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Welcome Section */}
        <section className="mb-8 animate-in fade-in slide-in-from-left duration-700 ease-out">
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-brand-blue tracking-tight">
            Hola, <span className="text-brand-pink pr-1 inline-block hover:animate-bounce cursor-default">Estudiante</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Aquí tienes un resumen de todos los currículums de aprendizaje que te han sido asignados.</p>
        </section>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile-only quick access bar for account actions */}
          <div className="flex md:hidden gap-2 flex-wrap mb-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="h-10 font-bold text-slate-600 border-brand-blue/20 hover:text-brand-blue hover:bg-brand-lightblue/10 rounded-xl">
                <Settings className="h-4 w-4 mr-2" /> Preferencias
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin/dashboard">
                <Button size="sm" className="h-10 font-bold bg-brand-gold hover:bg-[#d98a00] text-white rounded-xl shadow-sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Admin
                </Button>
              </Link>
            )}
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="h-10 font-bold text-red-500 hover:text-white hover:bg-red-500 border-red-200 rounded-xl">
                <LogOut className="h-4 w-4 mr-2" /> Salir
              </Button>
            </Link>
          </div>

          {/* Main Course Feed */}
          <div className="flex-1 space-y-6">
            <h2 className="text-xl font-bold font-headline mb-4 flex items-center gap-2 text-brand-blue">
              <BookOpen className="text-brand-lightblue h-5 w-5 fill-brand-lightblue/20" /> Tus Módulos Activos
            </h2>

            
            {loading ? (
              <div className="text-center py-16 animate-pulse opacity-50 bg-white rounded-3xl border border-brand-blue/10 shadow-sm">
                <BookOpen className="h-8 w-8 mx-auto mb-3 text-brand-lightblue" />
                <p className="font-medium text-slate-500">Cargando material académico desde la nube...</p>
              </div>
            ) : assignedModules.length === 0 ? (
              <Card className="border-dashed shadow-sm text-center py-16 border-brand-blue/20 bg-white/50 backdrop-blur-sm rounded-3xl">
                <div className="w-16 h-16 bg-brand-lightblue/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-blue/10">
                  <Star className="text-brand-gold h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-brand-blue font-headline">Sin Módulos Asignados</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">Tu administrador aún no te ha matriculado en ningún currículum dinámico. ¡Vuelve pronto!</p>
              </Card>
            ) : (
                assignedModules.map((mod, index) => (
                  <Card key={mod.id} className="hover-lift shadow-lg border-brand-blue/10 hover:border-brand-blue/30 group overflow-hidden relative rounded-3xl bg-white/90 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-lightblue/10 rounded-bl-full -z-10 group-hover:bg-brand-lightblue/20 transition-colors"></div>
                    <CardHeader className="bg-transparent pb-4 relative z-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="inline-block px-3 py-1 mb-3 text-xs font-black tracking-widest rounded-full bg-brand-lightblue/20 text-brand-blue uppercase border border-brand-blue/5">
                            CÁPSULA ACADÉMICA {index + 1}
                          </div>
                          <CardTitle className="text-2xl font-headline font-black text-brand-blue leading-tight">{mod.title}</CardTitle>
                          <CardDescription className="text-slate-500 mt-2 text-base leading-relaxed font-medium">{mod.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {/* Progress Metrics */}
                      <div className="flex justify-between text-sm mb-2 font-bold">
                        <span className="text-brand-blue flex items-center gap-1.5"><Trophy className="h-4 w-4 text-brand-gold"/> Avance General</span>
                        <span className="font-black flex items-center gap-1.5 text-brand-blue">
                          {mod.progress_percentage}%
                          <span className="text-slate-400 font-medium text-xs">/ 100%</span>
                        </span>
                      </div>
                      <Progress 
                        value={mod.progress_percentage || 0} 
                        className={`h-3 mb-6 bg-slate-100 transition-all duration-1000 ${mod.progress_percentage >= 100 ? '[&>div]:bg-brand-green' : '[&>div]:bg-brand-blue'}`} 
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href={`/module/${mod.id}`} className={mod.progress_percentage >= 100 ? "flex-1" : "w-full"}>
                          <Button className={`w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-95 ${mod.progress_percentage >= 100 ? "bg-brand-blue hover:bg-[#163BB5] text-white" : "bg-gradient-playful hover:opacity-90 text-white"}`} variant="default" size="lg">
                            {mod.progress_percentage > 0 && mod.progress_percentage < 100 ? "Continuar Entrenando" : 
                             mod.progress_percentage >= 100 ? "Repasar Módulo" : "Comenzar Ahora"}
                          </Button>
                        </Link>
                        {mod.progress_percentage >= 100 && (
                          <Link href={`/certificate/${mod.id}`} className="flex-1">
                              <Button className="w-full h-12 text-base font-bold shadow-lg shadow-brand-gold/30 hover:shadow-brand-gold/50 transition-all bg-brand-gold hover:bg-[#d98a00] text-white" size="lg">
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
            <Card className="shadow-lg border-brand-blue/10 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3 bg-brand-lightblue/10 border-b border-brand-blue/5">
                <CardTitle className="text-lg font-headline font-bold flex items-center gap-2 text-brand-blue">
                  <User className="h-5 w-5 text-brand-blue" /> Atajos de Cuenta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link href="/settings" className="block">
                  <Button variant="ghost" className="w-full justify-start h-12 font-bold text-slate-600 hover:text-brand-blue hover:bg-brand-lightblue/20 rounded-xl">
                    <Settings className="h-5 w-5 mr-3" /> Preferencias 
                  </Button>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin/dashboard" className="block">
                    <Button variant="default" className="w-full justify-start h-12 font-bold bg-brand-gold hover:bg-[#d98a00] text-white transition-colors rounded-xl shadow-sm">
                      <LayoutDashboard className="h-5 w-5 mr-3" /> Panel de Administrador <ChevronRight className="h-4 w-4 ml-auto opacity-50"/>
                    </Button>
                  </Link>
                )}
                
                <div className="h-px bg-brand-blue/5 my-2 w-full"></div>
                
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full justify-start h-12 font-bold text-red-500 hover:text-white hover:bg-red-500 transition-colors rounded-xl">
                    <LogOut className="h-5 w-5 mr-3" /> Cerrar Sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-brand-lightblue/20 to-brand-yellow/20 border-brand-blue/10 shadow-inner rounded-3xl">
               <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-14 w-14 bg-white rounded-full shadow-md flex items-center justify-center mb-4 border border-brand-blue/5">
                    <Clock className="h-7 w-7 text-brand-gold" />
                  </div>
                  <h4 className="font-headline font-black text-brand-blue mb-2 text-lg">Ritmo de Aprendizaje</h4>
                  <p className="text-sm text-brand-blue/80 font-medium">Mantén una racha constante para absorber las normativas más eficientemente.</p>
               </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
