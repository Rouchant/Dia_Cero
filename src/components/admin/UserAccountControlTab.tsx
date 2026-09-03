"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, KeyRound, BookOpen, ShieldCheck, Loader2, Save, CheckCircle2, User, XCircle, Plus 
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
  onAssignModuleDirectly?: (userId: string, moduleId: string) => Promise<void>;
  onUnassignModuleDirectly?: (userId: string, moduleId: string) => Promise<void>;
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
  onAssignModule,
  onAssignModuleDirectly,
  onUnassignModuleDirectly
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
            Matricula o desvincula módulos académicos a los estudiantes con un solo clic.
          </CardDescription>
        </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Selector principal del estudiante */}
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Seleccionar Estudiante a Gestionar</Label>
                  <select
                    className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    value={assignUserId}
                    onChange={e => setAssignUserId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un estudiante...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email}) — {s.assigned_count || 0} módulos
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    {students.find(s => s.id === assignUserId) ? (
                      <span className="text-indigo-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" /> Estudiante cargado
                      </span>
                    ) : (
                      "Selecciona un alumno para ver sus cursos"
                    )}
                  </span>
                </div>
              </div>

              {/* Matriz interactiva de módulos del alumno seleccionado */}
              {(() => {
                const currentStudent = students.find(s => s.id === assignUserId);
                if (!currentStudent) {
                  return (
                    <div className="p-6 rounded-2xl bg-indigo-50/40 border border-dashed border-indigo-200 text-center space-y-2">
                      <BookOpen className="h-8 w-8 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Gestión de Cursos del Estudiante</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Selecciona un estudiante arriba para revisar qué módulos tiene asignados y poder vincular o retirar asignaturas fácilmente.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <User className="h-4 w-4 text-indigo-600" />
                          Plan Académico de {currentStudent.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {currentStudent.email} • {currentStudent.assigned_count || 0} de {dbModules.length} módulos habilitados
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {dbModules.map(mod => {
                        const breakdownItem = currentStudent.module_breakdown?.find((mb: any) => mb.module_id === mod.id);
                        const isAssigned = breakdownItem?.is_assigned ?? false;
                        const progressPerc = breakdownItem?.progress_percentage ?? 0;

                        return (
                          <div
                            key={mod.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isAssigned
                                ? 'bg-indigo-50/40 border-indigo-200/80 shadow-xs'
                                : 'bg-slate-50/50 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{mod.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{mod.description || 'Sin descripción'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isAssigned
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {isAssigned ? '✓ Asignado' : 'No Asignado'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 gap-2">
                              <span className="text-[11px] text-slate-600 font-medium">
                                {isAssigned ? (
                                  <span className="font-bold text-indigo-900">Avance: {progressPerc}%</span>
                                ) : (
                                  <span className="text-slate-400">Disponible para asignar</span>
                                )}
                              </span>

                              {isAssigned ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isAssigning}
                                  onClick={() => onUnassignModuleDirectly?.(currentStudent.id, mod.id)}
                                  className="h-8 px-3 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-all"
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Quitar Módulo
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isAssigning}
                                  onClick={() => onAssignModuleDirectly?.(currentStudent.id, mod.id)}
                                  className="h-8 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Asignar Módulo
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
