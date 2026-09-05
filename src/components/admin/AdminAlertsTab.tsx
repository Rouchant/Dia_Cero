"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  UserX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Loader2, 
  Mail, 
  Calendar 
} from "lucide-react";

interface AdminAlertsTabProps {
  suppressionRequests: any[];
  stalledStudents: any[];
  onResolveTicket: (ticketId: string, status: 'approved' | 'rejected', notes?: string) => Promise<boolean>;
  onSelectUser: (user: any) => void;
}

export function AdminAlertsTab({
  suppressionRequests,
  stalledStudents,
  onResolveTicket,
  onSelectUser
}: AdminAlertsTabProps) {
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);

  const handleAction = async (ticketId: string, status: 'approved' | 'rejected') => {
    const confirmText = status === 'approved'
      ? "¿Está seguro de que desea APROBAR la supresión de datos? El perfil del alumno será anonimizado y el acceso revocado."
      : "¿Desea rechazar esta solicitud de supresión?";

    if (!confirm(confirmText)) return;

    setProcessingTicketId(ticketId);
    await onResolveTicket(ticketId, status);
    setProcessingTicketId(null);
  };

  const pendingTickets = suppressionRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: Solicitudes de Supresión de Datos Pendientes (Derecho al Olvido Ley 21.719) */}
      <Card className="rounded-3xl border-red-200/80 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 bg-red-50/40 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl border border-red-200">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-red-950 flex items-center gap-2">
                  Solicitudes de Supresión de Datos
                  {pendingTickets.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-black">
                      {pendingTickets.length} Pendiente{pendingTickets.length > 1 ? 's' : ''}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-red-800/80 mt-0.5">
                  Tickets enviados desde el canal público por colaboradores que solicitan la baja o término de contrato.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {suppressionRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No hay solicitudes de supresión de datos registradas para esta empresa.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {suppressionRequests.map((ticket) => (
                <div key={ticket.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-brand-blue bg-slate-100 px-2 py-0.5 rounded">
                        {ticket.ticket_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ticket.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        ticket.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {ticket.status === 'pending' ? 'Pendiente de Revisión' : ticket.status === 'approved' ? 'Aprobado & Anonimizado' : 'Rechazado'}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">
                      {ticket.full_name || 'Nombre no especificado'} — <span className="font-mono text-slate-500">{ticket.rut || 'Sin RUT'}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> {ticket.email}
                    </p>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                      <strong>Motivo:</strong> {ticket.reason}
                      {ticket.details && <span className="block text-slate-500 mt-0.5">"{ticket.details}"</span>}
                    </p>
                  </div>

                  {ticket.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={processingTicketId === ticket.id}
                        onClick={() => handleAction(ticket.id, 'rejected')}
                        variant="outline"
                        className="text-xs font-bold text-slate-600 hover:text-red-600"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingTicketId === ticket.id}
                        onClick={() => handleAction(ticket.id, 'approved')}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
                      >
                        {processingTicketId === ticket.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar Baja
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: Alertas de Módulos Asignados Sin Progreso o Inactividad */}
      <Card className="rounded-3xl border-amber-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 bg-amber-50/40 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
                Alumnos Asignados Sin Progreso o Inactivos
                {stalledStudents.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-xs font-black">
                    {stalledStudents.length} Alerta{stalledStudents.length > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-amber-800/80 mt-0.5">
                Colaboradores matriculados que tienen 0% de avance o cuya última actividad supera los 7 días.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {stalledStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              ¡Excelente! No hay alumnos en estado de estancamiento o inactividad crítica.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stalledStudents.map((st) => (
                <div key={st.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{st.name}</span>
                      {st.progress_percentage === 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          0% de Avance (Sin Iniciar)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {st.progress_percentage}% de Avance — Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {st.email} {st.rut && `• RUT: ${st.rut}`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Módulos matriculados: <strong>{st.assignedCount}</strong> • Última actividad:{" "}
                      {st.last_active ? new Date(st.last_active).toLocaleDateString('es-ES') : 'Sin registro'}
                    </p>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectUser(st)}
                      className="text-xs font-bold border-amber-200 text-amber-900 hover:bg-amber-50"
                    >
                      Ver Ficha del Alumno
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
