"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HelpCircle, Edit3, Trash2, Check, PlusCircle, Loader2, Save } from "lucide-react";

interface QuizManagerCardProps {
  dbModules: any[];
  quizModuleId: string;
  setQuizModuleId: (id: string) => void;
  quizSectionId: string | null;
  quizQuestions: any[];
  isLoadingQuiz: boolean;
  isCreatingQuizSection: boolean;
  isCreatingQuizQuestion: boolean;
  newQuizQuestion: string;
  setNewQuizQuestion: (val: string) => void;
  newQuizOpt1: string;
  setNewQuizOpt1: (val: string) => void;
  newQuizOpt2: string;
  setNewQuizOpt2: (val: string) => void;
  newQuizOpt3: string;
  setNewQuizOpt3: (val: string) => void;
  newQuizOpt4: string;
  setNewQuizOpt4: (val: string) => void;
  newQuizCorrectIdx: number;
  setNewQuizCorrectIdx: (val: number) => void;
  editingQuizQuestion: any | null;
  setEditingQuizQuestion: (q: any | null) => void;
  editQStatement: string;
  setEditQStatement: (val: string) => void;
  editQOpt1: string;
  setEditQOpt1: (val: string) => void;
  editQOpt2: string;
  setEditQOpt2: (val: string) => void;
  editQOpt3: string;
  setEditQOpt3: (val: string) => void;
  editQOpt4: string;
  setEditQOpt4: (val: string) => void;
  editQCorrectIdx: number;
  setEditQCorrectIdx: (val: number) => void;
  isSavingQuizEdit: boolean;
  deletingQuestionId: string | null;
  onCreateQuizSection: () => void;
  onAddQuestion: (e: React.FormEvent) => void;
  onOpenEditQuestion: (q: any) => void;
  onSaveEditQuestion: (e: React.FormEvent) => void;
  onDeleteQuestion: (qId: string) => void;
}

