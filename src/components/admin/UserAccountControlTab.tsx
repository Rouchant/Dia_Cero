"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, KeyRound, BookOpen, ShieldCheck, Loader2, Save, CheckCircle2, User 
} from "lucide-react";

interface UserAccountControlTabProps {
  students: any[];
  dbModules: any[];
  // User Creation
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  isCreatingUser: boolean;
  onCreateUser: (e: React.FormEvent) => void;
  // Reset Password
  onResetPassword?: (userId: string, newPass: string) => Promise<boolean>;
  // Module Assignment
  assignUserId: string;
  setAssignUserId: (id: string) => void;
  assignModuleId: string;
  setAssignModuleId: (id: string) => void;
  isAssigning: boolean;
  onAssignModule: (e: React.FormEvent) => void;
}

export function UserAccountControlTab({
  students,
  dbModules,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  isCreatingUser,
  onCreateUser,
  onResetPassword,
  assignUserId,
  setAssignUserId,
  assignModuleId,
  setAssignModuleId,
  isAssigning,
  onAssignModule
}: UserAccountControlTabProps) {
  // Reset password form state
  const [resetTargetUserId, setResetTargetUserId] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUserId || !resetNewPass || resetNewPass.length < 6 || !onResetPassword) return;
    setIsResettingPassword(true);
    const success = await onResetPassword(resetTargetUserId, resetNewPass);
    setIsResettingPassword(false);
    if (success) {
      setResetNewPass("");
      setResetTargetUserId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* CARD 1: Crear Nuevo Alumno */}
        <Card className="border-emerald-100 shadow-xl border-t-[5px] border-t-emerald-500 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 p-6">
            <CardTitle className="flex items-center gap-2 text-xl font-headline text-slate-800">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Crear Nuevo Usuario Alumno
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Registra directamente a un integrante en la base de datos sin requerir verificación por correo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={onCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nombre Completo</Label>
                <Input
                  className="h-11 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                  placeholder="Ej: Sofía Valenzuela"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Correo Electrónico</Label>
                <Input
                  type="email"
                  className="h-11 text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                  placeholder="sofia.valenzuela@diacero.cl"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Contraseña Inicial Provisoria</Label>
                <Input
                  type="text"
                  className="h-11 text-xs bg-slate-50 border-slate-200 font-mono focus:bg-white rounded-xl"
                  placeholder="Ej: DiaCero2026!"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isCreatingUser}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {isCreatingUser ? "Registrando Alumno..." : "Dar de Alta Alumno"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CARD 2: Restablecer Contraseña de Alumno */}
        <Card className="border-amber-100 shadow-xl border-t-[5px] border-t-amber-500 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100 p-6">
            <CardTitle className="flex items-center gap-2 text-xl font-headline text-slate-800">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Restablecer Contraseña de Alumno
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Modifica la clave de acceso de cualquier alumno registrado en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleExecuteResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Seleccionar Alumno</Label>
                <select
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  value={resetTargetUserId}
                  onChange={e => setResetTargetUserId(e.target.value)}
                  required
                >
                  <option value="">Selecciona un integrante...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nueva Contraseña (mínimo 6 caracteres)</Label>
                <Input
                  type="text"
                  className="h-11 text-xs bg-slate-50 border-slate-200 font-mono focus:bg-white rounded-xl"
                  placeholder="Ingresa la nueva clave requerida..."
                  value={resetNewPass}
                  onChange={e => setResetNewPass(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={isResettingPassword || !resetTargetUserId || resetNewPass.length < 6}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-6"
              >
                {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {isResettingPassword ? "Actualizando Credencial..." : "Actualizar Contraseña del Alumno"}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* CARD 3: Asignación de Módulos Académicos */}
      <Card className="border-indigo-100 shadow-xl border-t-[5px] border-t-indigo-600 rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 p-6">
          <CardTitle className="flex items-center gap-2 text-xl font-headline text-slate-800">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Asignación de Módulos Académicos
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Matricula manualmente a los estudiantes en los cursos teóricos disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={onAssignModule} className="grid md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">1. Seleccionar Estudiante</Label>
              <select
                className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                value={assignUserId}
                onChange={e => setAssignUserId(e.target.value)}
                required
              >
                <option value="">Selecciona un estudiante...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">2. Seleccionar Módulo</Label>
              <select
                className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                value={assignModuleId}
                onChange={e => setAssignModuleId(e.target.value)}
                required
              >
                <option value="">Selecciona un módulo...</option>
                {dbModules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={isAssigning || !assignUserId || !assignModuleId}
              className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
              {isAssigning ? "Asignando Módulo..." : "Vincular Módulo al Estudiante"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
