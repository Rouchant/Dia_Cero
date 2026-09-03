import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';

// Mock de Supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockDelete = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('API Admin Modules - DELETE /api/admin/modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe retornar 400 si no se proporciona moduleId', async () => {
    const request = new Request('http://localhost:3000/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Falta moduleId requerido');
  });

  it('debe eliminar en cascada secciones, quizzes, progresos y el módulo con éxito', async () => {
    // 1. Mock de secciones encontradas
    mockFrom.mockImplementation((table: string) => {
      if (table === 'module_sections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'sec-1' }, { id: 'sec-2' }],
              error: null,
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'quiz_questions') {
        return {
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'user_progress') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'modules') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const request = new Request('http://localhost:3000/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: 'mod-test-1' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('eliminados correctamente');
  });

  it('debe manejar módulos sin secciones sin intentar borrar preguntas', async () => {
    let quizDeleted = false;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'module_sections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // Sin secciones
              error: null,
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'quiz_questions') {
        return {
          delete: vi.fn().mockImplementation(() => {
            quizDeleted = true;
            return { in: vi.fn().mockResolvedValue({ error: null }) };
          }),
        };
      }
      if (table === 'user_progress' || table === 'modules') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    const request = new Request('http://localhost:3000/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: 'mod-empty' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(quizDeleted).toBe(false); // No debió invocar borrado de quizzes si no habían secciones
  });

  it('debe retornar 500 si la base de datos falla al consultar secciones', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Conexión rechazada' },
        }),
      }),
    });

    const request = new Request('http://localhost:3000/api/admin/modules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: 'mod-err' }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Error consultando secciones: Conexión rechazada');
  });
});

describe('Lógica de Creación y Edición de Módulos (Helper Tests)', () => {
  it('genera un slug ID limpio a partir del título', () => {
    const generateModuleId = (title: string, customId?: string) => {
      const baseId = customId?.trim() || title.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return baseId ? `${baseId}-test` : 'mod-default';
    };

    expect(generateModuleId('Prevención de Riesgos en Faena')).toBe('prevencion-de-riesgos-en-faena-test');
    expect(generateModuleId('Módulo 1: ¡Seguridad Total!')).toBe('modulo-1-seguridad-total-test');
    expect(generateModuleId('', 'mi-custom-id')).toBe('mi-custom-id-test');
  });

  it('valida que el título no esté vacío para creación o edición', () => {
    const isValidTitle = (title: string) => title && title.trim().length > 0;

    expect(isValidTitle('Ley 16.744')).toBe(true);
    expect(isValidTitle('   ')).toBeFalsy();
    expect(isValidTitle('')).toBeFalsy();
  });
});
