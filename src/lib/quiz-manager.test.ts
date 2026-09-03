import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Gestor de Quizzes y Preguntas (Quiz Manager Engine)', () => {
  // Mock de funciones de base de datos Supabase
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockSelect = vi.fn();

  // Helper puro para validación y preparación de nueva pregunta
  const validateAndPrepareQuestion = (
    statement: string,
    rawOptions: string[],
    correctIndex: number
  ) => {
    const trimmedStatement = (statement || '').trim();
    if (!trimmedStatement) {
      return { valid: false, error: 'El enunciado de la pregunta no puede estar vacío' };
    }

    const cleanedOptions = rawOptions
      .map(opt => (opt || '').trim())
      .filter(opt => opt.length > 0);

    if (cleanedOptions.length < 2) {
      return { valid: false, error: 'Debe ingresar al menos 2 opciones de respuesta válidas' };
    }

    if (correctIndex < 0 || correctIndex >= cleanedOptions.length) {
      return { valid: false, error: 'La opción seleccionada como correcta no es válida' };
    }

    return {
      valid: true,
      data: {
        question: trimmedStatement,
        options: cleanedOptions,
        correct_answer: correctIndex,
      },
    };
  };

  // Helper para creación de sección de examen
  const createQuizSectionPayload = (moduleId: string) => {
    if (!moduleId || !moduleId.trim()) return null;
    return {
      id: `${moduleId.trim()}-eval-final`,
      module_id: moduleId.trim(),
      title: 'Evaluación Final',
      type: 'quiz',
      content: 'Responda las siguientes preguntas para validar la absorción de los conocimientos del módulo crítico.',
      sort_order: 99,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Creación de Contenedor / Sección de Quiz', () => {
    it('debe generar el payload correcto para la sección del quiz de un módulo', () => {
      const payload = createQuizSectionPayload('mod-seguridad-1');
      expect(payload).toEqual({
        id: 'mod-seguridad-1-eval-final',
        module_id: 'mod-seguridad-1',
        title: 'Evaluación Final',
        type: 'quiz',
        content: expect.stringContaining('validar la absorción'),
        sort_order: 99,
      });
    });

    it('retorna null si no se especifica un moduleId válido', () => {
      expect(createQuizSectionPayload('')).toBeNull();
      expect(createQuizSectionPayload('   ')).toBeNull();
    });
  });

  describe('2. Validación y Creación de Preguntas del Quiz', () => {
    it('rechaza preguntas con enunciado vacío o solo espacios', () => {
      const res = validateAndPrepareQuestion('   ', ['Opción 1', 'Opción 2'], 0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('enunciado de la pregunta no puede estar vacío');
    });

    it('rechaza preguntas con menos de 2 opciones con contenido', () => {
      const res = validateAndPrepareQuestion('¿Qué es un EPP?', ['Casco', '  ', ''], 0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('al menos 2 opciones de respuesta');
    });

    it('rechaza si la opción marcada como correcta no tiene texto ingresado', () => {
      // 2 opciones válidas (índices 0 y 1), pero se seleccionó índice 2 que está vacío
      const res = validateAndPrepareQuestion(
        '¿Cuál es el plazo legal?',
        ['24 horas', '48 horas', '  ', ''],
        2
      );
      expect(res.valid).toBe(false);
      expect(res.error).toContain('no es válida');
    });

    it('procesa y prepara exitosamente una pregunta con 4 opciones e índice válido', () => {
      const res = validateAndPrepareQuestion(
        '¿Cuál es la ley que rige los accidentes laborales en Chile?',
        ['Ley 19.300', 'Ley 20.001', 'Ley 16.744', 'Ley 18.834'],
        2 // Ley 16.744
      );

      expect(res.valid).toBe(true);
      expect(res.data).toEqual({
        question: '¿Cuál es la ley que rige los accidentes laborales en Chile?',
        options: ['Ley 19.300', 'Ley 20.001', 'Ley 16.744', 'Ley 18.834'],
        correct_answer: 2,
      });
    });
  });

  describe('3. Modificación / Edición de Preguntas Existentes', () => {
    const originalQuestion = {
      id: 'q-101',
      section_id: 'mod-1-eval-final',
      question: 'Enunciado original',
      options: ['A', 'B', 'C', 'D'],
      correct_answer: 0,
    };

    it('permite actualizar el enunciado, las opciones y la respuesta correcta', () => {
      const updatedData = validateAndPrepareQuestion(
        'Enunciado corregido y mejor redactado',
        ['Alternativa A editada', 'Alternativa B editada', 'Alternativa C editada', 'Alternativa D editada'],
        3 // Ahora la D es la correcta
      );

      expect(updatedData.valid).toBe(true);
      const mergedQuestion = {
        ...originalQuestion,
        ...updatedData.data,
      };

      expect(mergedQuestion.id).toBe('q-101');
      expect(mergedQuestion.question).toBe('Enunciado corregido y mejor redactado');
      expect(mergedQuestion.correct_answer).toBe(3);
      expect(mergedQuestion.options[3]).toBe('Alternativa D editada');
    });

    it('rechaza la edición si el nuevo enunciado queda en blanco', () => {
      const res = validateAndPrepareQuestion('', ['Opción 1', 'Opción 2'], 0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('enunciado');
    });
  });

  describe('4. Eliminación de Preguntas de la Evaluación', () => {
    it('elimina la pregunta seleccionada filtrándola de la lista del estado', () => {
      const questionsList = [
        { id: 'q-1', question: 'Pregunta 1', options: ['A', 'B'], correct_answer: 0 },
        { id: 'q-2', question: 'Pregunta 2', options: ['A', 'B'], correct_answer: 1 },
        { id: 'q-3', question: 'Pregunta 3', options: ['A', 'B'], correct_answer: 0 },
      ];

      const questionIdToDelete = 'q-2';
      const updatedList = questionsList.filter(q => q.id !== questionIdToDelete);

      expect(updatedList).toHaveLength(2);
      expect(updatedList.some(q => q.id === 'q-2')).toBe(false);
      expect(updatedList.map(q => q.id)).toEqual(['q-1', 'q-3']);
    });

    it('mantiene la lista intacta si el ID a eliminar no coincide con ninguna pregunta', () => {
      const questionsList = [
        { id: 'q-1', question: 'Pregunta 1', options: ['A', 'B'], correct_answer: 0 },
      ];

      const updatedList = questionsList.filter(q => q.id !== 'q-inexistente');
      expect(updatedList).toHaveLength(1);
      expect(updatedList[0].id).toBe('q-1');
    });
  });
});
