"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Search, PlusCircle, Award, ExternalLink, Loader2 } from "lucide-react";
import Link from 'next/link';
import { generateCertId } from '@/lib/cert-hash';

interface UserManagementTabProps {
  users: any[];
  filteredUsers: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectUser: (user: any) => void;
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  isCreatingUser: boolean;
  onCreateUser: (e: React.FormEvent) => void;
  selectedUserStats: any;
  setSelectedUserStats: (user: any) => void;
}

export function UserManagementTab({
  filteredUsers,
  searchQuery,
  setSearchQuery,
  onSelectUser,
  newUserName,
  setNewUserName,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  isCreatingUser,
  onCreateUser,
  selectedUserStats,
  setSelectedUserStats
}: UserManagementTabProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <Card className="border-brand-blue/10 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <Users className="h-5 w-5 text-brand-blue" />
            Nómina General de Alumnos ({filteredUsers.length})
          </CardTitle>
          <CardDescription>Visualiza el rendimiento, porcentaje de avance y descarga los diplomas oficiales de cada integrante.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              className="pl-9 h-10 text-xs bg-white border-slate-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-sm"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Crear Alumno
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="py-3.5 px-6">Alumno</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6">Avance</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const targetMod = u.module_breakdown?.find((m: any) => m.progress_percentage === 100);
                const targetModId = targetMod ? targetMod.module_id : "Malla Seguridad Día Cero";
                const certId = (u.progress_percentage > 0 || targetMod) ? generateCertId(u.id, targetModId) : null;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Alumno'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="w-48 space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">{u.progress_percentage || 0}%</span>
                          {u.progress_percentage === 100 && <span className="text-brand-green">¡Completado!</span>}
                        </div>
                        <Progress value={u.progress_percentage || 0} className="h-2" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectUser(u)}
                        className="h-8 text-xs font-bold border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white transition-all rounded-lg"
                      >
                        Ver Ficha
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 italic">
                    No se encontraron usuarios coincidentes con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal Crear Usuario */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black text-slate-800 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-brand-green" />
              Crear Nuevo Usuario Alumno
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Registra credenciales de acceso para un nuevo estudiante en el sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { onCreateUser(e); setIsModalOpen(false); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nombre Completo</Label>
              <Input
                className="h-10 text-xs bg-slate-50"
                placeholder="Ej: Juan Pérez"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Correo Electrónico</Label>
              <Input
                type="email"
                className="h-10 text-xs bg-slate-50"
                placeholder="juan.perez@empresa.cl"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Contraseña Provisoria</Label>
              <Input
                type="text"
                className="h-10 text-xs bg-slate-50 font-mono"
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-10 text-xs font-bold">
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingUser} className="h-10 bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs px-6 rounded-xl">
                {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PlusCircle className="h-4 w-4 mr-1" />}
                Crear Alumno
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ficha Alumno */}
      <Dialog open={!!selectedUserStats} onOpenChange={open => !open && setSelectedUserStats(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-blue" />
              Ficha del Alumno
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Detalle de progreso individual en la plataforma.
            </DialogDescription>
          </DialogHeader>

          {selectedUserStats && (
            <div className="space-y-4 mt-2 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-sm text-slate-800">{selectedUserStats.name}</p>
                <p className="text-slate-500">{selectedUserStats.email}</p>
                <p className="text-[10px] text-slate-400 font-mono">ID: {selectedUserStats.id}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Progreso Global:</span>
                  <span className="text-brand-blue font-black">{selectedUserStats.progress_percentage || 0}%</span>
                </div>
                <Progress value={selectedUserStats.progress_percentage || 0} className="h-2.5" />
              </div>

              {/* Desglose de Avance por Módulo */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Desglose por Módulo</span>
                  <span className="text-[10px] text-slate-400 font-normal">({selectedUserStats.module_breakdown?.length || 0} módulos)</span>
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedUserStats.module_breakdown?.map((mod: any) => (
                    <div key={mod.module_id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 line-clamp-1 flex-1 mr-2">{mod.title}</span>
                        <span className={mod.is_assigned ? 'text-brand-blue font-black' : 'text-slate-400 text-[11px]'}>
                          {mod.is_assigned ? `${mod.progress_percentage}%` : 'No Asignado'}
                        </span>
                      </div>
                      {mod.is_assigned ? (
                        <>
                          <Progress value={mod.progress_percentage} className="h-1.5" />
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>{mod.completed_sections} de {mod.total_sections} lecciones</span>
                            {mod.progress_percentage === 100 ? (
                              <Link href={`/certificate/${generateCertId(selectedUserStats.id, mod.module_id)}`} target="_blank" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                                <Award className="h-3 w-3 text-emerald-600" /> Ver Diploma
                              </Link>
                            ) : (
                              <span className="text-sky-600 font-medium">En Progreso</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Módulo no asignado aún a este perfil</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>



              <div className="pt-2 flex justify-end">
                <Button variant="outline" onClick={() => setSelectedUserStats(null)} className="h-9 text-xs font-bold">
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
