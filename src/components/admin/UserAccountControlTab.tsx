"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, KeyRound, BookOpen, ShieldCheck, Loader2, CheckCircle2, User, Trash2, Users, AlertTriangle, ChevronDown, ChevronUp 
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
  newUserRole?: 'estudiante' | 'admin';
  setNewUserRole?: (val: 'estudiante' | 'admin') => void;
  isCreatingUser: boolean;
  onCreateUser: (e: React.FormEvent) => void;
  // Reset Password & Role
  onResetPassword?: (userId: string, newPass: string) => Promise<boolean>;
  onChangeUserRole?: (userId: string, newRole: 'admin' | 'estudiante') => Promise<boolean>;
  // Delete User
  onDeleteUser?: (userId: string, userName?: string) => Promise<boolean | void>;
  currentAdminId?: string;
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
  newUserRole = 'estudiante',
  setNewUserRole,
  isCreatingUser,
  onCreateUser,
  onResetPassword,
  onChangeUserRole,
  onDeleteUser,
  currentAdminId,
  assignUserId,
  setAssignUserId,
  onAssignModuleDirectly,
  onUnassignModuleDirectly
}: UserAccountControlTabProps) {
  // Local state for password reset
  const [resetNewPass, setResetNewPass] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Asegurar que ningún usuario quede seleccionado por default al cargar la pestaña
  useEffect(() => {
    setAssignUserId("");
    setResetNewPass("");
  }, [setAssignUserId]);

  // Unified selected user reference
  const selectedUser = students.find(s => s.id === assignUserId);
  const isRootAdmin = selectedUser?.email === 'admin@diacero.com';
  const isCurrentAdmin = selectedUser?.id === currentAdminId;
  const isProtectedFromDelete = isRootAdmin || isCurrentAdmin;

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !resetNewPass || resetNewPass.length < 6 || !onResetPassword) return;
    setIsResettingPassword(true);
    const success = await onResetPassword(assignUserId, resetNewPass);
    setIsResettingPassword(false);
    if (success) {
      setResetNewPass("");
    }
  };

  const handleExecuteDeleteUser = async () => {
    if (!assignUserId || !onDeleteUser || !selectedUser) return;
    if (isProtectedFromDelete) return;

    setIsDeletingUser(true);
    const success = await onDeleteUser(assignUserId, selectedUser.name || selectedUser.email);
    setIsDeletingUser(false);
    if (success) {
      setAssignUserId("");
    }
  };

  return (
    <div className="space-y-6">
      {/* RECUADRO MAESTRO UNIFICADO */}
      <Card className="border-slate-200/80 shadow-xl border-t-[5px] border-t-indigo-600 rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm">
        
        {/* Cabecera Principal del Recuadro */}
        <CardHeader className="bg-slate-50/70 border-b border-slate-200/80 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2.5 text-lg sm:text-2xl font-headline font-extrabold text-slate-800">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 shrink-0" />
                <span>Control de Cuentas, Roles y Asignaciones</span>
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs sm:text-sm mt-1">
                Alta de nuevos usuarios, administración centralizada de credenciales, roles, malla académica y bajas de cuenta.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto shrink-0 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{students.length} cuentas registradas</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

          {/* 1. MÓDULO CREAR NUEVO USUARIO (ARRIBA - DESPLEGABLE) */}
          <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl overflow-hidden shadow-2xs transition-all">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(!isCreateUserOpen)}
              className="w-full p-3.5 sm:p-5 flex items-center justify-between hover:bg-emerald-50/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 font-headline whitespace-nowrap">
                      Crear Nuevo Usuario
                    </h3>
                    <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                      Alta Inmediata
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    Registra una cuenta de alumno o administrador directamente en la base de datos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs font-bold text-emerald-700 hidden sm:inline">
                  {isCreateUserOpen ? "Ocultar formulario" : "Desplegar formulario"}
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100/80 flex items-center justify-center text-emerald-800">
                  {isCreateUserOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </button>

            {isCreateUserOpen && (
              <div className="p-4 sm:p-6 pt-0 border-t border-emerald-100/80 animate-in fade-in slide-in-from-top-2 duration-200">
                <form onSubmit={onCreateUser} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Nombre Completo</Label>
                      <Input
                        className="h-10 text-xs bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                        className="h-10 text-xs bg-white border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="sofia.valenzuela@diacero.cl"
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Contraseña Inicial</Label>
                      <Input
                        type="text"
                        className="h-10 text-xs bg-white border-slate-200 font-mono rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ej: DiaCero2026!"
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                        required
                      />
                    </div>

                    {setNewUserRole && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">Rol del Usuario</Label>
                        <select
                          className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                          value={newUserRole}
                          onChange={e => setNewUserRole(e.target.value as 'estudiante' | 'admin')}
                        >
                          <option value="estudiante">🎓 Alumno / Estudiante</option>
                          <option value="admin">🛡️ Administrador</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="submit"
                      disabled={isCreatingUser}
                      className="w-full sm:w-auto h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      {isCreatingUser ? "Registrando..." : "Dar de Alta Usuario"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* SEPARADOR */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase font-extrabold tracking-wider">
              <span className="bg-white px-2.5 sm:px-3 text-slate-400 text-center">Gestión de Cuentas Existentes</span>
            </div>
          </div>

          {/* 2. LUEGO: SELECCIONAR USUARIO A ADMINISTRAR */}
          <div className="space-y-2">
            <Label className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600 shrink-0" />
                Seleccionar Usuario a Administrar
              </span>
              {selectedUser && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" /> Cuenta Seleccionada
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignUserId("");
                      setResetNewPass("");
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 underline transition-colors cursor-pointer shrink-0"
                  >
                    Deseleccionar
                  </button>
                </div>
              )}
            </Label>

            <select
              className="w-full h-12 px-3 sm:px-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all cursor-pointer truncate max-w-full"
              value={assignUserId || ""}
              onChange={e => {
                setAssignUserId(e.target.value);
                setResetNewPass("");
              }}
            >
              <option value="">-- Ningún usuario seleccionado (Elige para administrar) --</option>
              {students.map(s => {
                const isUserProtected = s.id === currentAdminId || s.email === 'admin@diacero.com';
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) {s.role === 'admin' ? '[Administrador]' : '[Alumno]'} {isUserProtected ? '— (Tu sesión activa protegida)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedUser ? (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
              
              {/* 3 & 4. CONTROL DE ROLES Y CONTRASEÑA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                
                {/* 3. CONTROL DE ROLES */}
                <div className="p-4 sm:p-5 bg-amber-50/30 border border-amber-200/70 rounded-2xl space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline min-w-0">
                      <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="truncate">Control de Roles</span>
                    </h4>
                    <span className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      selectedUser.role === 'admin'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-sky-100 text-sky-900 border border-sky-300'
                    }`}>
                      {selectedUser.role === 'admin' ? '🛡️ Administrador' : '🎓 Alumno'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 break-words leading-relaxed">
                    Cambia los permisos operativos de <strong className="text-slate-700">{selectedUser.name}</strong> para otorgar o remover acceso al panel de administración.
                  </p>

                  <div className="pt-1">
                    {onChangeUserRole && !isRootAdmin ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdatingRole}
                        onClick={async () => {
                          const newRole = selectedUser.role === 'admin' ? 'estudiante' : 'admin';
                          const roleName = newRole === 'admin' ? 'Administrador' : 'Alumno';
                          if (window.confirm(`¿Confirmas cambiar el rol de "${selectedUser.name}" a ${roleName}?`)) {
                            setIsUpdatingRole(true);
                            await onChangeUserRole(selectedUser.id, newRole);
                            setIsUpdatingRole(false);
                          }
                        }}
                        className={`w-full min-h-10 h-auto py-2.5 px-3 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2 text-center whitespace-normal ${
                          selectedUser.role === 'admin'
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                        <span>Cambiar a Rol {selectedUser.role === 'admin' ? 'Alumno' : 'Administrador'}</span>
                      </Button>
                    ) : (
                      <div className="p-2.5 bg-slate-100 rounded-xl text-[11px] text-slate-500 italic text-center break-words">
                        * La cuenta principal de Administrador no puede ser modificada.
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. CONTRASEÑA */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-headline min-w-0">
                      <KeyRound className="h-4 w-4 text-slate-600 shrink-0" />
                      <span className="truncate">Restablecer Contraseña</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium shrink-0 whitespace-nowrap">Mín. 6 carac.</span>
                  </div>

                  <form onSubmit={handleExecuteResetPassword} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Nueva Contraseña Provisoria</Label>
                      <Input
                        type="text"
                        className="h-10 text-xs bg-white border-slate-200 font-mono rounded-xl"
                        placeholder="Ingresa la nueva clave..."
                        value={resetNewPass}
                        onChange={e => setResetNewPass(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isResettingPassword || resetNewPass.length < 6}
                      className="w-full min-h-10 h-auto py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center whitespace-normal"
                    >
                      {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <KeyRound className="h-4 w-4 shrink-0" />}
                      <span>{isResettingPassword ? "Actualizando..." : "Actualizar Contraseña"}</span>
                    </Button>
                  </form>
                </div>
              </div>

              {/* 5. Y ABAJO: ASIGNACIÓN DE MÓDULOS */}
              <div className="p-4 sm:p-6 bg-indigo-50/30 border border-indigo-200/70 rounded-2xl space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-indigo-100 pb-3">
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2 font-headline">
                      <BookOpen className="h-5 w-5 text-indigo-600 shrink-0" />
                      <span>Asignación de Módulos Académicos</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 break-words">
                      <strong className="text-slate-700">{selectedUser.name}</strong> ({selectedUser.email}) • {selectedUser.assigned_count || 0} de {dbModules.length} módulos habilitados
                    </p>
                  </div>
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-100/70 px-3 py-1 rounded-xl border border-indigo-200 self-start sm:self-auto shrink-0 whitespace-nowrap">
                    {selectedUser.assigned_count === dbModules.length ? "Malla Completa" : `${selectedUser.assigned_count || 0} Cursos Activos`}
                  </span>
                </div>

                {/* Grid de módulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {dbModules.map(mod => {
                    const breakdownItem = selectedUser.module_breakdown?.find((mb: any) => mb.module_id === mod.id);
                    const isAssigned = breakdownItem?.is_assigned ?? false;
                    const progressPerc = breakdownItem?.progress_percentage ?? 0;

                    return (
                      <div
                        key={mod.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isAssigned
                            ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                            : 'bg-white/60 border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 min-w-0">
                              {mod.title}
                            </h5>
                            {isAssigned ? (
                              <span className="shrink-0 whitespace-nowrap text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Matriculado
                              </span>
                            ) : (
                              <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                No asignado
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {mod.description || "Sin descripción teórica detallada"}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {isAssigned && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>Progreso Académico</span>
                                <span className="text-indigo-600 font-extrabold">{progressPerc}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPerc}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            {isAssigned ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => onUnassignModuleDirectly?.(selectedUser.id, mod.id)}
                                className="w-full sm:w-auto h-8 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                              >
                                Desvincular Módulo
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => onAssignModuleDirectly?.(selectedUser.id, mod.id)}
                                className="w-full sm:w-auto h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                              >
                                Asignar Módulo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Y ABAJO DEL TODO: ZONA DE PELIGRO BOTÓN DE ELIMINAR CUENTA */}
              <div className="p-4 sm:p-6 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-rose-200/70 pb-2.5">
                  <Trash2 className="h-5 w-5 text-rose-600 shrink-0" />
                  <h4 className="text-sm sm:text-base font-bold text-slate-800 font-headline">
                    Zona de Peligro: Eliminar Cuenta
                  </h4>
                </div>

                {isProtectedFromDelete ? (
                  <div className="p-3.5 sm:p-4 bg-white/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">🛡️</span>
                    <p className="break-words leading-relaxed">
                      La cuenta <strong>{selectedUser.name}</strong> ({selectedUser.email}) corresponde a tu sesión activa de administrador o a la cuenta raíz principal y se encuentra protegida contra eliminación.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-rose-700 leading-relaxed max-w-xl break-words">
                      <p className="font-bold text-rose-900 mb-0.5">
                        Dar de baja definitiva a {selectedUser.name} ({selectedUser.email})
                      </p>
                      <p>
                        Esta acción es irreversible y eliminará todo su progreso registrado, diplomas y credenciales de acceso al sistema.
                      </p>
                    </div>

                    <Button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={handleExecuteDeleteUser}
                      className="w-full sm:w-auto min-h-11 h-auto py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 self-stretch sm:self-auto text-center whitespace-normal"
                    >
                      {isDeletingUser ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Trash2 className="h-4 w-4 shrink-0" />}
                      <span>{isDeletingUser ? "Eliminando Cuenta..." : "Eliminar Cuenta"}</span>
                    </Button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="p-6 sm:p-10 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center space-y-2">
              <User className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Ningún usuario seleccionado</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Elige a un usuario en el selector superior para desplegar su control de roles, restablecimiento de contraseña, asignación de cursos y zona de baja de cuenta.
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
