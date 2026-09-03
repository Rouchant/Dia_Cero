"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Search, Award } from "lucide-react";
import Link from 'next/link';
import { generateCertId } from '@/lib/cert-hash';

interface UserManagementTabProps {
  filteredUsers: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectUser: (user: any) => void;
  selectedUserStats: any;
  setSelectedUserStats: (user: any) => void;
}

export function UserManagementTab({
  filteredUsers,
  searchQuery,
  setSearchQuery,
  onSelectUser,
  selectedUserStats,
  setSelectedUserStats
}: UserManagementTabProps) {
  return (
    <Card className="border-brand-blue/10 shadow-xl rounded-3xl overflow-hidden bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-slate-50/80 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-headline text-brand-blue">
            <Users className="h-5 w-5 text-brand-blue" />
            Nómina General de Alumnos ({filteredUsers.length})
          </CardTitle>
          <CardDescription className="text-slate-500 mt-1 font-medium text-xs sm:text-sm">
            Visualiza el rendimiento, porcentaje de avance y descarga los diplomas oficiales de cada integrante.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Input Búsqueda de Alumno */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar alumnos por nombre o correo electrónico"
              className="pl-9 h-10 text-xs bg-white border-slate-200 rounded-xl placeholder:text-slate-500 w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Vista Móvil: Tarjetas Táctiles Optimizadas con bordes divisores más intensos */}
        <div className="block md:hidden divide-y-2 divide-slate-200">
          {filteredUsers.map(u => (
            <div key={u.id} className="p-4 bg-white hover:bg-slate-50/80 transition-colors space-y-3">
              {/* Fila Superior: Avatar + Nombre + Correo + Rol */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-brand-blue/10 text-brand-blue font-black text-xs flex items-center justify-center shrink-0 border border-brand-blue/20">
                    {u.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  u.role === 'admin' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {u.role === 'admin' ? 'Administrador' : 'Alumno'}
                </span>
              </div>

              {/* Fila Inferior: Barra de Progreso + Botón Ver Ficha */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-600">Avance: <strong className="text-slate-900">{u.progress_percentage || 0}%</strong></span>
                    {u.progress_percentage === 100 && (
                      <span className="text-brand-green font-extrabold flex items-center gap-0.5">
                        ¡Completado!
                      </span>
                    )}
                  </div>
                  <Progress 
                    value={u.progress_percentage || 0} 
                    aria-label={`Progreso de ${u.name}: ${u.progress_percentage || 0}%`}
                    className="h-2" 
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectUser(u)}
                  aria-label={`Ver ficha académica de ${u.name}`}
                  className="h-8 px-3 text-xs font-bold border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white transition-all rounded-lg shrink-0 shadow-2xs"
                >
                  Ver Ficha
                </Button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-slate-500 italic text-xs">
              No se encontraron usuarios coincidentes con la búsqueda.
            </div>
          )}
        </div>

        {/* Vista Tablet / Escritorio: Tabla Completa */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Alumno</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6">Avance</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-600 font-mono">{u.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {u.role === 'admin' ? 'Administrador' : 'Alumno'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="w-48 space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{u.progress_percentage || 0}%</span>
                        {u.progress_percentage === 100 && <span className="text-brand-green">¡Completado!</span>}
                      </div>
                      <Progress 
                        value={u.progress_percentage || 0} 
                        aria-label={`Progreso de ${u.name}: ${u.progress_percentage || 0}%`}
                        className="h-2" 
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectUser(u)}
                      aria-label={`Ver ficha académica de ${u.name}`}
                      className="h-8 text-xs font-bold border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white transition-all rounded-lg"
                    >
                      Ver Ficha
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500 italic">
                    No se encontraron usuarios coincidentes con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Modal Ficha del Alumno */}
      <Dialog open={!!selectedUserStats} onOpenChange={open => !open && setSelectedUserStats(null)}>
        <DialogContent className="w-[92vw] sm:max-w-lg p-4 sm:p-6 bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black text-slate-800">
              Ficha del Alumno
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Detalle de rendimiento académico y avance por módulo.
            </DialogDescription>
          </DialogHeader>

          {selectedUserStats && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-sm font-bold text-slate-800">{selectedUserStats.name}</p>
                <p className="text-xs text-slate-600 font-mono">{selectedUserStats.email}</p>
                <p className="text-[10px] text-slate-500 font-mono">ID: {selectedUserStats.id}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Progreso Global:</span>
                  <span className="text-brand-blue font-black">{selectedUserStats.progress_percentage || 0}%</span>
                </div>
                <Progress 
                  value={selectedUserStats.progress_percentage || 0} 
                  aria-label={`Progreso global de ${selectedUserStats.name}: ${selectedUserStats.progress_percentage || 0}%`}
                  className="h-2.5" 
                />
              </div>

              {/* Desglose por módulo */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Desglose por Módulo</span>
                  <span className="text-[10px] text-slate-500">({selectedUserStats.module_breakdown?.length || 0} módulos)</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedUserStats.module_breakdown?.map((mod: any) => (
                    <div key={mod.module_id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{mod.module_title}</span>
                        <span className={`text-xs font-bold ${mod.is_assigned ? 'text-brand-blue' : 'text-slate-500'}`}>
                          {mod.is_assigned ? `${mod.progress_percentage}%` : 'No Asignado'}
                        </span>
                      </div>
                      
                      {mod.is_assigned ? (
                        <>
                          <Progress 
                            value={mod.progress_percentage} 
                            aria-label={`Progreso en ${mod.module_title}: ${mod.progress_percentage}%`}
                            className="h-1.5" 
                          />
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-slate-600">{mod.completed_count} de {mod.total_sections} lecciones</span>
                            {mod.progress_percentage === 100 && (
                              <Link 
                                href={`/certificate/${generateCertId(selectedUserStats.id, mod.module_id)}`} 
                                target="_blank"
                                className="text-emerald-700 font-bold hover:underline text-[11px] flex items-center gap-1"
                              >
                                <Award className="h-3.5 w-3.5 text-emerald-600" /> Ver Diploma
                              </Link>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Módulo no asignado aún a este perfil</p>
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
