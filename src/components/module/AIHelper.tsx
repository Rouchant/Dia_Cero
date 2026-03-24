"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Sparkles, Loader2, ChevronRight, BookOpen } from "lucide-react";
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

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const result = await summarizeModuleSection({ sectionContent });
      setSummary(result.summary);
      setExplanation(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimplify = async () => {
    setLoading(true);
    try {
      const result = await explainConceptAdaptively({ 
        concept: sectionTitle,
        context: sectionContent.substring(0, 300) 
      });
      setExplanation({
        text: result.explanation,
        analogy: result.analogyUsed,
        level: result.simplicityLevel
      });
      setSummary(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSummarize} 
          disabled={loading}
          className="border-accent/30 text-accent hover:bg-accent/5 flex-1 sm:flex-initial"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Resumen Rápido
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSimplify} 
          disabled={loading}
          className="border-primary/30 text-primary hover:bg-primary/5 flex-1 sm:flex-initial"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          Explicar de Forma Sencilla
        </Button>
      </div>

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
