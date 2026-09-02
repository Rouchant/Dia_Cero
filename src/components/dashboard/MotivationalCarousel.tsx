"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ShieldCheck, Sparkles, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPS = [
  {
    id: 'tip-1',
    title: 'Ritmo de Aprendizaje',
    text: 'Mantén una racha constante para absorber las normativas más eficientemente.',
    icon: Clock,
    iconColor: 'text-brand-yellow',
    bgGradient: 'from-brand-lightblue/20 to-brand-yellow/20',
  },
  {
    id: 'tip-2',
    title: 'Cero Accidentes',
    text: 'Cada módulo completado es una herramienta real para proteger tu vida y la de tus compañeros.',
    icon: ShieldCheck,
    iconColor: 'text-brand-green',
    bgGradient: 'from-brand-green/20 to-brand-lightblue/20',
  },
  {
    id: 'tip-3',
    title: 'Excelencia en Terreno',
    text: 'La preparación preventiva transforma la seguridad en una ventaja profesional imparable.',
    icon: Sparkles,
    iconColor: 'text-brand-blue',
    bgGradient: 'from-brand-blue/15 to-brand-pink/15',
  },
  {
    id: 'tip-4',
    title: 'Tu Compromiso Cuenta',
    text: 'El autocuidado no es solo una norma, es el hábito que asegura que todos vuelvan sanos a casa.',
    icon: Award,
    iconColor: 'text-brand-pink',
    bgGradient: 'from-brand-pink/20 to-brand-yellow/20',
  },
];

export function MotivationalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TIPS.length);
    }, 15000); // 15 seconds rotation

    return () => clearInterval(timer);
  }, [isPaused]);

  const currentTip = TIPS[currentIndex];
  const IconComponent = currentTip.icon;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % TIPS.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);
  };

  return (
    <Card 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        "group relative transition-all duration-700 border-brand-blue/10 shadow-md rounded-3xl overflow-hidden bg-gradient-to-br",
        currentTip.bgGradient
      )}
    >
      <CardContent className="p-6 flex flex-col items-center text-center relative min-h-[230px] justify-between">
        
        {/* Navigation Controls (Visible on hover/focus) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Consejo anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-brand-blue/80 hover:text-brand-blue shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Siguiente consejo"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-brand-blue/80 hover:text-brand-blue shadow-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 z-20"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Slide Content */}
        <div key={currentTip.id} className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full pt-1">
          <div className="h-14 w-14 bg-white rounded-full shadow-md flex items-center justify-center mb-3 border border-brand-blue/5 shrink-0">
            <IconComponent className={cn("h-7 w-7", currentTip.iconColor)} />
          </div>
          <h4 className="font-headline font-black text-brand-blue mb-1.5 text-lg">
            {currentTip.title}
          </h4>
          <p className="text-xs sm:text-sm text-brand-blue/85 font-medium leading-relaxed max-w-xs px-2">
            {currentTip.text}
          </p>
        </div>

        {/* Carousel Indicators (Dots) */}
        <div className="flex items-center gap-1.5 mt-4 pt-1 z-10">
          {TIPS.map((tip, idx) => (
            <button
              key={tip.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Ir al consejo ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer",
                idx === currentIndex ? "w-6 bg-brand-blue" : "w-2 bg-brand-blue/20 hover:bg-brand-blue/40"
              )}
            />
          ))}
        </div>

      </CardContent>
    </Card>
  );
}
