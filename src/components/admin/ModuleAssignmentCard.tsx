"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";

interface ModuleAssignmentCardProps {
  dbModules: any[];
  students: any[];
  assignUserId: string;
  setAssignUserId: (val: string) => void;
  assignModuleId: string;
  setAssignModuleId: (val: string) => void;
  isAssigning: boolean;
  onAssignModule: (e: React.FormEvent) => void;
}

export function ModuleAssignmentCard({
  dbModules,
  students,
  assignUserId,
  setAssignUserId,
  assignModuleId,
  setAssignModuleId,
  isAssigning,
  onAssignModule
}: ModuleAssignmentCardProps) {
  return (
    <Card className="border-indigo-100 shadow-md">
      <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
        <CardTitle className="flex items-center gap-2 text-xl font-headline text-indigo-950">
          <PlusCircle className="h-5 w-5 text-indigo-600" />
          Asignación Manual de Módulos Críticos
        </CardTitle>
        <CardDescription>
          Selecciona un estudiante y vincúlale un módulo de capacitación específico directamente a su perfil.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onAssignModule} className="grid md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="assign-user" className="text-slate-800 font-bold">1. Alumno Destinatario</Label>
            <select
              id="assign-user"
              className="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              value={assignUserId}
              onChange={e => setAssignUserId(e.target.value)}
              required
            >
              <option value="">Seleccione estudiante...</option>
              {students.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-mod" className="text-slate-800 font-bold">2. Módulo a Asignar</Label>
            <select
              id="assign-mod"
              className="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500"
              value={assignModuleId}
              onChange={e => setAssignModuleId(e.target.value)}
              required
            >
              {dbModules.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={isAssigning || !assignUserId || !assignModuleId}
            className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200"
          >
            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
            {isAssigning ? "Asignando..." : "Asignar Módulo al Perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
