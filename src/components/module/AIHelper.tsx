"use client"

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles, Loader2, BookOpen } from "lucide-react";
import { summarizeModuleSection } from '@/ai/flows/ai-module-summary';
import { explainConceptAdaptively } from '@/ai/flows/ai-adaptive-explanation';
import { Badge } from "@/components/ui/badge";

interface AIHelperProps {
  sectionContent: string;
  sectionTitle: string;
}

export function AIHelper({ sectionContent, sectionTitle }: AIHelperProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<{
    text: string;
    analogy?: string;
    level?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client-side cache to instantly reuse generated content without re-querying
  const localCache = useRef<{ summary?: string; explanation?: { text: string; analogy?: string; level?: string } }>({});

  const handleSummarize = async () => {
    if (localCache.current.summary) {
      setSummary(localCache.current.summary);
      setExplanation(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await summarizeModuleSection({ sectionContent });
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
    if (localCache.current.explanation) {
      setExplanation(localCache.current.explanation);
      setSummary(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await explainConceptAdaptively({ 
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
      {/* Mobile side-by-side layout (grid grid-cols-2) with generous 48px touch height & Duolingo 3D tactile buttons */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3 w-full">
        <Button 
          type="button"
          variant="default" 
          onClick={handleSummarize} 
          disabled={loading}
          className="w-full h-12 sm:h-11 bg-brand-blue hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md border-b-4 border-[#153bb3] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3"
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Sparkles className="h-4 w-4 shrink-0 text-white animate-bounce-subtle" />}
          <span className="truncate leading-tight">Resumen Rápido</span>
        </Button>
        <Button 
          type="button"
          variant="default" 
          onClick={handleSimplify} 
          disabled={loading}
          className="w-full h-12 sm:h-11 bg-brand-lightblue hover:bg-[#0369a1] active:bg-[#075985] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md border-b-4 border-[#075985] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3"
        >
          {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Brain className="h-4 w-4 shrink-0 text-white animate-pulse" />}
          <span className="truncate leading-tight">Explicar Sencillo</span>
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

      {(summary || explanation) && (
        <Card className="border-none shadow-md bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                {summary ? <BookOpen className="h-4 w-4 text-accent" /> : <Brain className="h-4 w-4 text-primary" />}
                {summary ? 'Punto Clave' : 'Explicación Adaptativa'}
              </CardTitle>
              {explanation?.level && (
                <Badge variant="secondary" className="capitalize text-[10px] py-0">{explanation.level}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground/80 italic">
              "{summary || explanation?.text}"
            </p>
            {explanation?.analogy && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[11px] font-bold uppercase text-primary mb-1">Analogía Utilizada</p>
                <p className="text-xs text-primary/80 font-medium">{explanation.analogy}</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto text-[10px] text-muted-foreground hover:bg-transparent"
              onClick={() => { setSummary(null); setExplanation(null); }}
            >
              Borrar información de IA
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
