"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Award } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <Card className="max-w-2xl mx-auto border-accent/20 bg-white/50 backdrop-blur-sm">
        <CardContent className="pt-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-accent/10 p-4 rounded-full">
              <Award className="h-16 w-16 text-accent animate-bounce" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-primary">¡Evaluación Completada!</h2>
            <p className="text-muted-foreground text-lg">Has terminado el punto de control de esta sección.</p>
          </div>
          <div className="py-8">
            <div className="text-6xl font-black text-accent">{finalScore}%</div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mt-2">Puntaje de Precisión</p>
          </div>
          <Button 
            className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
            onClick={() => onComplete(finalScore)}
          >
            Obtener Certificado de Aprobación
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto border-primary/10 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500" 
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <CardTitle className="text-xl font-headline text-foreground leading-tight">
          {currentQuestion.question}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(v: string) => !showFeedback && setSelectedAnswer(parseInt(v))}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;

            let containerStyles = "flex items-center space-x-3.5 border-2 p-4 rounded-xl transition-colors duration-150 cursor-pointer select-none";

            if (showFeedback) {
              if (idx === currentQuestion.correctAnswer) {
                containerStyles += " border-brand-green bg-brand-green/10 text-slate-900 font-bold";
              } else if (isSelected) {
                containerStyles += " border-red-500 bg-red-50 text-red-900 font-bold";
              } else {
                containerStyles += " border-slate-200 opacity-40 text-slate-500";
              }
            } else if (isSelected) {
              containerStyles += " border-brand-blue bg-brand-blue/10 text-brand-blue font-bold shadow-md shadow-brand-blue/10";
            } else {
              containerStyles += " border-slate-200 hover:border-brand-blue/40 hover:bg-slate-50 text-slate-800 font-medium";
            }

            return (
              <Label
                key={idx}
                onClick={() => !showFeedback && setSelectedAnswer(idx)}
                className={containerStyles}
              >
                <RadioGroupItem value={idx.toString()} disabled={showFeedback} className="sr-only" />

                {/* Visible Custom Radio Indicator */}
                <div className="flex-shrink-0">
                  {showFeedback && idx === currentQuestion.correctAnswer ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-green" />
                  ) : showFeedback && isSelected && idx !== currentQuestion.correctAnswer ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : isSelected ? (
                    <div className="h-5 w-5 rounded-full border-2 border-brand-blue bg-brand-blue flex items-center justify-center shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white" />
                  )}
                </div>

                <span className="flex-1 text-base leading-snug">{option}</span>
              </Label>
            );
          })}
        </RadioGroup>

        {showFeedback ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className={`p-4 rounded-lg flex items-start gap-3 ${selectedAnswer === currentQuestion.correctAnswer ? 'bg-emerald-50 text-emerald-800' : 'bg-destructive/5 text-destructive'}`}>
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-bold">¡Correcto!</p>
                    <p className="text-sm">Gran trabajo entendiendo este concepto.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-bold">No exactamente.</p>
                    <p className="text-sm">La respuesta correcta era: {currentQuestion.options[currentQuestion.correctAnswer]}</p>
                  </div>
                </>
              )}
            </div>
            <Button onClick={handleContinue} className="w-full bg-primary h-12 text-lg">
              {currentQuestionIndex + 1 < questions.length ? 'Siguiente Pregunta' : 'Finalizar Cuestionario'}
            </Button>
          </div>
        ) : (
          <Button 
            disabled={selectedAnswer === null} 
            onClick={handleNext} 
            className="w-full bg-primary h-12 text-lg"
          >
            Enviar Respuesta
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
