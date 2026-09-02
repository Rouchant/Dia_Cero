"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { summarizeModuleSection } from '@/ai/flows/ai-module-summary';
import { explainConceptAdaptively } from '@/ai/flows/ai-adaptive-explanation';

function parseAiExplanation(raw: any): { explanation: string; analogy: string } {
  if (!raw) return { explanation: '', analogy: '' };
  if (typeof raw === 'object') {
    return {
      explanation: raw.explanation || raw.text || '',
      analogy: raw.analogyUsed || raw.analogy || ''
    };
  }
  if (typeof raw === 'string') {
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        return {
          explanation: parsed.explanation || parsed.text || '',
          analogy: parsed.analogyUsed || parsed.analogy || ''
        };
      } catch {
        return { explanation: raw, analogy: '' };
      }
    }
    return { explanation: raw, analogy: '' };
  }
  return { explanation: String(raw), analogy: '' };
}

export function useTheoryContentBuilder(dbModules: any[]) {
  const supabase = createClient();

  const [editContentModuleId, setEditContentModuleId] = useState("");
  const [contentSections, setContentSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  
  // Content Form fields
  const [editSecTitle, setEditSecTitle] = useState("");
  const [editSecContent, setEditSecContent] = useState("");
  const [editSecVideo, setEditSecVideo] = useState("");
  const [editSecImage, setEditSecImage] = useState("");
  const [editSecAiSummary, setEditSecAiSummary] = useState("");
  const [editSecAiExplanationText, setEditSecAiExplanationText] = useState("");
  const [editSecAiAnalogy, setEditSecAiAnalogy] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // In-memory draft dictionary for multi-section batch editing across slides
  const [draftSections, setDraftSections] = useState<Record<string, any>>({});
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (dbModules.length > 0 && !editContentModuleId) {
      setEditContentModuleId(dbModules[0].id);
    }
  }, [dbModules, editContentModuleId]);

  // Helper to preserve active section edits in draft map before switching
  const saveCurrentToDraft = () => {
    if (!selectedSectionId) return;
    setDraftSections(prev => {
      if (!prev[selectedSectionId]) return prev;
      return {
        ...prev,
        [selectedSectionId]: {
          ...prev[selectedSectionId],
          title: editSecTitle,
          content: editSecContent,
          video_url: editSecVideo,
          image_url: editSecImage,
          ai_summary: editSecAiSummary,
          ai_explanation_text: editSecAiExplanationText,
          ai_analogy: editSecAiAnalogy
        }
      };
    });
  };

  const updateDraftField = (field: string, value: any) => {
    if (!selectedSectionId) return;
    setDraftSections(prev => {
      const current = prev[selectedSectionId] || { id: selectedSectionId };
      return {
        ...prev,
        [selectedSectionId]: {
          ...current,
          [field]: value,
          isModified: true
        }
      };
    });
  };

  const loadSectionFromDraft = (secId: string, customDrafts?: Record<string, any>) => {
    saveCurrentToDraft();
    setSelectedSectionId(secId);
    const map = customDrafts || draftSections;
    const target = map[secId] || contentSections.find(s => s.id === secId);
    if (target) {
      setEditSecTitle(target.title || "");
      setEditSecContent(target.content || "");
      setEditSecVideo(target.video_url || "");
      setEditSecImage(target.image_url || "");
      setEditSecAiSummary(target.ai_summary || "");
      
      const rawExp = target.ai_explanation_text !== undefined ? { explanation: target.ai_explanation_text, analogyUsed: target.ai_analogy } : target.ai_explanation;
      const parsedExp = parseAiExplanation(rawExp);
      setEditSecAiExplanationText(parsedExp.explanation);
      setEditSecAiAnalogy(parsedExp.analogy);
    }
  };

  // Fetch active Content Editor context
  useEffect(() => {
    async function fetchContentData() {
      if (!editContentModuleId) return;
      setIsLoadingContent(true);
      const { data: sections } = await supabase
        .from('module_sections')
        .select('*')
        .eq('module_id', editContentModuleId)
        .eq('type', 'content')
        .order('sort_order', { ascending: true });

      if (sections) {
        setContentSections(sections);
        const drafts: Record<string, any> = {};
        sections.forEach((s: any) => {
          const parsedExp = parseAiExplanation(s.ai_explanation);
          drafts[s.id] = {
            id: s.id,
            module_id: s.module_id,
            type: s.type || 'content',
            sort_order: s.sort_order,
            title: s.title || '',
            content: s.content || '',
            video_url: s.video_url || '',
            image_url: s.image_url || '',
            ai_summary: s.ai_summary || '',
            ai_explanation_text: parsedExp.explanation,
            ai_analogy: parsedExp.analogy,
            isModified: false
          };
        });
        setDraftSections(drafts);
        if (sections.length > 0) {
          loadSectionFromDraft(sections[0].id, drafts);
        } else {
          clearContentForm();
        }
      } else {
        setContentSections([]);
        setDraftSections({});
        clearContentForm();
      }
      setIsLoadingContent(false);
    }
    fetchContentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editContentModuleId]);

  const clearContentForm = () => {
    setSelectedSectionId(null);
    setEditSecTitle("");
    setEditSecContent("");
    setEditSecVideo("");
    setEditSecImage("");
    setEditSecAiSummary("");
    setEditSecAiExplanationText("");
    setEditSecAiAnalogy("");
  };

  const insertBold = () => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editSecContent;
    const scrollTop = textarea.scrollTop;
    const selectedText = text.substring(start, end);
    
    let replacement = '';
    if (selectedText.length > 0) {
      replacement = `**${selectedText}**`;
    } else {
      replacement = `**texto en negrita**`;
    }
    
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditSecContent(newContent);
    updateDraftField('content', newContent);
    
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.scrollTop = scrollTop;
      if (selectedText.length > 0) {
        textarea.setSelectionRange(start + 2, end + 2);
      } else {
        textarea.setSelectionRange(start + 2, start + 18);
      }
    });
  };

  const insertBullet = () => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editSecContent;
    const scrollTop = textarea.scrollTop;
    const selectedText = text.substring(start, end);
    
    let replacement = '';
    if (selectedText.length > 0) {
      const lines = selectedText.split('\n');
      const bulletedLines = lines.map(line => {
        if (!line.trim()) {
          return line;
        }
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          return line;
        }
        return `• ${line}`;
      });
      replacement = bulletedLines.join('\n');
    } else {
      const prefix = (start > 0 && text[start - 1] !== '\n') ? '\n• ' : '• ';
      replacement = prefix;
    }
    
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditSecContent(newContent);
    updateDraftField('content', newContent);
    
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.scrollTop = scrollTop;
      if (selectedText.length > 0) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
      }
    });
  };

  const handleGenerateAiForCurrentSection = async () => {
    if (!selectedSectionId || !editSecContent.trim()) {
      alert("Por favor escribe contenido en la lección antes de solicitar respuestas a la IA.");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const sumRes = await summarizeModuleSection({ sectionId: selectedSectionId, sectionContent: editSecContent });
      const expRes = await explainConceptAdaptively({ sectionId: selectedSectionId, concept: editSecTitle, context: editSecContent.substring(0, 300) });
      
      if (sumRes?.summary) {
        setEditSecAiSummary(sumRes.summary);
        updateDraftField('ai_summary', sumRes.summary);
      }
      
      if (expRes?.explanation) {
        setEditSecAiExplanationText(expRes.explanation);
        updateDraftField('ai_explanation_text', expRes.explanation);
        
        const analogyVal = expRes.analogyUsed || (expRes as any).analogy || '';
        setEditSecAiAnalogy(analogyVal);
        updateDraftField('ai_analogy', analogyVal);
      }
    } catch (err: any) {
      alert("Error generando respuestas de IA: " + (err?.message || "Verifique conexión"));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddNewContentSection = async () => {
    if (!editContentModuleId) return;
    setIsSavingContent(true);
    const newId = crypto.randomUUID();
    const newSortOrder = contentSections.length > 0 ? contentSections[contentSections.length - 1].sort_order + 1 : 0;
    
    const newSec = {
      id: newId,
      module_id: editContentModuleId,
      title: 'Nueva Diapositiva',
      type: 'content',
      content: 'Escribe tu teoría aquí...',
      sort_order: newSortOrder
    };

    const { error } = await supabase.from('module_sections').insert(newSec);
    if (error) {
      alert("Error insertando sección de contenido vacía: " + error.message);
    } else {
      setContentSections([...contentSections, newSec]);
      const updatedDrafts = {
        ...draftSections,
        [newSec.id]: {
          id: newSec.id,
          module_id: newSec.module_id,
          type: 'content',
          sort_order: newSec.sort_order,
          title: newSec.title,
          content: newSec.content,
          video_url: '',
          image_url: '',
          ai_summary: '',
          ai_explanation: '',
          isModified: false
        }
      };
      setDraftSections(updatedDrafts);
      loadSectionFromDraft(newSec.id, updatedDrafts);
    }
    setIsSavingContent(false);
  };

  const handleSaveAllContentSections = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editContentModuleId) return;

    setIsSavingContent(true);
    try {
      const currentDrafts = { ...draftSections };
      if (selectedSectionId) {
        currentDrafts[selectedSectionId] = {
          ...(currentDrafts[selectedSectionId] || {}),
          title: editSecTitle,
          content: editSecContent,
          video_url: editSecVideo,
          image_url: editSecImage,
          ai_summary: editSecAiSummary,
          ai_explanation_text: editSecAiExplanationText,
          ai_analogy: editSecAiAnalogy
        };
      }

      const allDraftList = Object.values(currentDrafts).map((s: any, idx: number) => {
        const expObj = {
          explanation: s.ai_explanation_text || '',
          analogyUsed: s.ai_analogy || '',
          simplicityLevel: 'simplificada'
        };
        return {
          id: s.id,
          module_id: editContentModuleId,
          type: s.type || 'content',
          title: s.title,
          content: s.content,
          sort_order: s.sort_order ?? idx,
          video_url: s.video_url || null,
          image_url: s.image_url || null,
          ai_summary: s.ai_summary || null,
          ai_explanation: (expObj.explanation || expObj.analogyUsed) ? JSON.stringify(expObj) : null
        };
      });

      if (allDraftList.length > 0) {
        const { error } = await supabase.from('module_sections').upsert(allDraftList);
        if (error) {
          alert("Error guardando lecciones: " + error.message);
        } else {
          alert("¡Todas las lecciones del módulo fueron sincronizadas y guardadas exitosamente en Supabase!");
          
          const resetDrafts: Record<string, any> = {};
          Object.keys(currentDrafts).forEach(k => {
            resetDrafts[k] = { ...currentDrafts[k], isModified: false };
          });
          setDraftSections(resetDrafts);

          const updatedContentSections = contentSections.map(sec => {
            const d = currentDrafts[sec.id];
            return d ? { ...sec, ...d } : sec;
          });
          setContentSections(updatedContentSections);
        }
      }
    } catch (err: any) {
      alert("Error en el servidor: " + err.message);
    } finally {
      setIsSavingContent(false);
    }
  };

  return {
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
    loadSectionFromDraft,
    handleAddNewContentSection,
    handleSaveAllContentSections,
    handleGenerateAiForCurrentSection,
    contentTextareaRef,
    insertBold,
    insertBullet,
    updateDraftField
  };
}
