import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';

const mockUpdateUserById = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('API Superadmin Usuarios - /api/admin/superadmin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/superadmin/users', () => {
    it('debe retornar la lista de usuarios con perfiles y empresas', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              { id: 'u-1', email: 'carlos@empresa.cl', role: 'estudiante', company_id: 'comp-1' },
              { id: 'u-2', email: 'admin@empresa.cl', role: 'admin', company_id: 'comp-1' },
            ],
            error: null,
          }),
        }),
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/users');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0].email).toBe('carlos@empresa.cl');
    });
  });

  describe('PATCH /api/admin/superadmin/users', () => {
    it('debe retornar 400 si falta el userId', async () => {
      const req = new Request('http://localhost:3000/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('ID de usuario es obligatorio');
    });

    it('debe actualizar el rol a admin y sincronizar con auth metadata', async () => {
      // 1. Obtener perfil actual
      // 2. Actualizar profiles
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'u-1', role: 'estudiante', company_id: null },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'u-1', role: 'admin', company_id: null },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockUpdateUserById.mockResolvedValue({ data: {}, error: null });

      const req = new Request('http://localhost:3000/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-1',
          role: 'admin',
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('admin');
      expect(mockUpdateUserById).toHaveBeenCalledWith('u-1', {
        user_metadata: { role: 'admin' },
      });
    });

    it('debe desvincular a un usuario de su empresa cuando unassignCompany es true', async () => {
      let updatedPayload: any = null;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'u-1', role: 'estudiante', company_id: 'comp-100', company_code: 'COMP01' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockImplementation((payload) => {
              updatedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'u-1', role: 'estudiante', company_id: null, company_code: null },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        return {};
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-1',
          unassignCompany: true,
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updatedPayload.company_id).toBeNull();
      expect(updatedPayload.company_code).toBeNull();
    });

    it('debe vincular a un usuario a una nueva empresa obteniendo su código oficial', async () => {
      let updatedPayload: any = null;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'u-2', role: 'estudiante', company_id: null },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockImplementation((payload) => {
              updatedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'u-2', role: 'estudiante', company_id: 'comp-200', company_code: 'MIN001' },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'comp-200', code: 'MIN001', name: 'Minera Cordillera' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-2',
          companyId: 'comp-200',
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updatedPayload.company_id).toBe('comp-200');
      expect(updatedPayload.company_code).toBe('MIN001');
    });
  });
});
