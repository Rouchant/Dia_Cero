"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Edit3, Video, Image as ImageIcon, Save, Bold, List, Sparkles, Brain, BookOpen, 
  CheckCircle2, Loader2, HelpCircle, Trash2, Check, PlusCircle 
} from "lucide-react";

interface TheoryContentBuilderTabProps {
  dbModules: any[];
  editContentModuleId: string;
  setEditContentModuleId: (id: string) => void;
  contentSections: any[];
  draftSections: Record<string, any>;
  selectedSectionId: string | null;
  isLoadingContent: boolean;
  isSavingContent: boolean;
  isGeneratingAi: boolean;
  editSecTitle: string;
  setEditSecTitle: (val: string) => void;
  editSecContent: string;
  setEditSecContent: (val: string) => void;
  editSecVideo: string;
  setEditSecVideo: (val: string) => void;
  editSecImage: string;
  setEditSecImage: (val: string) => void;
  editSecAiSummary: string;
  setEditSecAiSummary: (val: string) => void;
  editSecAiExplanationText: string;
  setEditSecAiExplanationText: (val: string) => void;
  editSecAiAnalogy: string;
  setEditSecAiAnalogy: (val: string) => void;
  onSelectSection: (secId: string) => void;
  onAddSection: () => void;
  onSaveAllSections: (e?: React.FormEvent) => void;
  onGenerateAi: () => void;
  contentTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  insertBold: () => void;
  insertBullet: () => void;
  updateDraftField: (field: string, val: any) => void;
  quizManager: any;
  onRenameModule?: (modId: string, newTitle: string) => Promise<void>;
}

