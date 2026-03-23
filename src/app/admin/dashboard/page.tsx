"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Award, ArrowLeft, Search } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { createClient } from '@/utils/supabase/client';

export default function AdminDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      // Secure the route
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/auth/login');
        return;
      }

      // Check role straight from the users table metadata (without doing a secondary table query!)
      const userRole = authData.user.user_metadata?.role;

      if (userRole !== 'admin') {
        router.push('/dashboard');
        return;
      }

      // Fetch profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      // Fetch user progress for module
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('module_id', 'seguridad-laboral-chile');
        
      // Fetch module to know the total sections
      const { data: modData } = await supabase
        .from('modules')
        .select('*, module_sections(*)')
        .eq('id', 'seguridad-laboral-chile')
        .single();
        
      const totalSections = modData?.module_sections?.length || 1;

      if (profiles) {
        // Map progress into profiles
        const enhancedUsers = profiles.map(profile => {
          const userProg = progressData?.find(p => p.user_id === profile.id);
          const completedSections = userProg?.completed_sections || [];
          const completedLen = Array.isArray(completedSections) ? completedSections.length : 0;
          const progPercentage = Math.round((completedLen / totalSections) * 100);
          
          return {
            ...profile,
            progress_percentage: progPercentage > 100 ? 100 : progPercentage,
            last_active: userProg?.updated_at ? new Date(userProg.updated_at).toLocaleDateString() : 'N/A'
          };
        });
        
        setUsers(enhancedUsers);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const completedUsers = users.filter(u => u.progress_percentage === 100).length;
  const totalProgress = users.reduce((sum, u) => sum + (u.progress_percentage || 0), 0);
  const averageProgress = totalUsers > 0 ? Math.round(totalProgress / totalUsers) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-auto" variant="white" />
              <span className="text-emerald-400 font-bold px-2 border-l border-white/20 ml-2 hidden sm:inline">ADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Administrador Principal</p>
              <p className="text-xs text-white/70">Panel de Control</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black text-foreground">Visión General del Piloto</h1>
          <p className="text-muted-foreground text-lg mt-2">Monitorea en tiempo real el progreso de todos los estudiantes asignados a este programa.</p>
        </div>

        {/* KPIs */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="shadow-md border-primary/5 hover:border-primary/20 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-muted-foreground">Usuarios Totales</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black">{loading ? "-" : totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md border-accent/5 hover:border-accent/20 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-muted-foreground">Progreso Promedio</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-accent">{averageProgress}%</p>
              </div>
              <Progress value={averageProgress} className="h-2 mt-3 bg-accent/20" />
            </CardContent>
          </Card>
          <Card className="shadow-md border-emerald-50 hover:border-emerald-200 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-muted-foreground">Certificados Emitidos</CardTitle>
              <div className="p-2 bg-emerald-100 rounded-full">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-emerald-700">{completedUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">Estudiantes que han completado al 100%.</p>
            </CardContent>
          </Card>
        </div>

        {/* User Table */}
        <Card className="shadow-xl border-primary/10 overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-headline font-bold">Lista de Estudiantes</CardTitle>
                <CardDescription>Detalles individuales de progreso por usuario.</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o correo..." 
                  className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                  <tr>
                    <th className="px-6 py-4 font-bold">Estudiante</th>
                    <th className="px-6 py-4 font-bold min-w-[200px]">Progreso</th>
                    <th className="px-6 py-4 font-bold text-center">Puntaje Calif.</th>
                    <th className="px-6 py-4 font-bold">Última Actividad</th>
                    <th className="px-6 py-4 font-bold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t-0">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-muted-foreground">
                        Cargando usuarios desde Supabase...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-muted-foreground">
                        No hay usuarios registrados en la base de datos aún.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground text-base">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs w-8 text-right">{user.progress_percentage || 0}%</span>
                            <Progress 
                              value={user.progress_percentage || 0} 
                              className={`h-2 flex-1 bg-primary/10`} 
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">
                          <span className="text-muted-foreground/50">-</span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                          {user.last_active || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                             {user.progress_percentage === 100 ? 'Completado' : user.progress_percentage > 0 ? 'En Progreso' : 'Nuevo'}
                           </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
