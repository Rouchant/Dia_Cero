import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from './route';

const mockCreateUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
      },
    },
    from: mockFrom,
  })),
}));

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe('API Superadmin Empresas - /api/admin/superadmin/companies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/superadmin/companies', () => {
    it('debe listar empresas y enriquecerlas con el conteo de estudiantes y administradores', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: 'comp-1', name: 'Minera Los Andes', code: 'AND001' },
                  { id: 'comp-2', name: 'Tech Solutions', code: 'TECH01' },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: 'u-1', name: 'Juan Admin', role: 'admin', company_id: 'comp-1' },
                { id: 'u-2', name: 'Pedro Alumno', role: 'estudiante', company_id: 'comp-1' },
                { id: 'u-3', name: 'Ana Admin', role: 'admin', company_id: 'comp-2' },
              ],
              error: null,
            }),
          };
        }
        return {};
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/companies');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.companies).toHaveLength(2);
      expect(data.companies[0].totalAdmins).toBe(1);
      expect(data.companies[0].totalStudents).toBe(1);
      expect(data.companies[0].totalUsers).toBe(2);
      expect(data.companies[1].totalAdmins).toBe(1);
      expect(data.companies[1].totalStudents).toBe(0);
    });
  });

  describe('POST /api/admin/superadmin/companies', () => {
    it('debe rechazar con 400 si faltan campos obligatorios', async () => {
      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Empresa Incompleta' }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('requeridos');
    });

    it('debe rechazar con 400 si el código no tiene 6 caracteres', async () => {
      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Empresa',
          businessName: 'Empresa SpA',
          rut: '76.123.456-0',
          legalAddress: 'Av Providencia 123',
          businessLine: 'Minería',
          code: 'CORTO', // 5 caracteres
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('6 caracteres');
    });

    it('debe rechazar con 400 si el RUT de la empresa es inválido', async () => {
      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Empresa',
          businessName: 'Empresa SpA',
          rut: '12.345.678-9', // Inválido según módulo 11
          legalAddress: 'Av Providencia 123',
          businessLine: 'Minería',
          code: 'EMP001',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('RUT de la empresa no es válido');
    });

    it('debe registrar exitosamente la empresa y su primer encargado', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'comp-new',
                    name: 'Constructora Austral',
                    code: 'AUS001',
                    rut: '76.123.456-0',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      mockCreateUser.mockResolvedValue({
        data: { user: { id: 'admin-123', email: 'admin@austral.cl' } },
        error: null,
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Constructora Austral',
          businessName: 'Constructora Austral SpA',
          rut: '76.123.456-0',
          legalAddress: 'Santiago Centro 450',
          businessLine: 'Construcción',
          code: 'aus001',
          adminName: 'Rodrigo Gerente',
          adminEmail: 'admin@austral.cl',
          adminRut: '18.123.456-4',
          adminPassword: 'Password123!',
        }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.company.code).toBe('AUS001');
      expect(data.company.name).toBe('Constructora Austral');
      expect(mockCreateUser).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/admin/superadmin/companies', () => {
    it('debe actualizar campos de la empresa y sincronizar perfiles si cambia el código', async () => {
      let updatedCompanyPayload: any = null;
      let updatedProfilesCode: any = null;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatedCompanyPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: 'comp-1',
                        name: 'Minera Los Andes Renovada',
                        code: 'AND002',
                        is_active: true,
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          };
        }
        if (table === 'profiles') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatedProfilesCode = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {};
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'comp-1',
          name: 'Minera Los Andes Renovada',
          code: 'and002',
          legalAddress: 'Nueva dirección 999',
          isActive: true,
        }),
      });

      const res = await PATCH(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(updatedCompanyPayload.code).toBe('AND002');
      expect(updatedCompanyPayload.name).toBe('Minera Los Andes Renovada');
      expect(updatedProfilesCode.company_code).toBe('AND002');
    });
  });

  describe('DELETE /api/admin/superadmin/companies', () => {
    it('debe dar de baja operativa a una empresa (is_active: false)', async () => {
      let deactPayload: any = null;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'comp-1', name: 'Empresa Inactiva', code: 'INA001' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockImplementation((payload) => {
              deactPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'comp-1', is_active: false },
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

      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'comp-1',
          hardDelete: false,
        }),
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(deactPayload.is_active).toBe(false);
    });

    it('debe desvincular perfiles y eliminar definitivamente a la empresa en hardDelete', async () => {
      let unlinkedProfiles: any = null;
      let deleteCalled = false;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'comp-del', name: 'Empresa a Borrar', code: 'DEL001' },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation(() => {
                deleteCalled = true;
                return Promise.resolve({ error: null });
              }),
            }),
          };
        }
        if (table === 'profiles') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              unlinkedProfiles = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }
        return {};
      });

      const req = new Request('http://localhost:3000/api/admin/superadmin/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: 'comp-del',
          hardDelete: true,
        }),
      });

      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(unlinkedProfiles.company_id).toBeNull();
      expect(unlinkedProfiles.company_code).toBeNull();
      expect(deleteCalled).toBe(true);
    });
  });
});
