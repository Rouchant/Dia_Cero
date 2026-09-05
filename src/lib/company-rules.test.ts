import { describe, it, expect } from 'vitest';
import { validateRut, formatRut } from './rut';

describe('Reglas de Negocio Multi-Tenant y Seguridad Corporativa', () => {
  describe('Validación de Códigos de Empresa', () => {
    const isValidCompanyCode = (code: string) => {
      if (!code || typeof code !== 'string') return false;
      const clean = code.trim().toUpperCase();
      return clean.length === 6 && /^[A-Z0-9]{6}$/.test(clean);
    };

    it('acepta códigos alfanuméricos de exactamente 6 caracteres', () => {
      expect(isValidCompanyCode('DC2026')).toBe(true);
      expect(isValidCompanyCode('MINERA')).toBe(true);
      expect(isValidCompanyCode('ACME01')).toBe(true);
    });

    it('rechaza códigos con longitud distinta a 6 caracteres', () => {
      expect(isValidCompanyCode('DC202')).toBe(false);
      expect(isValidCompanyCode('DC20267')).toBe(false);
      expect(isValidCompanyCode('')).toBe(false);
    });

    it('rechaza códigos con caracteres especiales no permitidos', () => {
      expect(isValidCompanyCode('DC-202')).toBe(false);
      expect(isValidCompanyCode('DC 206')).toBe(false);
    });
  });

  describe('Regla de Seguridad: Último Encargado Activo', () => {
    const canDemoteOrDeleteAdmin = (
      adminsInCompany: { id: string; role: string }[],
      targetAdminId: string
    ) => {
      const activeAdmins = adminsInCompany.filter(a => a.role === 'admin' || a.role === 'superadmin');
      if (activeAdmins.length <= 1) {
        return {
          allowed: false,
          error: 'No está permitido eliminar o degradar al último encargado activo de la organización.'
        };
      }
      return { allowed: true };
    };

    it('bloquea la eliminación si solo queda 1 administrador activo', () => {
      const admins = [{ id: 'admin-1', role: 'admin' }];
      const res = canDemoteOrDeleteAdmin(admins, 'admin-1');
      expect(res.allowed).toBe(false);
      expect(res.error).toContain('último encargado activo');
    });

    it('permite la eliminación si quedan 2 o más administradores en la empresa', () => {
      const admins = [
        { id: 'admin-1', role: 'admin' },
        { id: 'admin-2', role: 'admin' }
      ];
      const res = canDemoteOrDeleteAdmin(admins, 'admin-1');
      expect(res.allowed).toBe(true);
    });
  });

  describe('Detección de Estudiantes Inactivos / Sin Progreso', () => {
    const isStalledStudent = (
      hasAssignedModules: boolean,
      overallProgress: number,
      lastActiveDate: Date | null,
      daysThreshold: number = 7
    ) => {
      if (!hasAssignedModules) return false;
      // 0% de avance con módulos asignados es alerta inmediata
      if (overallProgress === 0) return true;

      // Inactividad temporal
      if (!lastActiveDate) return true;
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= daysThreshold;
    };

    it('marca en alerta a estudiantes con cursos asignados pero 0% de avance', () => {
      expect(isStalledStudent(true, 0, new Date())).toBe(true);
    });

    it('no marca en alerta si no tiene cursos asignados', () => {
      expect(isStalledStudent(false, 0, null)).toBe(false);
    });

    it('marca en alerta a estudiantes con actividad hace más de 7 días', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(isStalledStudent(true, 50, tenDaysAgo, 7)).toBe(true);
    });

    it('no marca en alerta a estudiantes con avance reciente dentro del umbral', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(isStalledStudent(true, 50, twoDaysAgo, 7)).toBe(false);
    });
  });
});