export function QuizManagerCard({
  dbModules,
  quizModuleId,
  setQuizModuleId,
  quizSectionId,
  quizQuestions,
  isLoadingQuiz,
  isCreatingQuizSection,
  isCreatingQuizQuestion,
  newQuizQuestion,
  setNewQuizQuestion,
  newQuizOpt1,
  setNewQuizOpt1,
  newQuizOpt2,
  setNewQuizOpt2,
  newQuizOpt3,
  setNewQuizOpt3,
  newQuizOpt4,
  setNewQuizOpt4,
  newQuizCorrectIdx,
  setNewQuizCorrectIdx,
  editingQuizQuestion,
  setEditingQuizQuestion,
  editQStatement,
  setEditQStatement,
  editQOpt1,
  setEditQOpt1,
  editQOpt2,
  setEditQOpt2,
  editQOpt3,
  setEditQOpt3,
  editQOpt4,
  setEditQOpt4,
  editQCorrectIdx,
  setEditQCorrectIdx,
  isSavingQuizEdit,
  deletingQuestionId,
  onCreateQuizSection,
  onAddQuestion,
  onOpenEditQuestion,
  onSaveEditQuestion,
  onDeleteQuestion
}: QuizManagerCardProps) {
  return (
    <Card className="mt-8 border-rose-100 shadow-lg border-t-[5px] border-t-rose-500">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <span className="text-xl">📝</span> Central de Evaluaciones (Quizzes)
        </CardTitle>
        <CardDescription>Edita los cuestionarios finales inyectando preguntas exclusivas que medirán la pericia del alumno al final del módulo seleccionado.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="q-mod" className="text-slate-800 font-bold">Seleccionar Módulo a Editar</Label>
            <select 
              id="q-mod" 
              className="w-full h-11 px-3 border border-slate-300 rounded-md bg-rose-50/50 text-sm font-medium"
              value={quizModuleId}
              onChange={e => setQuizModuleId(e.target.value)}
            >
              {dbModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              {dbModules.length === 0 && <option value="">Sin módulos en la base de datos...</option>}
            </select>
          </div>

          {isLoadingQuiz ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !quizSectionId ? (
            <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
              <p className="text-slate-600 mb-6 max-w-md font-medium">Este módulo actualmente no tiene ninguna Evaluación Final insertada en su malla curricular. Debes generar el contenedor físico en Supabase antes de inyectar preguntas.</p>
              <Button onClick={onCreateQuizSection} disabled={isCreatingQuizSection || !quizModuleId} className="bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 text-white font-bold h-12 px-6">
                {isCreatingQuizSection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando Segmento Base...</> : "Activar Motor de Examen para el Módulo"}
              </Button>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-8">
              {/* Banco de Preguntas Vigentes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-rose-500" />
                    Banco de Preguntas Vigentes ({quizQuestions.length})
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">Respuestas con opción correcta resaltada</span>
                </div>

                {quizQuestions.length === 0 ? (
                  <p className="text-sm text-slate-500 italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    El banco de preguntas de este examen se encuentra vacío. Añade preguntas con el formulario inferior.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((q, i) => (
                      <div key={q.id} className="p-5 bg-white shadow-xs rounded-2xl border border-slate-200/80 hover:border-rose-300 transition-all space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2.5">
                            <span className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              Q{i + 1}
                            </span>
                            <h5 className="font-bold text-slate-800 text-base leading-snug">{q.question}</h5>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenEditQuestion(q)}
                              className="h-8 px-2.5 text-xs font-bold text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={deletingQuestionId === q.id}
                              onClick={() => onDeleteQuestion(q.id)}
                              className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            >
                              {deletingQuestionId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />} Eliminar
                            </Button>
                          </div>
                        </div>

                        {/* Grid de 4 opciones */}
                        <div className="grid sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                          {q.options?.map((opt: string, optIdx: number) => {
                            const isCorrect = q.correct_answer === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-400/50'
                                    : 'bg-slate-50 border-slate-200/80 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`h-5 w-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="truncate">{opt}</span>
                                </div>
                                {isCorrect && (
                                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Correcta
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario inyector de 4 opciones con Radio Buttons */}
              <form onSubmit={onAddQuestion} className="bg-gradient-to-br from-rose-50/70 to-pink-50/30 p-6 rounded-2xl border border-rose-200 space-y-5 relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-3">
                  <h4 className="font-black text-rose-900 font-headline text-lg flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-rose-600" />
                    Añadir Nueva Pregunta al Examen
                  </h4>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">4 Opciones</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-800 font-bold text-xs">Enunciado / Pregunta</Label>
                  <Input
                    className="h-12 bg-white border-slate-200 text-sm font-medium focus:ring-rose-500 rounded-xl"
                    placeholder="Ej: ¿Cuál es el plazo máximo para presentar la denuncia DIAT/DIEP?"
                    value={newQuizQuestion}
                    onChange={e => setNewQuizQuestion(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-800 font-bold text-xs">4 Posibles Respuestas</Label>
                    <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      🔘 Marca con el botón cuál es la Respuesta Correcta
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { val: newQuizOpt1, set: setNewQuizOpt1, idx: 0, label: "Opción A" },
                      { val: newQuizOpt2, set: setNewQuizOpt2, idx: 1, label: "Opción B" },
                      { val: newQuizOpt3, set: setNewQuizOpt3, idx: 2, label: "Opción C" },
                      { val: newQuizOpt4, set: setNewQuizOpt4, idx: 3, label: "Opción D" }
                    ].map((item) => (
                      <div
                        key={item.idx}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          newQuizCorrectIdx === item.idx
                            ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          id={`new-opt-radio-${item.idx}`}
                          name="newQuizCorrectRadio"
                          checked={newQuizCorrectIdx === item.idx}
                          onChange={() => setNewQuizCorrectIdx(item.idx)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`new-opt-radio-${item.idx}`} className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer block mb-0.5">
                            {item.label} {newQuizCorrectIdx === item.idx && <span className="text-emerald-700 font-black">(✓ Correcta)</span>}
                          </Label>
                          <Input
                            className="h-9 text-xs bg-slate-50/50 border-slate-200 rounded-lg"
                            placeholder={`Escribe la ${item.label.toLowerCase()}...`}
                            value={item.val}
                            onChange={e => item.set(e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isCreatingQuizQuestion}
                  className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isCreatingQuizQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  {isCreatingQuizQuestion ? "Guardando Pregunta..." : "Añadir Pregunta al Banco"}
                </Button>
              </form>

              {/* Modal para Editar Pregunta del Quiz */}
              <Dialog open={!!editingQuizQuestion} onOpenChange={open => !open && setEditingQuizQuestion(null)}>
                <DialogContent className="max-w-xl p-6 bg-white rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-headline font-black text-slate-800 flex items-center gap-2">
                      <Edit3 className="h-5 w-5 text-sky-600" />
                      Editar Pregunta del Quiz
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Modifica el enunciado o cualquiera de las 4 opciones de respuesta. Marca la opción correcta con el botón radio.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={onSaveEditQuestion} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-800">Enunciado de la Pregunta</Label>
                      <Input
                        className="h-11 text-xs bg-slate-50 rounded-xl"
                        value={editQStatement}
                        onChange={e => setEditQStatement(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>Opciones de Respuesta & Selección de Respuesta Correcta</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">🔘 Radio = Respuesta Correcta</span>
                      </Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { val: editQOpt1, set: setEditQOpt1, idx: 0, label: "Opción A" },
                          { val: editQOpt2, set: setEditQOpt2, idx: 1, label: "Opción B" },
                          { val: editQOpt3, set: setEditQOpt3, idx: 2, label: "Opción C" },
                          { val: editQOpt4, set: setEditQOpt4, idx: 3, label: "Opción D" }
                        ].map((item) => (
                          <div
                            key={item.idx}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                              editQCorrectIdx === item.idx
                                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              id={`edit-opt-radio-${item.idx}`}
                              name="editQuizCorrectRadio"
                              checked={editQCorrectIdx === item.idx}
                              onChange={() => setEditQCorrectIdx(item.idx)}
                              className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={`edit-opt-radio-${item.idx}`} className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer block mb-0.5">
                                {item.label} {editQCorrectIdx === item.idx && <span className="text-emerald-700 font-black">(✓ Correcta)</span>}
                              </Label>
                              <Input
                                className="h-8 text-xs bg-white rounded-lg"
                                value={item.val}
                                onChange={e => item.set(e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setEditingQuizQuestion(null)} className="h-10 text-xs font-bold rounded-xl">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSavingQuizEdit} className="h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 rounded-xl">
                        {isSavingQuizEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Guardar Cambios
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
