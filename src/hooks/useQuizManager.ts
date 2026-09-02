"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useQuizManager(dbModules: any[], activeModuleId?: string) {
  const supabase = createClient();

  const currentModId = activeModuleId || (dbModules.length > 0 ? dbModules[0].id : "");

  const [quizSectionId, setQuizSectionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOpt1, setNewQuizOpt1] = useState("");
  const [newQuizOpt2, setNewQuizOpt2] = useState("");
  const [newQuizOpt3, setNewQuizOpt3] = useState("");
  const [newQuizOpt4, setNewQuizOpt4] = useState("");
  const [newQuizCorrectIdx, setNewQuizCorrectIdx] = useState<number>(0);
  const [isCreatingQuizQuestion, setIsCreatingQuizQuestion] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isCreatingQuizSection, setIsCreatingQuizSection] = useState(false);

  // Edit Quiz Question Modal State
  const [editingQuizQuestion, setEditingQuizQuestion] = useState<any | null>(null);
  const [editQStatement, setEditQStatement] = useState("");
  const [editQOpt1, setEditQOpt1] = useState("");
  const [editQOpt2, setEditQOpt2] = useState("");
  const [editQOpt3, setEditQOpt3] = useState("");
  const [editQOpt4, setEditQOpt4] = useState("");
  const [editQCorrectIdx, setEditQCorrectIdx] = useState<number>(0);
  const [isSavingQuizEdit, setIsSavingQuizEdit] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  // Fetch Quiz Question Context whenever currentModId changes
  useEffect(() => {
    async function fetchQuizData() {
      if (!currentModId) {
        setQuizSectionId(null);
        setQuizQuestions([]);
        return;
      }
      setIsLoadingQuiz(true);
      const { data: sections } = await supabase
        .from('module_sections')
        .select('*')
        .eq('module_id', currentModId)
        .eq('type', 'quiz');

      if (sections && sections.length > 0) {
        const targetSec = sections[0];
        setQuizSectionId(targetSec.id);
        const { data: qData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('section_id', targetSec.id)
          .order('created_at', { ascending: true });
        setQuizQuestions(qData || []);
      } else {
        setQuizSectionId(null);
        setQuizQuestions([]);
      }
      setIsLoadingQuiz(false);
    }
    fetchQuizData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModId]);

  const handleCreateQuizSection = async () => {
    if (!currentModId) return;
    setIsCreatingQuizSection(true);
    const newSecId = currentModId + '-eval-final';
    const { error } = await supabase.from('module_sections').insert({
      id: newSecId,
      module_id: currentModId,
      title: 'Evaluación Final',
      type: 'quiz',
      content: 'Responda las siguientes preguntas para validar la absorción de los conocimientos del módulo crítico.',
      sort_order: 99
    });
    
    if (error) {
      alert("Error estableciendo la infraestructura del Quiz: " + error.message);
    } else {
      setQuizSectionId(newSecId);
      setQuizQuestions([]);
    }
    setIsCreatingQuizSection(false);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizSectionId) return;

    if (!newQuizQuestion.trim()) {
      alert("Por favor escribe el enunciado de la pregunta.");
      return;
    }

    const rawOptions = [newQuizOpt1.trim(), newQuizOpt2.trim(), newQuizOpt3.trim(), newQuizOpt4.trim()];
    const optionsArray = rawOptions.filter(opt => opt.length > 0);

    if (optionsArray.length < 2) {
      alert("Por favor escribe al menos 2 opciones de respuesta.");
      return;
    }

    if (newQuizCorrectIdx >= optionsArray.length) {
      alert("La opción seleccionada como correcta no tiene texto ingresado. Selecciona una opción válida.");
      return;
    }

    setIsCreatingQuizQuestion(true);
    const { data: newQ, error } = await supabase.from('quiz_questions').insert({
      id: crypto.randomUUID(),
      section_id: quizSectionId,
      question: newQuizQuestion.trim(),
      options: optionsArray,
      correct_answer: newQuizCorrectIdx
    }).select().single();

    if (error) {
      alert("Error guardando la pregunta en el servidor: " + error.message);
    } else if (newQ) {
      setQuizQuestions([...quizQuestions, newQ]);
      setNewQuizQuestion("");
      setNewQuizOpt1("");
      setNewQuizOpt2("");
      setNewQuizOpt3("");
      setNewQuizOpt4("");
      setNewQuizCorrectIdx(0);
    }
    setIsCreatingQuizQuestion(false);
  };

  const handleOpenEditQuizQuestion = (q: any) => {
    setEditingQuizQuestion(q);
    setEditQStatement(q.question || "");
    const opts = Array.isArray(q.options) ? q.options : [];
    setEditQOpt1(opts[0] || "");
    setEditQOpt2(opts[1] || "");
    setEditQOpt3(opts[2] || "");
    setEditQOpt4(opts[3] || "");
    setEditQCorrectIdx(typeof q.correct_answer === 'number' ? q.correct_answer : 0);
  };

  const handleSaveQuizEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuizQuestion) return;

    if (!editQStatement.trim()) {
      alert("Por favor escribe el enunciado de la pregunta.");
      return;
    }

    const rawOptions = [editQOpt1.trim(), editQOpt2.trim(), editQOpt3.trim(), editQOpt4.trim()];
    const optionsArray = rawOptions.filter(opt => opt.length > 0);

    if (optionsArray.length < 2) {
      alert("Por favor escribe al menos 2 opciones de respuesta.");
      return;
    }

    if (editQCorrectIdx >= optionsArray.length) {
      alert("La opción seleccionada como correcta no tiene texto ingresado.");
      return;
    }

    setIsSavingQuizEdit(true);
    const { error } = await supabase
      .from('quiz_questions')
      .update({
        question: editQStatement.trim(),
        options: optionsArray,
        correct_answer: editQCorrectIdx
      })
      .eq('id', editingQuizQuestion.id);

    if (error) {
      alert("Error actualizando la pregunta: " + error.message);
    } else {
      setQuizQuestions(prev => prev.map(q => q.id === editingQuizQuestion.id ? {
        ...q,
        question: editQStatement.trim(),
        options: optionsArray,
        correct_answer: editQCorrectIdx
      } : q));
      setEditingQuizQuestion(null);
    }
    setIsSavingQuizEdit(false);
  };

  const handleDeleteQuizQuestion = async (qId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta pregunta del banco de datos?")) return;
    setDeletingQuestionId(qId);
    const { error } = await supabase.from('quiz_questions').delete().eq('id', qId);
    if (error) {
      alert("Error eliminando pregunta: " + error.message);
    } else {
      setQuizQuestions(prev => prev.filter(q => q.id !== qId));
    }
    setDeletingQuestionId(null);
  };

  return {
    quizModuleId: currentModId,
    setQuizModuleId: () => {},
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
    handleCreateQuizSection,
    handleAddQuestion,
    handleOpenEditQuizQuestion,
    handleSaveQuizEdit,
    handleDeleteQuizQuestion
  };
}