export function TheoryContentBuilderTab({
  dbModules,
  editContentModuleId,
  setEditContentModuleId,
  contentSections,
  draftSections,
  selectedSectionId,
  isLoadingContent,
  isSavingContent,
  isGeneratingAi,
  editSecTitle,
  setEditSecTitle,
  editSecContent,
  setEditSecContent,
  editSecVideo,
  setEditSecVideo,
  editSecImage,
  setEditSecImage,
  editSecAiSummary,
  setEditSecAiSummary,
  editSecAiExplanationText,
  setEditSecAiExplanationText,
  editSecAiAnalogy,
  setEditSecAiAnalogy,
  onSelectSection,
  onAddSection,
  onSaveAllSections,
  onGenerateAi,
  contentTextareaRef,
  insertBold,
  insertBullet,
  updateDraftField,
  quizManager,
  onRenameModule
}: TheoryContentBuilderTabProps) {
  const [activeMode, setActiveMode] = useState<'theory' | 'quiz'>('theory');

  // Rename Module Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTitleInput, setRenameTitleInput] = useState("");
  const [isRenamingModule, setIsRenamingModule] = useState(false);

  const handleOpenRename = () => {
    const currentMod = dbModules.find(m => m.id === editContentModuleId);
    setRenameTitleInput(currentMod?.title || "");
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitleInput.trim() || !editContentModuleId || !onRenameModule) return;
    setIsRenamingModule(true);
    await onRenameModule(editContentModuleId, renameTitleInput.trim());
    setIsRenamingModule(false);
    setIsRenameModalOpen(false);
  };

  return (
    <Card className="border-sky-100 shadow-xl border-t-[5px] border-t-sky-500 overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <span className="text-xl">📚</span> Constructor Teórico & Evaluaciones (Mallas)
          </CardTitle>
          <CardDescription>Edita la teoría, recursos multimedia, respuestas de IA y el examen final del módulo.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="c-mod" className="text-xs font-bold uppercase text-slate-500 whitespace-nowrap">Módulo:</Label>
          <select 
            id="c-mod" 
            className="h-10 px-3 border border-slate-300 rounded-md bg-white text-sm font-bold text-sky-950 focus:ring-2 focus:ring-sky-500 max-w-[220px] sm:max-w-xs"
            value={editContentModuleId}
            onChange={e => setEditContentModuleId(e.target.value)}
          >
            {dbModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            {dbModules.length === 0 && <option value="">Sin módulos...</option>}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenRename}
            disabled={!editContentModuleId}
            className="h-10 px-3 text-xs font-bold border-slate-300 text-slate-700 hover:bg-sky-50 hover:text-sky-800 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-600" /> Renombrar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row min-h-[550px]">
          {/* Navegación Diapositivas Lateral */}
          <div className="w-full md:w-72 bg-slate-50/50 p-4 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lecciones ({contentSections.length})</span>
            </div>

            {isLoadingContent ? (
              <div className="py-12 flex justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <nav className="space-y-2 flex-1 overflow-y-auto">
                {contentSections.map((sec, idx) => {
                  const isModified = draftSections[sec.id]?.isModified;
                  const isSelected = activeMode === 'theory' && selectedSectionId === sec.id;
                  return (
                    <button 
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveMode('theory');
                        onSelectSection(sec.id);
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all border shadow-xs flex items-center justify-between gap-2 ${isSelected ? 'bg-sky-100 font-bold border-sky-300 text-sky-900 border-l-4 border-l-sky-600' : 'bg-white opacity-85 hover:opacity-100 border-slate-200 text-slate-600'}`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Sección {idx + 1}</span>
                        <span className="line-clamp-2 leading-tight">{sec.title}</span>
                      </div>
                      {isModified && (
                        <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Edición
                        </span>
                      )}
                    </button>
                  );
                })}

                {contentSections.length === 0 && (
                  <p className="text-sm text-slate-500 italic p-3 text-center bg-white rounded-md border border-dashed">El módulo no tiene contenido teórico.</p>
                )}

                {/* Botón de Selección del Quiz Final */}
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => setActiveMode('quiz')}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all border shadow-xs flex items-center justify-between gap-2 ${
                      activeMode === 'quiz'
                        ? 'bg-rose-100 font-bold border-rose-300 text-rose-950 border-l-4 border-l-rose-600'
                        : 'bg-gradient-to-r from-rose-50 to-pink-50 hover:bg-rose-100/80 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="text-base">📝</span>
                      <div>
                        <span className="block text-[10px] uppercase font-black text-rose-600 tracking-wider">Evaluación Final</span>
                        <span className="font-bold text-xs">Quiz del Módulo</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                      {quizManager.quizQuestions?.length || 0} preg.
                    </span>
                  </button>
                </div>
              </nav>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button 
                onClick={onAddSection} 
                disabled={isSavingContent || !editContentModuleId} 
                variant="outline" 
                className="w-full bg-sky-100 border-2 border-sky-300 text-sky-700 hover:bg-brand-blue hover:text-white hover:border-brand-blue font-bold transition-colors text-xs"
              >
                + Inyectar Nueva Lección
              </Button>
            </div>
          </div>

          {/* Area Principal Edit */}
          <div className="flex-1 p-6 md:p-8 bg-white relative">
            {activeMode === 'quiz' ? (
              /* VISTA EDITOR DE QUIZZES INTEGRADA */
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-xl font-headline font-black text-rose-900 flex items-center gap-2">
                      <span className="text-xl">📝</span> Evaluación Final del Módulo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Configura las preguntas que responderán los alumnos al finalizar este módulo.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveMode('theory')} className="text-xs font-bold">
                    Volver a Teoría
                  </Button>
                </div>

                {quizManager.isLoadingQuiz ? (
                  <div className="py-12 flex justify-center text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                  </div>
                ) : !quizManager.quizSectionId ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                    <p className="text-slate-600 mb-6 max-w-md font-medium text-sm">Este módulo aún no tiene un examen final asignado. Genera el contenedor antes de añadir preguntas.</p>
                    <Button onClick={quizManager.handleCreateQuizSection} disabled={quizManager.isCreatingQuizSection} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 px-6">
                      {quizManager.isCreatingQuizSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Activar Examen para este Módulo"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Banco de Preguntas Vigentes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-rose-500" />
                          Preguntas del Examen ({quizManager.quizQuestions.length})
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">4 Opciones por pregunta con respuesta válida indicada</span>
                      </div>

                      {quizManager.quizQuestions.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                          Aún no hay preguntas para el examen de este módulo. Añade la primera abajo.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {quizManager.quizQuestions.map((q: any, i: number) => (
                            <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 transition-all space-y-3 shadow-xs">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-2.5">
                                  <span className="h-6 w-6 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    Q{i + 1}
                                  </span>
                                  <h5 className="font-bold text-slate-800 text-sm leading-snug">{q.question}</h5>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => quizManager.handleOpenEditQuizQuestion(q)}
                                    className="h-7 px-2 text-xs font-bold text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                                  >
                                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={quizManager.deletingQuestionId === q.id}
                                    onClick={() => quizManager.handleDeleteQuizQuestion(q.id)}
                                    className="h-7 px-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                  >
                                    {quizManager.deletingQuestionId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />} Eliminar
                                  </Button>
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                {q.options?.map((opt: string, optIdx: number) => {
                                  const isCorrect = q.correct_answer === optIdx;
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 transition-all ${
                                        isCorrect
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold ring-1 ring-emerald-400/50'
                                          : 'bg-slate-50 border-slate-200/80 text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`h-4 w-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="truncate text-xs">{opt}</span>
                                      </div>
                                      {isCorrect && (
                                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
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

                    {/* Formulario Añadir Pregunta de 4 opciones */}
                    <form onSubmit={quizManager.handleAddQuestion} className="bg-gradient-to-br from-rose-50/70 to-pink-50/30 p-5 rounded-2xl border border-rose-200 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
                        <h4 className="font-black text-rose-900 text-base flex items-center gap-2">
                          <PlusCircle className="h-4 w-4 text-rose-600" />
                          Añadir Nueva Pregunta al Examen
                        </h4>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">4 Opciones</span>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-slate-800 font-bold text-xs">Enunciado de la Pregunta</Label>
                        <Input
                          className="h-11 bg-white border-slate-200 text-xs font-medium focus:ring-rose-500 rounded-xl"
                          placeholder="Ej: ¿Cuál es la primera acción preventiva en trabajo en altura?"
                          value={quizManager.newQuizQuestion}
                          onChange={e => quizManager.setNewQuizQuestion(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-800 font-bold text-xs">4 Posibles Respuestas</Label>
                          <span className="text-[10px] text-rose-600 font-semibold">
                            🔘 Selecciona con el radio cuál es la Correcta
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {[
                            { val: quizManager.newQuizOpt1, set: quizManager.setNewQuizOpt1, idx: 0, label: "Opción A" },
                            { val: quizManager.newQuizOpt2, set: quizManager.setNewQuizOpt2, idx: 1, label: "Opción B" },
                            { val: quizManager.newQuizOpt3, set: quizManager.setNewQuizOpt3, idx: 2, label: "Opción C" },
                            { val: quizManager.newQuizOpt4, set: quizManager.setNewQuizOpt4, idx: 3, label: "Opción D" }
                          ].map((item) => (
                            <div
                              key={item.idx}
                              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                                quizManager.newQuizCorrectIdx === item.idx
                                  ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                id={`new-opt-radio-${item.idx}`}
                                name="newQuizCorrectRadio"
                                checked={quizManager.newQuizCorrectIdx === item.idx}
                                onChange={() => quizManager.setNewQuizCorrectIdx(item.idx)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={`new-opt-radio-${item.idx}`} className="text-[9px] font-bold text-slate-500 uppercase cursor-pointer block mb-0.5">
                                  {item.label} {quizManager.newQuizCorrectIdx === item.idx && <span className="text-emerald-700 font-black">(✓ Correcta)</span>}
                                </Label>
                                <Input
                                  className="h-8 text-xs bg-slate-50/50 border-slate-200 rounded-lg"
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
                        disabled={quizManager.isCreatingQuizQuestion}
                        className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                      >
                        {quizManager.isCreatingQuizQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                        {quizManager.isCreatingQuizQuestion ? "Guardando..." : "Añadir Pregunta al Examen del Módulo"}
                      </Button>
                    </form>

                    {/* Modal Editar Pregunta */}
                    <Dialog open={!!quizManager.editingQuizQuestion} onOpenChange={open => !open && quizManager.setEditingQuizQuestion(null)}>
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

                        <form onSubmit={quizManager.handleSaveQuizEdit} className="space-y-4 mt-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-800">Enunciado de la Pregunta</Label>
                            <Input
                              className="h-11 text-xs bg-slate-50 rounded-xl"
                              value={quizManager.editQStatement}
                              onChange={e => quizManager.setEditQStatement(e.target.value)}
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
                                { val: quizManager.editQOpt1, set: quizManager.setEditQOpt1, idx: 0, label: "Opción A" },
                                { val: quizManager.editQOpt2, set: quizManager.setEditQOpt2, idx: 1, label: "Opción B" },
                                { val: quizManager.editQOpt3, set: quizManager.setEditQOpt3, idx: 2, label: "Opción C" },
                                { val: quizManager.editQOpt4, set: quizManager.setEditQOpt4, idx: 3, label: "Opción D" }
                              ].map((item) => (
                                <div
                                  key={item.idx}
                                  className={`p-3 rounded-xl border transition-all flex items-center gap-2.5 ${
                                    quizManager.editQCorrectIdx === item.idx
                                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    id={`edit-opt-radio-${item.idx}`}
                                    name="editQuizCorrectRadio"
                                    checked={quizManager.editQCorrectIdx === item.idx}
                                    onChange={() => quizManager.setEditQCorrectIdx(item.idx)}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <Label htmlFor={`edit-opt-radio-${item.idx}`} className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer block mb-0.5">
                                      {item.label} {quizManager.editQCorrectIdx === item.idx && <span className="text-emerald-700 font-black">(✓ Correcta)</span>}
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
                            <Button type="button" variant="outline" onClick={() => quizManager.setEditingQuizQuestion(null)} className="h-10 text-xs font-bold rounded-xl">
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={quizManager.isSavingQuizEdit} className="h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 rounded-xl">
                              {quizManager.isSavingQuizEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                              Guardar Cambios
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ) : (
              /* VISTA EDITOR DE DIAPOSITIVAS TEÓRICAS */
              selectedSectionId ? (
                <form onSubmit={onSaveAllSections} className="space-y-6 max-w-2xl mx-auto">
                  
                  <div className="space-y-2">
                    <Label className="text-slate-800 font-black text-lg">Título de la Diapositiva</Label>
                    <Input 
                      className="h-14 bg-sky-50 border-sky-100 text-lg font-headline font-bold" 
                      placeholder="Inserte título"
                      value={editSecTitle} 
                      onChange={e => {
                        setEditSecTitle(e.target.value);
                        updateDraftField('title', e.target.value);
                      }} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-800 font-bold">Contenido Teórico / Explicación Escrita</Label>
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={insertBold}
                          title="Añadir Negrita (**texto**)"
                          className="h-8 px-2 text-xs font-bold hover:bg-white text-slate-700 rounded-md"
                        >
                          <Bold className="h-4 w-4 mr-1 text-slate-900" /> Negrita
                        </Button>
                        <div className="h-4 w-px bg-slate-300" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={insertBullet}
                          title="Añadir Lista con Puntos (• punto)"
                          className="h-8 px-2 text-xs font-bold hover:bg-white text-slate-700 rounded-md"
                        >
                          <List className="h-4 w-4 mr-1 text-slate-900" /> Punteo
                        </Button>
                      </div>
                    </div>

                    <textarea 
                      ref={contentTextareaRef}
                      required
                      className="flex min-h-[220px] w-full rounded-xl border border-slate-200 shadow-inner bg-slate-50 px-4 py-3 text-base leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 font-body"
                      placeholder="Inserte contenido (puedes usar **negrita** y • viñetas)..."
                      value={editSecContent}
                      onChange={e => {
                        setEditSecContent(e.target.value);
                        updateDraftField('content', e.target.value);
                      }}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <Label className="text-slate-700 font-bold flex items-center gap-1.5"><Video className="w-4 h-4 text-rose-500"/> URL Video YouTube (Opcional)</Label>
                      <Input 
                        className="h-10 text-xs bg-white" 
                        placeholder="Inserte URL de YouTube" 
                        value={editSecVideo} 
                        onChange={e => {
                          setEditSecVideo(e.target.value);
                          updateDraftField('video_url', e.target.value);
                        }} 
                      />
                      <p className="text-[10px] text-slate-500">Pega tu link nativo de YouTube aquí sin problemas.</p>
                    </div>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <Label className="text-slate-700 font-bold flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-indigo-500"/> URL Imagen Contextual (Opcional)</Label>
                      <Input 
                        className="h-10 text-xs bg-white" 
                        type="url"
                        placeholder="Inserte URL de imagen" 
                        value={editSecImage} 
                        onChange={e => {
                          setEditSecImage(e.target.value);
                          updateDraftField('image_url', e.target.value);
                        }} 
                      />
                      <p className="text-[10px] text-slate-500">Apunta a imagen web (.jpg, .png)</p>
                    </div>
                  </div>

                  {/* Panel Previsualizador y Generador de Respuestas del Agente de IA */}
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-200/80 p-5 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/50 pb-3">
                      <div>
                        <h4 className="font-headline font-black text-brand-blue text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-brand-yellow fill-brand-yellow animate-bounce-subtle" />
                          Agente de IA (Resumen & Explicación Adaptativa)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">Previsualiza y edita las respuestas pre-cargadas que verán los alumnos.</p>
                      </div>
                      <Button
                        type="button"
                        onClick={onGenerateAi}
                        disabled={isGeneratingAi}
                        className="h-10 px-4 bg-brand-blue hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-brand-yellow" />}
                        {isGeneratingAi ? "Generando..." : "✨ Generar / Actualizar Respuestas de IA"}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Bloque 1: Resumen Rápido */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                        <Label className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-brand-blue" /> Bloque 1: Resumen Rápido (IA)
                        </Label>
                        <textarea
                          className="w-full min-h-[75px] p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium leading-relaxed"
                          placeholder="Sin resumen pre-generado. Toca 'Generar con IA' o escribe uno..."
                          value={editSecAiSummary}
                          onChange={e => {
                            setEditSecAiSummary(e.target.value);
                            updateDraftField('ai_summary', e.target.value);
                          }}
                        />
                      </div>

                      {/* Bloque 2: Explicación Adaptativa (Texto + Analogía) */}
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <Label className="text-xs font-bold text-brand-lightblue flex items-center gap-1.5">
                            <Brain className="h-4 w-4 text-brand-lightblue" /> Bloque 2: Explicación Adaptativa (Texto + Analogía)
                          </Label>
                          <span className="text-[10px] font-bold text-slate-400">Generado conjuntamente</span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-700">
                              Explicación Sencilla
                            </Label>
                            <textarea
                              className="w-full min-h-[95px] p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium leading-relaxed"
                              placeholder="Sin explicación pre-generada. Toca 'Generar con IA' o escribe una..."
                              value={editSecAiExplanationText}
                              onChange={e => {
                                setEditSecAiExplanationText(e.target.value);
                                updateDraftField('ai_explanation_text', e.target.value);
                              }}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span>Analogía de la Vida Real</span>
                              <span className="text-[10px] text-amber-600 font-semibold">(Opcional)</span>
                            </Label>
                            <textarea
                              className="w-full min-h-[95px] p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium leading-relaxed"
                              placeholder="Ej: Como ponerse el cinturón antes de conducir..."
                              value={editSecAiAnalogy}
                              onChange={e => {
                                setEditSecAiAnalogy(e.target.value);
                                updateDraftField('ai_analogy', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {Object.values(draftSections).filter((s: any) => s.isModified).length > 0 ? (
                        <span className="text-amber-600 font-black flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          {Object.values(draftSections).filter((s: any) => s.isModified).length} lección(es) modificada(s) pendientes de guardar
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Todas las lecciones al día
                        </span>
                      )}
                    </span>

                    <Button 
                      type="submit" 
                      disabled={isSavingContent} 
                      className="h-12 px-8 bg-sky-600 hover:bg-sky-700 text-white font-black shadow-lg shadow-sky-200 rounded-xl"
                    >
                      {isSavingContent ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Sincronizando Nube...</> : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios del Módulo</>}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center min-h-[400px] text-center opacity-50">
                  <Edit3 className="h-16 w-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-600">Ninguna Lección Activa</h3>
                  <p className="text-slate-500 max-w-xs mt-2">Selecciona un panel a la izquierda o crea una lección para comenzar la edición arquitectónica.</p>
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>

      {/* Modal Renombrar Módulo */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black text-slate-800 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-sky-600" />
              Renombrar Módulo de Capacitación
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Escribe el nuevo nombre oficial que verán los estudiantes en la plataforma y certificados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRename} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Título Oficial del Módulo</Label>
              <Input
                className="h-11 text-xs bg-slate-50 font-bold text-slate-900 rounded-xl"
                placeholder="Ej: Módulo 01: Conceptos Básicos de Ciberseguridad"
                value={renameTitleInput}
                onChange={e => setRenameTitleInput(e.target.value)}
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRenameModalOpen(false)} className="h-10 text-xs font-bold rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={isRenamingModule} className="h-10 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 rounded-xl">
                {isRenamingModule ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar Título
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
