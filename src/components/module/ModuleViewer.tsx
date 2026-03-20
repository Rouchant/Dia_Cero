"use client"

import React, { useState, useEffect } from 'react';
import { DIA_CERO_MODULE, ModuleSection } from '@/lib/module-data';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Quiz } from './Quiz';
import { AIHelper } from './AIHelper';
import { FeedbackSurvey } from './FeedbackSurvey';
import { ChevronRight, ChevronLeft, CheckCircle2, Circle, Menu, X } from "lucide-react";
import Image from 'next/image';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ModuleViewer() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dia_cero_progress');
    if (saved) {
      const { completed, scores, index } = JSON.parse(saved);
      setCompletedSections(completed || []);
      setQuizScores(scores || {});
      setCurrentSectionIndex(index || 0);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dia_cero_progress', JSON.stringify({
        completed: completedSections,
        scores: quizScores,
        index: currentSectionIndex
      }));
    }
  }, [completedSections, quizScores, currentSectionIndex, mounted]);

  const currentSection = DIA_CERO_MODULE.sections[currentSectionIndex];
  const progress = Math.round(((currentSectionIndex) / (DIA_CERO_MODULE.sections.length - 1)) * 100);

  const handleNext = () => {
    if (!completedSections.includes(currentSection.id)) {
      setCompletedSections([...completedSections, currentSection.id]);
    }
    if (currentSectionIndex < DIA_CERO_MODULE.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-headline font-bold text-primary">Module Sections</h2>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <nav className="space-y-1">
              {DIA_CERO_MODULE.sections.map((section, idx) => {
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
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-all group",
                      isActive ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-primary/5 text-foreground/70"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-emerald-500")} />
                    ) : (
                      <Circle className={cn("h-4 w-4 opacity-30", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    )}
                    <span className="flex-1 font-medium truncate">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="pt-6 border-t mt-6">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-primary/10" />
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
            <h1 className="text-lg font-headline font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
              {currentSection.title}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-4">
             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
               {DIA_CERO_MODULE.title}
             </span>
          </div>
        </header>

        {/* Section Content */}
        <ScrollArea className="flex-1 bg-background/50">
          <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            {currentSection.type === 'content' && (
              <div className="space-y-8">
                {currentSection.imageUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                    <Image 
                      src={currentSection.imageUrl} 
                      alt={currentSection.title}
                      fill
                      className="object-cover"
                      priority
                      data-ai-hint={currentSection.imageHint}
                    />
                  </div>
                )}
                
                {currentSection.videoUrl && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                    <iframe 
                      src={currentSection.videoUrl} 
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed font-body">
                  <p className="whitespace-pre-wrap text-lg md:text-xl">
                    {currentSection.content}
                  </p>
                </div>

                <div className="pt-8 border-t">
                  <AIHelper 
                    sectionContent={currentSection.content || ""} 
                    sectionTitle={currentSection.title} 
                  />
                </div>
              </div>
            )}

            {currentSection.type === 'quiz' && (
              <Quiz questions={currentSection.questions || []} onComplete={handleQuizComplete} />
            )}

            {currentSection.type === 'feedback' && (
              <FeedbackSurvey onComplete={handleFeedbackComplete} />
            )}

            {/* Navigation Buttons */}
            {currentSection.type === 'content' && (
              <div className="flex items-center justify-between pt-12">
                <Button 
                  variant="outline" 
                  onClick={handlePrev} 
                  disabled={currentSectionIndex === 0}
                  className="h-12 px-6"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  Next Section
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
