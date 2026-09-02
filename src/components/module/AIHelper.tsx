"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, Loader2, BookOpen } from "lucide-react";
import { summarizeModuleSection } from '@/ai/flows/ai-module-summary';
import { explainConceptAdaptively } from '@/ai/flows/ai-adaptive-explanation';
import { Badge } from "@/components/ui/badge";

interface AIHelperProps {
  sectionId?: string;
  sectionContent: string;
  sectionTitle: string;
  initialSummary?: string | null;
  initialExplanation?: string | any | null;
}

function parseInitialExplanation(raw: any) {
  if (!raw) return null;
  try {
    const exp = typeof raw === 'string' 
      ? (raw.startsWith('{') ? JSON.parse(raw) : { text: raw }) 
      : raw;
    return {
      text: exp.explanation || exp.text || '',
      analogy: exp.analogyUsed || exp.analogy,
      level: exp.simplicityLevel || exp.level || 'simplificada'
    };
  } catch {
    return null;
  }
}

export function AIHelper({ 
  sectionId, 
  sectionContent, 
  sectionTitle, 
  initialSummary, 
  initialExplanation 
}: AIHelperProps) {
  // Start collapsed by default so answers are not open until the user clicks
  const [summary, setSummary] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<{
    text: string;
    analogy?: string;
    level?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client-side local cache to instantly reuse pre-loaded or generated content
  const localCache = useRef<{ summary?: string; explanation?: { text: string; analogy?: string; level?: string } }>({
    summary: initialSummary || undefined,
    explanation: parseInitialExplanation(initialExplanation) || undefined
  });

  // Reset open states to collapsed when switching sections
  useEffect(() => {
    setSummary(null);
    setExplanation(null);
    localCache.current = { 
      summary: initialSummary || undefined,
      explanation: parseInitialExplanation(initialExplanation) || undefined
    };
    setErrorMsg(null);
  }, [sectionId, initialSummary, initialExplanation]);

  const handleSummarize = async () => {
    // Toggle off if already showing summary
    if (summary) {
      setSummary(null);
      return;
    }

    const cachedSummary = localCache.current.summary || initialSummary;
    if (cachedSummary) {
      setSummary(cachedSummary);
      setExplanation(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await summarizeModuleSection({ sectionId, sectionContent });
      if (result?.summary) {
        localCache.current.summary = result.summary;
        setSummary(result.summary);
        setExplanation(null);
      } else {
        setErrorMsg('No se pudo generar el resumen.');
      }
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      setErrorMsg(`Error de IA: ${error?.message || 'Verifica la conexión.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimplify = async () => {
    // Toggle off if already showing explanation
    if (explanation) {
      setExplanation(null);
      return;
    }

    const cachedExp = localCache.current.explanation || parseInitialExplanation(initialExplanation);
    if (cachedExp) {
      setExplanation(cachedExp);
      setSummary(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await explainConceptAdaptively({ 
        sectionId,
        concept: sectionTitle,
        context: sectionContent.substring(0, 300) 
      });
      if (result?.explanation) {
        const expData = {
          text: result.explanation,
          analogy: result.analogyUsed,
          level: result.simplicityLevel
        };
        localCache.current.explanation = expData;
        setExplanation(expData);
        setSummary(null);
      } else {
        setErrorMsg('No se pudo generar la explicación.');
      }
    } catch (error: any) {
      console.error('Error generating AI explanation:', error);
      setErrorMsg(`Error de IA: ${error?.message || 'Verifica la conexión.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 transition-all duration-500 ${loading ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}>
      {/* Mobile side-by-side layout (grid grid-cols-2) with generous touch height & Duolingo 3D tactile buttons */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3 w-full">
        <Button 
          type="button"
          variant="default" 
          onClick={handleSummarize} 
          disabled={loading}
          className={`w-full h-12 sm:h-11 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 ${
            summary
              ? 'bg-[#153bb3] text-white border-b-0 translate-y-1 ring-2 ring-brand-blue'
              : 'bg-brand-blue hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white border-b-4 border-[#153bb3] active:border-b-0 active:translate-y-1'
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0 text-white animate-bounce-subtle" />}
          <span className="truncate leading-tight">{summary ? 'Ocultar Resumen' : 'Resumen Rápido'}</span>
        </Button>
        <Button 
          type="button"
          variant="default" 
          onClick={handleSimplify} 
          disabled={loading}
          className={`w-full h-12 sm:h-11 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 ${
            explanation
              ? 'bg-[#075985] text-white border-b-0 translate-y-1 ring-2 ring-brand-lightblue'
              : 'bg-brand-lightblue hover:bg-[#0369a1] active:bg-[#075985] text-white border-b-4 border-[#075985] active:border-b-0 active:translate-y-1'
          }`}
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Brain className="h-4 w-4 shrink-0 text-white animate-pulse" />}
          <span className="truncate leading-tight">{explanation ? 'Ocultar Explicación' : 'Explicar Sencillo'}</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-200 rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{errorMsg}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-[10px] text-red-700 hover:bg-red-100 px-2"
            onClick={() => setErrorMsg(null)}
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Summary View Container */}
      {summary && (
        <Card className="border-brand-blue/30 bg-gradient-to-br from-brand-blue/5 to-white shadow-xl animate-in fade-in slide-in-from-top-3 duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="py-3 px-4 bg-brand-blue/10 border-b border-brand-blue/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-headline font-black text-brand-blue flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-blue" />
              Resumen Rápido de la Lección
            </CardTitle>
            <Badge variant="outline" className="bg-white text-[10px] font-bold text-brand-blue border-brand-blue/30">
              Sintetizado con IA
            </Badge>
          </CardHeader>
          <CardContent className="p-4 text-xs sm:text-sm text-foreground/90 leading-relaxed font-body">
            {summary}
          </CardContent>
        </Card>
      )}

      {/* Adaptive Explanation View Container */}
      {explanation && (
        <Card className="border-brand-lightblue/30 bg-gradient-to-br from-brand-lightblue/5 to-white shadow-xl animate-in fade-in slide-in-from-top-3 duration-300 rounded-2xl overflow-hidden">
          <CardHeader className="py-3 px-4 bg-brand-lightblue/10 border-b border-brand-lightblue/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-headline font-black text-brand-lightblue flex items-center gap-2">
              <Brain className="h-4 w-4 text-brand-lightblue" />
              Explicación Adaptativa Sencilla
            </CardTitle>
            <Badge variant="outline" className="bg-white text-[10px] font-bold text-brand-lightblue border-brand-lightblue/30 uppercase">
              {explanation.level || 'Simplificado'}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs sm:text-sm text-foreground/90 font-body">
            <p className="leading-relaxed">{explanation.text}</p>
            {explanation.analogy && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <span className="text-base leading-none">💡</span>
                <div>
                  <span className="font-bold block mb-0.5">Analogía de la Vida Real:</span>
                  <span>{explanation.analogy}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
