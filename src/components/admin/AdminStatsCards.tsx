"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Award } from "lucide-react";

interface AdminStatsCardsProps {
  totalStudents: number;
  averageProgress: number;
  completedStudents: number;
}

export function AdminStatsCards({ totalStudents, averageProgress, completedStudents }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-white border-brand-blue/10 shadow-sm hover:border-brand-blue/30 transition-all">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Alumnos</p>
            <h3 className="text-3xl font-headline font-black text-brand-blue mt-1">{totalStudents}</h3>
            <p className="text-xs text-slate-400 mt-1">Registrados en la plataforma</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-brand-blue/10 shadow-sm hover:border-brand-blue/30 transition-all">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Avance Promedio</p>
            <h3 className="text-3xl font-headline font-black text-brand-lightblue mt-1">{averageProgress}%</h3>
            <p className="text-xs text-slate-400 mt-1">Nivel global de avance</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-lightblue/10 text-brand-lightblue flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-brand-blue/10 shadow-sm hover:border-brand-blue/30 transition-all">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Alumnos Finalizados</p>
            <h3 className="text-3xl font-headline font-black text-brand-green mt-1">{completedStudents}</h3>
            <p className="text-xs text-slate-400 mt-1">100% de la malla completada</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center">
            <Award className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
