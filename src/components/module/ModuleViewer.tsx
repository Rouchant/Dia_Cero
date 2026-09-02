"use client"

import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Quiz } from './Quiz';
import { AIHelper } from './AIHelper';
import { FeedbackSurvey } from './FeedbackSurvey';
import { ChevronRight, ChevronLeft, CheckCircle2, Circle, Menu, X, ShieldCheck } from "lucide-react";
import Image from 'next/image';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from '@/utils/supabase/client';
import { Logo } from "@/components/ui/logo";
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import Link from 'next/link';

export function ModuleViewer({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [moduleData, setModuleData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const supabase = createClient();
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
      // Fetch authenticated user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      
      if (currentUserId) {
        setUserId(currentUserId);
        setUserEmail(authData.user?.email || null);
        
        // Fetch existing progress
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('module_id', moduleId)
          .maybeSingle();
          
        if (progress) {
          setCompletedSections(progress.completed_sections || []);
          setQuizScores(progress.quiz_scores || {});
          setCurrentSectionIndex(progress.current_section_index || 0);
        }
      }

      // Fetch module data
      const { data: modData } = await supabase
        .from('modules')
        .select(`
          *,
          module_sections(
            *,
            quiz_questions(*)
          )
        `)
        .eq('id', moduleId)
        .single();
        
      if (modData) {
        modData.module_sections.sort((a: any, b: any) => a.sort_order - b.sort_order);
        setModuleData(modData);
      }
      
      setDataLoaded(true);
    }
    
    loadData();
  }, []);

  useEffect(() => {
    if (mounted && moduleData && dataLoaded && userId) {
      // Save progress to database
      async function saveProgress() {
        await supabase.from('user_progress').upsert({
          user_id: userId,
          module_id: moduleId,
          completed_sections: completedSections,
          quiz_scores: quizScores,
          current_section_index: currentSectionIndex,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, module_id' });
      }
      saveProgress();
    }
  }, [completedSections, quizScores, currentSectionIndex, mounted, moduleData, dataLoaded, userId]);

  // Anti-cheat controls (Chrome Windows optimized: instant synchronous DOM blur, clipboard wipe, multi-event monitoring)
  useEffect(() => {
    if (!mounted) return;

    // Synchronous instant DOM blur on content container (0ms delay before React re-render)
    const triggerInstantBlur = () => {
      setIsWindowBlurred(true);
      const contentEl = document.getElementById('module-protected-content');
      if (contentEl) {
        contentEl.classList.add('anti-cheat-content-blurred');
      }
    };

    const triggerInstantFocus = () => {
      setIsWindowBlurred(false);
      const contentEl = document.getElementById('module-protected-content');
      if (contentEl) {
        contentEl.classList.remove('anti-cheat-content-blurred');
      }
    };

    // Active clipboard wipe to overwrite OS screenshot buffer
    const wipeClipboard = () => {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText('Contenido protegido por DiaCero.').catch(() => {
            // Silently ignore clipboard write permission denied errors
          });
        }
      } catch (err) {}
    };

    // 1. Prevent copy, cut, paste
    const handleCopyCutPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', 'Contenido protegido por DiaCero.');
      }
    };

    // 2. Prevent drag of images
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // 3. Prevent context menu (right click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 4. Prevent screenshot keys and DevTools shortcuts (keydown & keyup)
    const handleKeySecurity = (e: KeyboardEvent) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const code = e.code ? e.code.toLowerCase() : '';

      // PrintScreen key (Windows PrtScn)
      if (e.key === 'PrintScreen' || code === 'printscreen') {
        triggerInstantBlur();
        wipeClipboard();
        setTimeout(wipeClipboard, 50);
        setTimeout(wipeClipboard, 250);
        setTimeout(wipeClipboard, 500);
        e.preventDefault();
      }

      // Windows Snipping Tool (Win + Shift + S) or Cmd + Shift + 4 / 3
      if ((e.metaKey || e.key === 'Meta') && (e.shiftKey || key === 'shift') && (key === 's' || code === 'keys')) {
        triggerInstantBlur();
        wipeClipboard();
        e.preventDefault();
      }

      // Print shortcut (Ctrl + P / Cmd + P)
      if ((e.ctrlKey || e.metaKey) && key === 'p') {
        e.preventDefault();
        triggerInstantBlur();
        alert('La impresión de este material de estudio está desactivada.');
      }

      // DevTools & Source Code shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, Ctrl+C)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && (key === 'u' || key === 's' || key === 'c')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))
      ) {
        e.preventDefault();
      }
    };

    // 5. Multi-event window loss detection (blur, visibilitychange)
    const handleWindowBlur = () => {
      // Ignore if document still has focus or if user interacted with an internal iframe (e.g. YouTube player)
      if (document.hasFocus() || (document.activeElement && document.activeElement.tagName === 'IFRAME')) {
        return;
      }
      triggerInstantBlur();
    };

    const handleWindowFocus = () => {
      triggerInstantFocus();
    };

    let focusRestoreTimeout: any = null;

    const triggerDelayedFocus = () => {
      if (focusRestoreTimeout) clearTimeout(focusRestoreTimeout);
      focusRestoreTimeout = setTimeout(() => {
        if (document.hasFocus() && document.visibilityState === 'visible') {
          triggerInstantFocus();
        }
      }, 300);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (focusRestoreTimeout) clearTimeout(focusRestoreTimeout);
        triggerInstantBlur();
      } else {
        triggerDelayedFocus();
      }
    };

    const handleUserInteractionRestores = () => {
      if (document.hasFocus() && document.visibilityState === 'visible') {
        triggerDelayedFocus();
      }
    };

    // Mobile-specific event listeners (iOS & Android)
    const handleTouchCancel = () => {
      triggerInstantBlur();
    };

    const handleMultiTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 2) {
        triggerInstantBlur();
      }
    };

    const handlePageHide = () => {
      triggerInstantBlur();
    };

    // Attach listeners on both keydown and keyup for maximum Windows event coverage
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeySecurity, true);
    document.addEventListener('keyup', handleKeySecurity, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('click', handleUserInteractionRestores);
    window.addEventListener('pointerdown', handleUserInteractionRestores);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    window.addEventListener('touchstart', handleMultiTouchStart, { passive: true });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // Clean up listeners
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeySecurity, true);
      document.removeEventListener('keyup', handleKeySecurity, true);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('click', handleUserInteractionRestores);
      window.removeEventListener('pointerdown', handleUserInteractionRestores);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('touchstart', handleMultiTouchStart);
      window.removeEventListener('pagehide', handlePageHide);
      const contentEl = document.getElementById('module-protected-content');
      if (contentEl) {
        contentEl.classList.remove('anti-cheat-content-blurred');
      }
    };
  }, [mounted]);

  if (!mounted || !moduleData) return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center">
        <Logo className="opacity-50 mb-4" />
        <p className="text-muted-foreground font-medium">Cargando módulo...</p>
      </div>
    </div>
  );

  const currentSection = moduleData.module_sections[currentSectionIndex];
  const progress = Math.round(((currentSectionIndex) / (moduleData.module_sections.length - 1)) * 100);

  const handleNext = () => {
    if (!completedSections.includes(currentSection.id)) {
      setCompletedSections([...completedSections, currentSection.id]);
    }
    if (currentSectionIndex < moduleData.module_sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/certificate/' + moduleId);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuizComplete = (score: number) => {
    setQuizScores({ ...quizScores, [currentSection.id]: score });
    handleNext();
  };

  const handleFeedbackComplete = (data: any) => {
    console.log('Feedback submitted:', data);
    setCompletedSections([...completedSections, currentSection.id]);
    // Potentially redirect to a "Course Completed" page
  };

  // Helper function to convert raw YouTube links into Embed iframes dynamically
  const parseVideoUrl = (url: string) => {
    if (!url) return '';
    try {
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
    } catch(e) {}
    return url;
  };

  // Map database fields to components expected fields format
  const mappedQuestions = currentSection.quiz_questions?.map((q: any) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswer: q.correct_answer
  }));

  const watermarkText = (userEmail || userId || 'DIACERO PROTECTED CONTENT').toUpperCase();

  return (
    <div id="module-protected-area" className="flex h-dvh bg-background overflow-hidden select-none protect-print protect-mobile-touch relative">
      {/* Dynamic Anti-Cheat Security Watermark Layer (Prevents anonymous screenshot leaks on iPhone & Web) */}
      <div 
        className="pointer-events-none fixed inset-0 z-[35] select-none opacity-[0.12] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-screen overflow-hidden"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='160' viewBox='0 0 320 160'><text x='50%' y='50%' fill='%231D4ED8' font-size='11' font-family='sans-serif' font-weight='900' text-anchor='middle' transform='rotate(-22 160 80)'>${encodeURIComponent(watermarkText + ' • DÍA CERO')}</text></svg>")`,
          backgroundRepeat: 'repeat'
        }}
      />

      {isWindowBlurred && (
        <div 
          onClick={() => {
            const contentEl = document.getElementById('module-protected-content');
            if (contentEl) contentEl.classList.remove('anti-cheat-content-blurred');
            setIsWindowBlurred(false);
          }}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[99999] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 cursor-pointer select-none"
        >
          <div className="p-4 bg-brand-blue/20 rounded-full mb-4 border border-brand-blue/30 text-white shadow-2xl animate-bounce-subtle">
            <ShieldCheck className="h-12 w-12 text-brand-lightblue" />
          </div>
          <h2 className="text-2xl font-black font-headline mb-2 text-white tracking-tight">Contenido Protegido por DiaCero</h2>
          <p className="text-slate-300 max-w-md text-sm mb-6 font-medium leading-relaxed">
            Se ha pausado la lectura porque la ventana perdió el foco o se intentó una captura de pantalla. Haz clic en cualquier lugar o presiona el botón para continuar.
          </p>
          <Button 
            onClick={(e) => { 
              e.stopPropagation(); 
              const contentEl = document.getElementById('module-protected-content');
              if (contentEl) contentEl.classList.remove('anti-cheat-content-blurred');
              setIsWindowBlurred(false); 
            }}
            className="bg-brand-green hover:bg-[#007048] text-white font-black text-sm px-8 h-12 rounded-xl shadow-xl shadow-brand-green/30 tracking-wide uppercase active:scale-95 transition-all"
          >
            Continuar Estudiando
          </Button>
        </div>
      )}

      {/* Container for Protected Module Content */}
      <div id="module-protected-content" className="flex h-full w-full overflow-hidden transition-all protect-mobile-touch">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[85vw] sm:w-[400px] lg:w-[450px] shrink-0 bg-white border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-headline font-bold text-primary">Secciones del Módulo</h2>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <nav className="space-y-1">
              {moduleData.module_sections.map((section: any, idx: number) => {
                const isCompleted = completedSections.includes(section.id);
                const isActive = currentSectionIndex === idx;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCurrentSectionIndex(idx);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-xl text-left text-sm transition-all group",
                      isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-primary/5 text-foreground/70"
                    )}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-brand-green")} />
                      ) : (
                        <Circle className={cn("h-4 w-4 opacity-30", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                      )}
                    </div>
                    <span className="flex-1 font-medium leading-relaxed">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="pt-6 border-t mt-6">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              <span>Progreso General</span>
              <span>{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 transition-all duration-1000 ${progress >= 100 ? '[&>div]:bg-brand-green' : 'bg-primary/10'}`} 
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm sm:text-lg font-headline font-bold text-foreground truncate flex-1 min-w-0">
              {currentSection.title}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
               {moduleData.title}
             </span>
          </div>
        </header>

        {/* Section Content */}
        <ScrollArea className="flex-1 bg-background/50 h-full max-h-[calc(100dvh-4rem)] relative flex flex-col [&>div>div]:!block overflow-hidden">
          <div key={currentSection.id} className="max-w-6xl mx-auto px-4 md:px-12 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] min-h-[calc(100dvh-4rem)] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {currentSection.type === 'content' && (
              <div className="flex flex-col flex-1 h-full">
                <div className="flex-1 flex flex-col gap-6 md:gap-8 items-center justify-start min-h-0 h-full overflow-y-auto py-4 px-2">
                  
                  {/* Top: Media */}
                  <div className="w-full max-w-md md:max-w-lg lg:max-w-xl flex flex-col justify-center items-center shrink-0 mx-auto">
                    {currentSection.image_url && (
                      <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5">
                        <Image 
                          src={currentSection.image_url} 
                          alt={currentSection.title}
                          fill
                          className="object-cover"
                          priority
                          data-ai-hint={currentSection.image_hint}
                        />
                      </div>
                    )}
                    
                    {currentSection.video_url && (
                      <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl bg-black">
                        <iframe 
                          src={parseVideoUrl(currentSection.video_url)} 
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>

                  {/* Bottom: Text & AI */}
                  <div className="w-full max-w-3xl space-y-6 flex flex-col pb-6 mx-auto">
                    <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed font-body">
                      <p className="whitespace-pre-wrap text-base md:text-lg">
                        {currentSection.content}
                      </p>
                    </div>

                    {/* Celebration Card for Final Section */}
                    {currentSectionIndex === moduleData.module_sections.length - 1 && progress >= 100 && (
                      <Card className="bg-gradient-success border-none text-white p-6 shadow-xl animate-bounce-subtle rounded-3xl overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                        <div className="relative z-10 flex flex-col items-center text-center gap-3">
                          <Trophy className="h-12 w-12 text-brand-yellow drop-shadow-md" />
                          <div>
                            <h3 className="text-xl font-black font-headline tracking-tight">¡Módulo Completado!</h3>
                            <p className="text-sm font-medium opacity-90">Has dominado satisfactoriamente todo el contenido de este currículum.</p>
                          </div>
                          <Link href="/dashboard" className="mt-2 w-full">
                            <Button variant="secondary" className="w-full font-bold h-11 bg-white text-[#008f5d] hover:bg-white/90 border-none shadow-lg active:scale-95">
                              Volver al Dashboard
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    )}

                    <div className="pt-4 border-t border-border/50 shrink-0">
                      <AIHelper 
                        sectionContent={currentSection.content || ""} 
                        sectionTitle={currentSection.title} 
                      />
                    </div>
                  </div>

                </div>

                {/* Navigation Buttons Pinned to Bottom */}
                <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/50 shrink-0 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePrev} 
                    disabled={currentSectionIndex === 0}
                    className="h-12 w-12 xs:w-auto xs:px-6 rounded-full xs:rounded-xl border-border/50"
                  >
                    <ChevronLeft className="h-5 w-5 xs:mr-2" />
                    <span className="hidden xs:inline">Anterior</span>
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    className="h-12 px-6 xs:px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full xs:rounded-xl flex-1 xs:flex-initial"
                  >
                    <span className="truncate mr-1 xs:mr-2">
                      {currentSectionIndex < moduleData.module_sections.length - 1 ? 'Siguiente' : 'Finalizar'}
                      <span className="hidden sm:inline">{currentSectionIndex < moduleData.module_sections.length - 1 ? ' Sección' : ' Módulo'}</span>
                    </span>
                    {currentSectionIndex < moduleData.module_sections.length - 1 && <ChevronRight className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            )}

            {currentSection.type === 'quiz' && (
              <div className="flex-1 flex flex-col items-center justify-center py-8 h-full">
                <Quiz questions={mappedQuestions || []} onComplete={handleQuizComplete} />
              </div>
            )}

            {currentSection.type === 'feedback' && (
              <div className="flex-1 flex flex-col items-center justify-center py-8 h-full">
                <FeedbackSurvey onComplete={handleFeedbackComplete} />
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
      </div>
    </div>
  );
}
