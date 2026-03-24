"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquare, Send } from "lucide-react";

interface FeedbackSurveyProps {
  onComplete: (feedback: any) => void;
}

export function FeedbackSurvey({ onComplete }: FeedbackSurveyProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onComplete({ rating, comment });
    }, 2000);
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-100 bg-emerald-50/30 backdrop-blur-sm animate-in zoom-in-95">
        <CardContent className="py-16 text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-emerald-100 p-4 rounded-full">
              <Send className="h-12 w-12 text-emerald-600 animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-emerald-900">¡Gracias!</CardTitle>
          <p className="text-emerald-700 text-lg">Tus comentarios nos ayudan a mejorar DiaCero para todos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/5 rounded-2xl">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-headline font-bold">Tu Opinión Importa</CardTitle>
        <CardDescription className="text-lg">¿Cómo fue tu experiencia de aprendizaje hoy?</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4 text-center">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Calificación General</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform active:scale-95 focus:outline-none"
                >
                  <Star
                    className={`h-12 w-12 transition-colors duration-200 ${
                      (hoveredRating || rating) >= star 
                        ? 'fill-accent text-accent' 
                        : 'text-muted-foreground/30 fill-muted-foreground/10'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium italic">
              {rating === 1 && "Podría ser mucho mejor"}
              {rating === 2 && "Necesita mejorar"}
              {rating === 3 && "Estuvo bien"}
              {rating === 4 && "¡Gran experiencia!"}
              {rating === 5 && "¡Superó mis expectativas!"}
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="comments" className="text-sm font-semibold">¿Algún pensamiento adicional?</Label>
            <Textarea
              id="comments"
              placeholder="Inserte sus comentarios o sugerencias"
              className="min-h-[150px] resize-none border-primary/10 focus-visible:ring-primary"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button 
            type="submit" 
            disabled={!rating} 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            Enviar Comentarios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
