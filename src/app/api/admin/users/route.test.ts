import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from './route';

const mockCreateUser = vi.fn();
const mockUpdateUserById = vi.fn();
const mockDeleteUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        updateUserById: mockUpdateUserById,
        deleteUser: mockDeleteUser,
      },
    },
    from: mockFrom,
  })),
}));

describe('API Control de Usuarios - /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/users (Alta de Usuario)', () => {
    it('debe retornar 400 si faltan email, password o name', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }), // Sin password ni name
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Faltan datos requeridos');
    });

    it('debe crear el usuario con confirmación automática y guardar en profiles', async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: { id: 'u-123', email: 'juan@empresa.cl' } },
        error: null,
      });

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'juan@empresa.cl',
          password: 'Password123!',
          name: 'Juan Pérez',
          role: 'estudiante',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('dado de alta exitosamente');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'juan@empresa.cl',
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { name: 'Juan Pérez', role: 'estudiante' },
      });
    });

    it('debe retornar 400 si Supabase Auth falla al crear el usuario', async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'A user with this email address has already been registered' },
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'repetido@empresa.cl',
          password: 'Password123!',
          name: 'Usuario Repetido',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already been registered');
    });
  });

  describe('PATCH /api/admin/users (Actualizar Contraseña o Rol)', () => {
    it('debe retornar 400 si falta userId', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'NewPassword123' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Falta el parámetro userId requerido');
    });

    it('debe validar que la contraseña tenga al menos 6 caracteres', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u-123', newPassword: '123' }), // Demasiado corta
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('al menos 6 caracteres');
    });

    it('debe rechazar roles inválidos', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u-123', newRole: 'superhacker' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Rol no válido');
    });

    it('debe impedir degradar el rol de la cuenta raíz admin@diacero.com', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { email: 'admin@diacero.com' },
              error: null,
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin-root', newRole: 'estudiante' }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('No está permitido degradar el rol de la cuenta principal');
    });

    it('debe actualizar contraseña y rol con éxito', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { email: 'otro@diacero.com' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      mockUpdateUserById.mockResolvedValue({ error: null });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-456',
          newPassword: 'NuevaClaveValida123',
          newRole: 'admin',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdateUserById).toHaveBeenCalledWith('u-456', {
        password: 'NuevaClaveValida123',
      });
    });

    it('debe actualizar la fecha de contratacion (hireDate) con éxito', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { hire_date: '2024-01-01', email: 'alumno@empresa.cl' },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-789',
          hireDate: '2025-06-15',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        hire_date: '2025-06-15',
      });
    });

    it('debe actualizar el rut con formato chileno válido con éxito', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { rut: '11.111.111-1', email: 'alumno@empresa.cl' },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-789',
          rut: '12345678-5', // Rut válido módulo 11
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        rut: '12.345.678-5',
      });
    });

    it('debe actualizar el nombre de usuario (name) con éxito', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { name: 'Nombre Antiguo', email: 'alumno@empresa.cl' },
                  error: null,
                }),
              }),
            }),
            update: mockUpdate,
          };
        }
        return {};
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-101',
          name: 'Nombre Corregido Pérez',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Nombre Corregido Pérez',
      });
      expect(mockUpdateUserById).toHaveBeenCalledWith('u-101', {
        user_metadata: { name: 'Nombre Corregido Pérez' },
      });
    });
  });

  describe('DELETE /api/admin/users (Baja de Usuario)', () => {
    it('debe retornar 400 si falta userId', async () => {
      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Falta userId requerido');
    });

    it('debe impedir eliminar a la cuenta raíz admin@diacero.com', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { email: 'admin@diacero.com', role: 'admin' },
              error: null,
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin-root' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('No está permitido eliminar la cuenta principal de Administrador');
    });

    it('debe eliminar progreso, perfil y usuario de Auth correctamente', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { email: 'alumno@faena.cl', role: 'estudiante' },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
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
        return {};
      });

      mockDeleteUser.mockResolvedValue({ error: null });

      const request = new Request('http://localhost:3000/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'u-eliminar-1' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Alumno eliminado exitosamente');
      expect(mockDeleteUser).toHaveBeenCalledWith('u-eliminar-1');
    });
  });

  describe('GET /api/admin/users (Consulta de Usuarios, Progreso y Módulos)', () => {
    it('debe retornar módulos, perfiles y datos de progreso', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'modules') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'mod-1', title: 'Seguridad' }],
              error: null,
            }),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'user-1', name: 'Alumno 1', role: 'estudiante' }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ user_id: 'user-1', module_id: 'mod-1', completed_sections: ['sec-1'] }],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const request = new Request('http://localhost:3000/api/admin/users?companyId=comp-123', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.modules).toHaveLength(1);
      expect(data.users).toHaveLength(1);
      expect(data.progressData).toHaveLength(1);
      expect(data.progressData[0].user_id).toBe('user-1');
    });
  });
});
