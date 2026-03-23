"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, Award, ArrowLeft, Search, PlusCircle, Book, Link as LinkIcon, Loader2, Edit3, Image as ImageIcon, Video, Save, ListChecks } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { createClient } from '@/utils/supabase/client';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // Basic State
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [dbModules, setDbModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);

  // User Creation State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("Cambiar123!");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Module Creation State
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);

  // Assignment State
  const [assignUserId, setAssignUserId] = useState("");
  const [assignModuleId, setAssignModuleId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // --- Content Editor State ---
  const [editContentModuleId, setEditContentModuleId] = useState("");
  const [contentSections, setContentSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  
  // Content Form fields
  const [editSecTitle, setEditSecTitle] = useState("");
  const [editSecContent, setEditSecContent] = useState("");
  const [editSecVideo, setEditSecVideo] = useState("");
  const [editSecImage, setEditSecImage] = useState("");

  // --- Quiz Editor State ---
  const [quizModuleId, setQuizModuleId] = useState("");
  const [quizSectionId, setQuizSectionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOptions, setNewQuizOptions] = useState("");
  const [newQuizAnswerIdx, setNewQuizAnswerIdx] = useState<number | ''>(1);
  const [isCreatingQuizQuestion, setIsCreatingQuizQuestion] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isCreatingQuizSection, setIsCreatingQuizSection] = useState(false);

  const fetchData = async () => {
    // 1. Secure route
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      router.push('/auth/login');
      return;
    }
    const userRole = authData.user.user_metadata?.role;
    if (userRole !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // 2. Fetch basic data
    const { data: mData } = await supabase.from('modules').select('*, module_sections(*)');
    if (mData) {
      setDbModules(mData);
      if (mData.length > 0) {
        if (!assignModuleId) setAssignModuleId(mData[0].id);
        if (!quizModuleId) setQuizModuleId(mData[0].id);
        if (!editContentModuleId) setEditContentModuleId(mData[0].id);
      }
    }

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: progressData } = await supabase.from('user_progress').select('*');

    if (profiles && mData) {
      const enhancedUsers = profiles.map(profile => {
        const userProgs = progressData?.filter(p => p.user_id === profile.id) || [];
        
        let totalComputed = 0;
        let fullyCompleted = 0;
        let moduleBreakdown: any[] = [];

        if (userProgs.length > 0) {
          userProgs.forEach(prog => {
            const courseMod = mData.find(m => m.id === prog.module_id);
            const totalSections = Math.max(1, courseMod?.module_sections?.length || 1);
            const completedLen = Array.isArray(prog.completed_sections) ? prog.completed_sections.length : 0;
            const modPercentage = Math.round((completedLen / totalSections) * 100);
            
            const finalPerc = modPercentage > 100 ? 100 : modPercentage;
            totalComputed += finalPerc;
            if (finalPerc >= 100) fullyCompleted++;
            
            moduleBreakdown.push({
               title: courseMod?.title || "Módulo Eliminado/Desconocido",
               percentage: finalPerc
            });
          });
        }
        
        const progPercentage = userProgs.length > 0 ? Math.round(totalComputed / userProgs.length) : 0;
        
        return {
          ...profile,
          progress_percentage: progPercentage,
          assigned_courses: userProgs.length,
          completed_courses: fullyCompleted,
          last_active: userProgs[0]?.updated_at ? new Date(userProgs[0].updated_at).toLocaleDateString() : 'N/A',
          moduleBreakdown
        };
      });
      
      setUsers(enhancedUsers);
      const firstStudent = enhancedUsers.find(u => u.role !== 'admin');
      if (firstStudent && !assignUserId) setAssignUserId(firstStudent.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch active Quiz context
  useEffect(() => {
    async function fetchQuizData() {
      if (!quizModuleId) return;
      setIsLoadingQuiz(true);
      const { data: qSection } = await supabase
        .from('module_sections')
        .select('*')
        .eq('module_id', quizModuleId)
        .eq('type', 'quiz')
        .maybeSingle();

      if (qSection) {
        setQuizSectionId(qSection.id);
        const { data: qData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('section_id', qSection.id)
          .order('created_at', { ascending: true });
        setQuizQuestions(qData || []);
      } else {
        setQuizSectionId(null);
        setQuizQuestions([]);
      }
      setIsLoadingQuiz(false);
    }
    fetchQuizData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizModuleId]);

  // Fetch active Content Editor context
  useEffect(() => {
    async function fetchContentData() {
      if (!editContentModuleId) return;
      setIsLoadingContent(true);
      const { data: sections } = await supabase
        .from('module_sections')
        .select('*')
        .eq('module_id', editContentModuleId)
        .eq('type', 'content')
        .order('sort_order', { ascending: true });

      if (sections) {
        setContentSections(sections);
        if (sections.length > 0) {
          fillContentForm(sections[0]);
        } else {
          clearContentForm();
        }
      } else {
        setContentSections([]);
        clearContentForm();
      }
      setIsLoadingContent(false);
    }
    fetchContentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editContentModuleId]);

  const fillContentForm = (section: any) => {
    setSelectedSectionId(section.id);
    setEditSecTitle(section.title || "");
    setEditSecContent(section.content || "");
    setEditSecVideo(section.video_url || "");
    setEditSecImage(section.image_url || "");
  };

  const clearContentForm = () => {
    setSelectedSectionId(null);
    setEditSecTitle("");
    setEditSecContent("");
    setEditSecVideo("");
    setEditSecImage("");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, name: newUserName })
      });
      if (res.ok) {
        alert("¡Estudiante creado exitosamente en Auth de Supabase y Perfiles!");
        setNewUserName(""); setNewUserEmail("");
        fetchData();
      } else {
        const data = await res.json();
        alert("Error de Creación: " + data.error);
      }
    } catch {
      alert("Error crítico ejecutando el servidor.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingModule(true);
    const mId = newModuleTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const { error: mError } = await supabase.from('modules').insert({
      id: mId,
      title: newModuleTitle,
      description: newModuleDesc
    });
    
    if (mError) { 
      alert("Falla insertando módulo principal: " + mError.message); 
      setIsCreatingModule(false); 
      return; 
    }

    await supabase.from('module_sections').insert({
      id: mId + '-intro',
      module_id: mId,
      title: 'Introducción Inédita',
      type: 'content',
      content: 'El Autor pronto editará y agregará el contenido oficial del módulo aquí.',
      sort_order: 0
    });

    alert("Módulo creado e indexado estructuralmente.");
    setNewModuleTitle(""); setNewModuleDesc("");
    fetchData();
    setIsCreatingModule(false);
  };

  const handleAssignModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignModuleId) return;
    setIsAssigning(true);

    const { error } = await supabase.from('user_progress').insert({
      user_id: assignUserId,
      module_id: assignModuleId,
      completed_sections: [],
      quiz_scores: {},
      current_section_index: 0
    });

    if (error) {
      if (error.message.includes('duplicate')) {
        alert("Aviso: El estudiante seleccionado ya tenía asignado este módulo.");
      } else {
        alert("Falla de Base de Datos: " + error.message);
      }
    } else {
      alert("¡Módulo inyectado exitosamente al alumno! Se reflejará en su panel privado instantáneamente.");
      fetchData();
    }
    setIsAssigning(false);
  };

  // --- Content Handlers ---
  const handleAddNewContentSection = async () => {
    if (!editContentModuleId) return;
    setIsSavingContent(true);
    const newId = crypto.randomUUID();
    const newSortOrder = contentSections.length > 0 ? contentSections[contentSections.length - 1].sort_order + 1 : 0;
    
    const newSec = {
      id: newId,
      module_id: editContentModuleId,
      title: 'Nueva Diapositiva',
      type: 'content',
      content: 'Escribe tu teoría aquí...',
      sort_order: newSortOrder
    };

    const { error } = await supabase.from('module_sections').insert(newSec);
    if (error) {
      alert("Error insertando sección de contenido vacía: " + error.message);
    } else {
      setContentSections([...contentSections, newSec]);
      fillContentForm(newSec);
    }
    setIsSavingContent(false);
  };

  const handleSaveContentSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionId) return;
    setIsSavingContent(true);

    const updates = {
      title: editSecTitle,
      content: editSecContent,
      video_url: editSecVideo || null,
      image_url: editSecImage || null
    };

    const { error } = await supabase
      .from('module_sections')
      .update(updates)
      .eq('id', selectedSectionId);

    if (error) {
      alert("Error guardando sección: " + error.message);
    } else {
      alert("¡Diapositiva sincronizada exitosamente con la base de datos! Los estudiantes verán el cambio de inmediato.");
      // update local
      setContentSections(contentSections.map(s => s.id === selectedSectionId ? { ...s, ...updates } : s));
    }
    setIsSavingContent(false);
  };


  // --- Quiz Handlers ---
  const handleCreateQuizSection = async () => {
    if (!quizModuleId) return;
    setIsCreatingQuizSection(true);
    const newSecId = quizModuleId + '-eval-final';
    const { error } = await supabase.from('module_sections').insert({
      id: newSecId,
      module_id: quizModuleId,
      title: 'Evaluación Final',
      type: 'quiz',
      content: 'Responda las siguientes preguntas para validar la absorción de los conocimientos del módulo crítico.',
      sort_order: 99
    });
    
    if (error) {
      alert("Error estableciendo la infraestructura del Quiz: " + error.message);
    } else {
      setQuizSectionId(newSecId);
      setQuizQuestions([]);
    }
    setIsCreatingQuizSection(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizSectionId) return;

    if (newQuizAnswerIdx === '' || newQuizAnswerIdx === null) {
      alert("Por favor provea un número de respuesta válido.");
      return;
    }

    const optionsArray = newQuizOptions.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    if (optionsArray.length < 2) {
      alert("Por favor provea al menos 2 posibles respuestas, separándolas mediante comas.");
      return;
    }
    
    const finalIndex = (newQuizAnswerIdx as number) - 1;
    if (finalIndex < 0 || finalIndex >= optionsArray.length) {
      alert(`El número de respuesta correcta debe ubicarse estrictamente entre 1 y ${optionsArray.length}`);
      return;
    }

    setIsCreatingQuizQuestion(true);
    const { data: newQ, error } = await supabase.from('quiz_questions').insert({
      id: crypto.randomUUID(),
      section_id: quizSectionId,
      question: newQuizQuestion,
      options: optionsArray,
      correct_answer: finalIndex
    }).select().single();

    if (error) {
      alert("Error empaquetando pregunta en el servidor: " + error.message);
    } else if (newQ) {
      setQuizQuestions([...quizQuestions, newQ]);
      setNewQuizQuestion("");
      setNewQuizOptions("");
      setNewQuizAnswerIdx(1);
    }
    setIsCreatingQuizQuestion(false);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const students = users.filter(u => u.role !== 'admin');
  const totalStudents = students.length;
  const completedStudents = students.filter(u => u.progress_percentage === 100).length;
  const totalProgress = students.reduce((sum, u) => sum + (u.progress_percentage || 0), 0);
  const averageProgress = totalStudents > 0 ? Math.round(totalProgress / totalStudents) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-slate-950 text-white px-6 py-4 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-auto" variant="white" />
              <span className="text-emerald-400 font-bold px-2 border-l border-white/20 ml-2 hidden sm:inline">ADMIN L.M.S</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Administrador Supervisor</p>
              <p className="text-xs text-white/70">Master Control</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black text-foreground">Plataforma Dinámica de Control</h1>
          <p className="text-muted-foreground text-lg mt-2">Gestiona estudiantes, diseña módulos y vigila la analítica en un solo lugar.</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 bg-slate-100 p-1.5 rounded-lg flex flex-wrap h-auto w-full max-w-[600px] border border-slate-200">
            <TabsTrigger value="overview" className="flex-1 py-2 rounded-md font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">📉 Estadísticas Globales</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 py-2 rounded-md font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">👥 Alta de Usuarios</TabsTrigger>
            <TabsTrigger value="modules" className="flex-1 py-2 rounded-md font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">📚 Curriculums Módulos</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW / ESTADISTICAS */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="shadow-md border-primary/5 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-muted-foreground">Estudiantes Operativos</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-black">{loading ? "-" : totalStudents}</p>
                </CardContent>
              </Card>
              <Card className="shadow-md border-accent/5 hover:border-accent/20 transition-colors">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold text-muted-foreground">Avance Promedio Global</CardTitle>
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
                  <CardTitle className="text-base font-bold text-muted-foreground">Completados Perfectos</CardTitle>
                  <div className="p-2 bg-emerald-100 rounded-full">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-black text-emerald-700">{completedStudents}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-xl border-primary/10 overflow-hidden">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl font-headline font-bold">Lista de Cursantes</CardTitle>
                    <CardDescription>Detalles individuales cruzando todos los cursos asignados.</CardDescription>
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
                        <th className="px-6 py-4 font-bold text-center">Cursos</th>
                        <th className="px-6 py-4 font-bold min-w-[200px]">Progreso Promedio</th>
                        <th className="px-6 py-4 font-bold">Última Actividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-t-0">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="text-center py-16 text-muted-foreground">
                            Cargando cruces relacionales desde Supabase... 📡
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-16 text-muted-foreground">
                            No hay cuentas en base de datos.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} onClick={() => setSelectedUserStats(user)} className="hover:bg-muted/70 cursor-pointer transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-bold text-foreground text-sm uppercase group-hover:text-primary transition-colors">
                                    {user.name} {user.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] tracking-widest border border-amber-300">ADMIN</span>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              {user.assigned_courses || 0}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-xs w-8 text-right text-slate-700">{user.progress_percentage || 0}%</span>
                                <Progress 
                                  value={user.progress_percentage || 0} 
                                  className={`h-2 flex-1 bg-primary/10`} 
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                              {user.last_active || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Drilldown User Dialog Overlay */}
            <Dialog open={!!selectedUserStats} onOpenChange={(open) => !open && setSelectedUserStats(null)}>
              <DialogContent className="sm:max-w-md border-primary/20 shadow-2xl">
                <DialogHeader className="border-b pb-4 mb-2">
                  <DialogTitle className="font-headline text-xl flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary"/> Expediente Académico
                  </DialogTitle>
                  <DialogDescription>
                    Desglose del avance asignado al operario <strong>{selectedUserStats?.name}</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  {selectedUserStats?.moduleBreakdown && selectedUserStats.moduleBreakdown.length > 0 ? (
                     selectedUserStats.moduleBreakdown.map((mb: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-primary/40 transition-colors shadow-sm relative overflow-hidden">
                          {mb.percentage >= 100 && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[100px] pointer-events-none"></div>}
                          <div className="flex justify-between items-start mb-3 gap-4">
                             <span className="font-bold text-slate-800 text-sm leading-tight">{mb.title}</span>
                             <span className={`font-black text-sm px-2 py-0.5 rounded flex-shrink-0 ${mb.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 'text-primary'}`}>{mb.percentage}%</span>
                          </div>
                          <Progress value={mb.percentage} className={`h-2 ${mb.percentage >= 100 ? '[&>div]:bg-emerald-500 bg-emerald-100' : 'bg-slate-200'}`} />
                        </div>
                     ))
                  ) : (
                     <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <ListChecks className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm font-medium">Este operario no tiene módulos en curso.</p>
                     </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
          </TabsContent>

          {/* TAB 2: USUARIOS TÁCTICOS */}
          <TabsContent value="users">
            <Card className="max-w-2xl border-primary/10 shadow-lg mt-6">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl font-headline"><PlusCircle className="h-5 w-5 text-primary" /> Crear y Matricular Estudiante</CardTitle>
                <CardDescription>
                  Un proceso oficial que inyectará una cuenta asegurada de Supabase Auth sin afectar tu conexión de entorno administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="c-name" className="text-slate-800 font-bold">Nombre del Operador (Estudiante)</Label>
                    <Input id="c-name" placeholder="Roberto C. González" value={newUserName} onChange={e=>setNewUserName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-email" className="text-slate-800 font-bold">Correo Acceso Oficial</Label>
                    <Input id="c-email" type="email" placeholder="operador@lafaena.xyz" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-pwd" className="text-slate-800 font-bold">Contraseña Preasignada (Temporal)</Label>
                    <Input id="c-pwd" type="text" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={isCreatingUser} className="w-full sm:w-auto h-12 bg-primary px-8 mt-2 shadow-lg hover:bg-primary/90 font-bold">
                    {isCreatingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando Tokens en Backend...</> : "Dar de Alta Estudiante de Inmediato"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CURRÍCULUMS Y ASIGNACIONES */}
          <TabsContent value="modules" className="pb-8">
            <div className="grid lg:grid-cols-2 gap-8 mt-6">
              
              {/* Form: Nuevo Modulo */}
              <Card className="border-accent/10 shadow-lg h-full">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl font-headline"><Book className="h-5 w-5 text-accent" /> Forjar Nuevo Módulo</CardTitle>
                  <CardDescription>
                    Construir y listar una nueva experiencia empaquetada. Se creará con 1 sección de contenido base.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreateModule} className="space-y-5 flex flex-col h-full">
                    <div className="space-y-2">
                      <Label htmlFor="m-title" className="text-slate-800 font-bold">Concepto Matriz (Título)</Label>
                      <Input id="m-title" placeholder="Ej. Liderazgo en Terreno" value={newModuleTitle} onChange={e=>setNewModuleTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="m-desc" className="text-slate-800 font-bold">Descripción Orientativa</Label>
                      <textarea 
                        id="m-desc"
                        required
                        className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Las habilidades clave para jefaturas en faena frente al control de riesgo biológico..."
                        value={newModuleDesc}
                        onChange={e=>setNewModuleDesc(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={isCreatingModule} className="w-full h-12 bg-slate-900 px-8 text-white mt-4 hover:shadow-lg shadow-black/20 font-bold">
                      {isCreatingModule ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Ensamblando Base de Datos...</> : "Ensamblar Módulo Cero"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Form: Asignar Modulo */}
              <Card className="border-indigo-100 shadow-lg h-full border-t-[5px] border-t-indigo-500">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl font-headline"><LinkIcon className="h-5 w-5 text-indigo-500" /> Matricular Alumno a Módulo</CardTitle>
                  <CardDescription>
                    Otorga acceso visual al curso para que el estudiante pueda interactuar con el módulo y someterse a evaluación.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAssignModule} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="a-user" className="text-slate-800 font-bold">Seleccionar Estudiante Objetivo</Label>
                      <select 
                        id="a-user" 
                        required 
                        className="w-full h-11 px-3 border border-slate-300 rounded-md bg-white text-sm"
                        value={assignUserId}
                        onChange={e=>setAssignUserId(e.target.value)}
                      >
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="a-mod" className="text-slate-800 font-bold">Seleccionar Curriculum Módulo</Label>
                      <select 
                        id="a-mod" 
                        required 
                        className="w-full h-11 px-3 border border-slate-300 rounded-md bg-white text-sm"
                        value={assignModuleId}
                        onChange={e=>setAssignModuleId(e.target.value)}
                      >
                        {dbModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                       <Button type="submit" disabled={isAssigning || dbModules.length === 0} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/30 font-bold font-headline tracking-wide">
                        {isAssigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Empalmando en Tiempo Real...</> : "Dictar Mandato de Asignación Exclusiva"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

            </div>

            {/* ---> Form: Constructor de Contenido Teórico <--- */}
            <Card className="mt-8 border-sky-100 shadow-lg border-t-[5px] border-t-sky-500 overflow-hidden">
               <CardHeader className="bg-slate-50 border-b">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <Edit3 className="h-5 w-5 text-sky-600" /> Constructor de Contenido Teórico
                    </CardTitle>
                    <CardDescription>Modifica los textos, imágenes e incrusta videos en las "Diapositivas" de los módulos en tiempo real.</CardDescription>
                  </div>
                  <div className="min-w-64">
                    <select 
                      className="w-full h-11 px-3 border border-sky-200 shadow-sm rounded-md bg-sky-50/50 text-sm font-bold text-sky-900 focus:ring-sky-500 focus:border-sky-500"
                      value={editContentModuleId}
                      onChange={e => setEditContentModuleId(e.target.value)}
                    >
                      {dbModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      {dbModules.length === 0 && <option value="">Sin módulos en la base de datos...</option>}
                    </select>
                  </div>
                 </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Lateral Sidebar con lista de diapositivas */}
                    <div className="md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col min-h-[400px]">
                      <h4 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wider">Lecciones / Slides</h4>
                      
                      {isLoadingContent ? (
                        <div className="py-8 flex justify-center text-slate-400">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : contentSections.length === 0 ? (
                        <p className="text-sm text-slate-500 italic p-3 text-center bg-white rounded-md border border-dashed">El módulo no tiene contenido.</p>
                      ) : (
                        <nav className="space-y-2 flex-1 overflow-y-auto">
                           {contentSections.map((sec, idx) => (
                              <button 
                                key={sec.id}
                                onClick={() => fillContentForm(sec)}
                                className={`w-full text-left px-3 py-3 rounded-md text-sm transition-all border shadow-sm ${selectedSectionId === sec.id ? 'bg-sky-100 font-bold border-sky-300 text-sky-900 border-l-4 border-l-sky-600' : 'bg-white opacity-80 hover:opacity-100 border-slate-200 text-slate-600'}`}
                              >
                                <span className="block text-xs text-slate-400 mb-1">Sección {idx + 1}</span>
                                <span className="line-clamp-2">{sec.title}</span>
                              </button>
                           ))}
                        </nav>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <Button 
                          onClick={handleAddNewContentSection} 
                          disabled={isSavingContent || !editContentModuleId} 
                          variant="outline" 
                          className="w-full bg-white border-dashed border-2 border-sky-300 text-sky-700 hover:bg-sky-50 font-bold"
                        >
                          + Inyectar Nueva Lección
                        </Button>
                      </div>
                    </div>

                    {/* Area Principal Edit */}
                    <div className="flex-1 p-6 md:p-8 bg-white relative">
                      {selectedSectionId ? (
                        <form onSubmit={handleSaveContentSection} className="space-y-6 max-w-2xl mx-auto">
                          
                          <div className="space-y-2">
                             <Label className="text-slate-800 font-black text-lg">Título de la Diapositiva</Label>
                             <Input 
                               className="h-14 bg-sky-50 border-sky-100 text-lg font-headline font-bold" 
                               value={editSecTitle} 
                               onChange={e=>setEditSecTitle(e.target.value)} 
                               required 
                             />
                          </div>

                          <div className="space-y-2">
                             <Label className="text-slate-800 font-bold">Contenido Teórico / Explicación Escrita</Label>
                             <textarea 
                                required
                                className="flex min-h-[220px] w-full rounded-md border border-slate-200 shadow-inner bg-slate-50 px-4 py-3 text-base leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                                value={editSecContent}
                                onChange={e=>setEditSecContent(e.target.value)}
                             />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <Label className="text-slate-700 font-bold flex items-center gap-1.5"><Video className="w-4 h-4 text-rose-500"/> URL Video YouTube (Opcional)</Label>
                               <Input 
                                 className="h-10 text-xs bg-white" 
                                 placeholder="https://www.youtube.com/watch?v=..." 
                                 value={editSecVideo} 
                                 onChange={e=>setEditSecVideo(e.target.value)} 
                               />
                               <p className="text-[10px] text-slate-500">Pega tu link nativo de YouTube aquí sin problemas.</p>
                            </div>
                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <Label className="text-slate-700 font-bold flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-indigo-500"/> URL Imagen Contextual (Opcional)</Label>
                               <Input 
                                 className="h-10 text-xs bg-white" 
                                 type="url"
                                 placeholder="https://images.unsplash.com/photo-..." 
                                 value={editSecImage} 
                                 onChange={e=>setEditSecImage(e.target.value)} 
                               />
                               <p className="text-[10px] text-slate-500">Apunta a imagen web (.jpg, .png)</p>
                            </div>
                          </div>

                          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-end">
                            <Button type="submit" disabled={isSavingContent} className="h-12 px-8 bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-200">
                               {isSavingContent ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Empujando Nieve DB...</> : <><Save className="mr-2 h-4 w-4" /> Guardar y Reemplazar Nube</>}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center min-h-[400px] text-center opacity-50">
                          <Edit3 className="h-16 w-16 text-slate-300 mb-4" />
                          <h3 className="text-xl font-bold text-slate-600">Ninguna Lección Activa</h3>
                          <p className="text-slate-500 max-w-xs mt-2">Selecciona un panel a la izquierda o crea una lección para comenzar la edición arquitectónica.</p>
                        </div>
                      )}
                    </div>
                  </div>
               </CardContent>
            </Card>


             {/* ---> Form: Editor de Quiz Avanzado <--- */}
             <Card className="mt-8 border-rose-100 shadow-lg border-t-[5px] border-t-rose-500">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <span className="text-xl">📝</span> Central de Evaluaciones (Quizzes)
                </CardTitle>
                <CardDescription>Edita los cuestionarios finales inyectando preguntas exclusivas que medirán la pericia del alumno al final del módulo seleccionado.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="q-mod" className="text-slate-800 font-bold">Seleccionar Módulo a Editar</Label>
                    <select 
                      id="q-mod" 
                      className="w-full h-11 px-3 border border-slate-300 rounded-md bg-rose-50/50 text-sm font-medium"
                      value={quizModuleId}
                      onChange={e => setQuizModuleId(e.target.value)}
                    >
                      {dbModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      {dbModules.length === 0 && <option value="">Sin módulos en la base de datos...</option>}
                    </select>
                  </div>

                  {isLoadingQuiz ? (
                    <div className="py-12 flex justify-center text-slate-400">
                       <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : !quizSectionId ? (
                    <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                      <p className="text-slate-600 mb-6 max-w-md font-medium">Este módulo actualmente no tiene ninguna Evaluación Final insertada en su malla curricular. Debes generar el contenedor físico en Supabase antes de inyectar preguntas.</p>
                      <Button onClick={handleCreateQuizSection} disabled={isCreatingQuizSection || !quizModuleId} className="bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 text-white font-bold h-12 px-6">
                        {isCreatingQuizSection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando Segmento Base...</> : "Activar Motor de Examen para el Módulo"}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                       <div className="mb-8 space-y-3">
                         <h4 className="font-bold text-slate-800 text-lg">Banco de Preguntas Vigentes ({quizQuestions.length})</h4>
                         {quizQuestions.length === 0 ? (
                           <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg">El banco de datos del examen se encuentra vacío.</p>
                         ) : (
                           <ul className="space-y-4">
                             {quizQuestions.map((q, i) => (
                               <li key={q.id} className="p-4 bg-white shadow-sm rounded-xl border border-slate-200 group transition-all hover:border-rose-200 hover:shadow-md">
                                  <p className="font-bold text-slate-800 text-base mb-3"><span className="text-rose-500 mr-1">Q{i + 1}:</span> {q.question}</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {q.options.map((opt: string, optIdx: number) => (
                                      <span key={optIdx} className={`px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-all ${q.correct_answer === optIdx ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        {optIdx + 1}. {opt}
                                      </span>
                                    ))}
                                  </div>
                               </li>
                             ))}
                           </ul>
                         )}
                       </div>

                       {/* Formulario inyector */}
                       <form onSubmit={handleAddQuestion} className="bg-rose-50/70 p-6 rounded-2xl border border-rose-200 space-y-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-bl-full -z-10" />
                          <h4 className="font-black text-rose-900 font-headline text-lg">Inyectar Nuevo Paradigma de Pregunta</h4>
                          <div className="space-y-2">
                             <Label className="text-slate-800 font-bold">Enunciado / Condición</Label>
                             <Input className="h-11 bg-white" placeholder="Ej. ¿Qué color tiene el casco de seguridad estándar frente a impacto eléctrico?" value={newQuizQuestion} onChange={e=>setNewQuizQuestion(e.target.value)} required />
                          </div>
                          <div className="grid sm:grid-cols-4 gap-6">
                            <div className="sm:col-span-3 space-y-2">
                               <Label className="text-slate-800 font-bold">Posibles Respuestas (Separar estrictamente por comas ",")</Label>
                               <Input className="h-11 bg-white border-rose-200" placeholder="Rojo ignífugo, Azul marino, Amarillo reflectante, Blanco reforzado" value={newQuizOptions} onChange={e=>setNewQuizOptions(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                               <Label className="text-slate-800 font-bold">El Nº Correcto Es</Label>
                               <Input className="h-11 bg-white border-emerald-200 font-bold text-center text-lg" type="number" min={1} placeholder="1" value={newQuizAnswerIdx} onChange={e=>setNewQuizAnswerIdx(parseInt(e.target.value))} required />
                            </div>
                          </div>
                          <Button type="submit" disabled={isCreatingQuizQuestion} className="w-full h-14 bg-slate-900 mt-4 text-white font-bold hover:shadow-xl transition-all font-headline text-lg shadow-black/20">
                             {isCreatingQuizQuestion ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Transmitiendo Nodo Server-Side...</> : "Ensamblar e Inyectar Pregunta Oficial"}
                          </Button>
                       </form>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
