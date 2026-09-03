import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as assignModule, DELETE as unassignModule } from '@/app/api/admin/assignments/route';

// Mock de Supabase client
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('Lógica de Cálculo de Progreso y Avance', () => {
  // Función pura representativa de la lógica de cálculo usada en useAdminUsers y CertificateClient
  const calculateModuleProgress = (completedSections: string[] | number, totalSections: number) => {
    const safeTotal = Math.max(1, totalSections);
    const completedCount = Array.isArray(completedSections) ? completedSections.length : (Number(completedSections) || 0);
    const percent = Math.min(100, Math.round((completedCount / safeTotal) * 100));
    return {
      completedCount,
      totalSections: safeTotal,
      percentage: percent,
      isCompleted: percent >= 100,
    };
  };

  const calculateOverallProgress = (modulePercentages: number[]) => {
    if (!modulePercentages || modulePercentages.length === 0) return 0;
    const sum = modulePercentages.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / modulePercentages.length);
  };

  it('calcula 0% de avance cuando no hay secciones completadas', () => {
    const res = calculateModuleProgress([], 5);
    expect(res.percentage).toBe(0);
    expect(res.isCompleted).toBe(false);
  });

  it('calcula porcentaje exacto de avance parcial (ej. 3 de 4 secciones = 75%)', () => {
    const res = calculateModuleProgress(['sec-1', 'sec-2', 'sec-3'], 4);
    expect(res.percentage).toBe(75);
    expect(res.isCompleted).toBe(false);
  });

  it('marca como completado (100%) cuando se terminan todas las secciones', () => {
    const res = calculateModuleProgress(['sec-1', 'sec-2'], 2);
    expect(res.percentage).toBe(100);
    expect(res.isCompleted).toBe(true);
  });

  it('limita el porcentaje a 100% como tope máximo incluso si se registran más secciones', () => {
    const res = calculateModuleProgress(['sec-1', 'sec-2', 'sec-3', 'sec-4'], 3);
    expect(res.percentage).toBe(100);
    expect(res.isCompleted).toBe(true);
  });

  it('maneja módulos con 0 secciones sin generar división por cero (NaN)', () => {
    const res = calculateModuleProgress([], 0);
    expect(res.percentage).toBe(0);
    expect(res.isCompleted).toBe(false);
    expect(Number.isNaN(res.percentage)).toBe(false);
  });

  it('calcula correctamente el promedio de avance global de un estudiante', () => {
    // 3 módulos: uno al 100%, otro al 50%, y otro al 0% -> Promedio: 50%
    const overall = calculateOverallProgress([100, 50, 0]);
    expect(overall).toBe(50);
  });

  it('retorna 0% si el estudiante no tiene módulos asignados', () => {
    const overall = calculateOverallProgress([]);
    expect(overall).toBe(0);
  });
});

describe('API Asignación de Módulos - /api/admin/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar 400 si falta userId o moduleId al asignar', async () => {
    const request = new Request('http://localhost:3000/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u-1' }), // Falta moduleId
    });

    const response = await assignModule(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Faltan parámetros requeridos');
  });

  it('debe prevenir asignación duplicada y retornar 400 si el módulo ya está asignado', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'prog-existente', user_id: 'u-1', module_id: 'mod-1' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const request = new Request('http://localhost:3000/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u-1', moduleId: 'mod-1' }),
    });

    const response = await assignModule(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('ya tiene asignado este módulo');
  });

  it('debe asignar el módulo e inicializar completed_sections vacío y current_section en 0', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null, // No existía previamente
              error: null,
            }),
          }),
        }),
      }),
      insert: mockInsert,
    });

    const request = new Request('http://localhost:3000/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u-nuevo', moduleId: 'mod-ley-16744' }),
    });

    const response = await assignModule(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Módulo asignado correctamente');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u-nuevo',
        module_id: 'mod-ley-16744',
        completed_sections: [],
        quiz_scores: {},
        current_section_index: 0,
      })
    );
  });

  it('debe desvincular un módulo correctamente mediante DELETE', async () => {
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockDeleteEq,
        }),
      }),
    });

    const request = new Request('http://localhost:3000/api/admin/assignments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u-1', moduleId: 'mod-1' }),
    });

    const response = await unassignModule(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Módulo desvinculado con éxito');
  });
});
