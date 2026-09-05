"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Award } from "lucide-react";

interface AdminStatsCardsProps {
  totalStudents: number;
  totalUsers?: number;
  averageProgress: number;
  completedStudents: number;
}

export function AdminStatsCards({ totalStudents, totalUsers, averageProgress, completedStudents }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Card 1: Total de Alumnos */}
      <Card className="bg-white border-brand-blue/10 shadow-xs sm:shadow-sm hover:border-brand-blue/30 transition-all rounded-xl sm:rounded-2xl">
        <CardContent className="p-2.5 sm:p-4 md:p-6 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-tight leading-tight line-clamp-2">
              Total de Alumnos
            </p>
            <div className="h-6 w-6 sm:h-9 sm:w-9 md:h-11 md:w-11 rounded-lg sm:rounded-xl md:rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-headline font-black text-brand-blue leading-none">
              {totalStudents}
            </h3>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1 leading-tight line-clamp-1 sm:line-clamp-none">
              {totalUsers && totalUsers > totalStudents ? `${totalStudents} alumnos de ${totalUsers} registrados` : "Registrados en la plataforma"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Avance Promedio */}
      <Card className="bg-white border-brand-blue/10 shadow-xs sm:shadow-sm hover:border-brand-blue/30 transition-all rounded-xl sm:rounded-2xl">
        <CardContent className="p-2.5 sm:p-4 md:p-6 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-tight leading-tight line-clamp-2">
              Avance Promedio
            </p>
            <div className="h-6 w-6 sm:h-9 sm:w-9 md:h-11 md:w-11 rounded-lg sm:rounded-xl md:rounded-2xl bg-brand-lightblue/10 text-brand-lightblue flex items-center justify-center shrink-0">
              <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-headline font-black text-brand-lightblue leading-none">
              {averageProgress}%
            </h3>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1 leading-tight line-clamp-1 sm:line-clamp-none">
              Nivel global de avance
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Alumnos Finalizados */}
      <Card className="bg-white border-brand-blue/10 shadow-xs sm:shadow-sm hover:border-brand-blue/30 transition-all rounded-xl sm:rounded-2xl">
        <CardContent className="p-2.5 sm:p-4 md:p-6 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-1 mb-1 sm:mb-2">
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-600 uppercase tracking-tight leading-tight line-clamp-2">
              Alumnos Finalizados
            </p>
            <div className="h-6 w-6 sm:h-9 sm:w-9 md:h-11 md:w-11 rounded-lg sm:rounded-xl md:rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
              <Award className="h-3.5 w-3.5 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-headline font-black text-brand-green leading-none">
              {completedStudents}
            </h3>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1 leading-tight line-clamp-1 sm:line-clamp-none">
              100% de la malla completada
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
