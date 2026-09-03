import { describe, it, expect } from 'vitest';
import {
  generateCertId,
  matchesCertId,
  createSignedCertId,
  verifySignedCertId,
  CertPayload,
} from './cert-hash';

describe('Suite de Métricas: Cálculo de Avance, Avance Promedio y Cohortes', () => {
  // Lógica pura de cálculo de progreso por módulo
  const computeModuleProgress = (completedSections: string[], totalSections: number) => {
    const safeTotal = Math.max(1, totalSections);
    const completedCount = completedSections?.length || 0;
    const percentage = Math.min(100, Math.round((completedCount / safeTotal) * 100));
    return {
      completedCount,
      totalSections: safeTotal,
      percentage,
      isCompleted: percentage === 100,
    };
  };

  // Lógica de cálculo de avance global por estudiante
  const computeStudentOverallProgress = (
    moduleProgresses: { percentage: number; isAssigned: boolean }[]
  ) => {
    const assigned = moduleProgresses.filter(m => m.isAssigned);
    if (assigned.length === 0) return 0;
    const total = assigned.reduce((sum, m) => sum + m.percentage, 0);
    return Math.round(total / assigned.length);
  };

  // Lógica de métricas agregadas de cohorte (usada en AdminStatsCards)
  const computeCohortMetrics = (
    students: { id: string; progress_percentage: number }[]
  ) => {
    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        averageProgress: 0,
        completedStudents: 0,
        completionRate: 0,
      };
    }

    const completedStudents = students.filter(s => s.progress_percentage === 100).length;
    const sumProgress = students.reduce((acc, s) => acc + (s.progress_percentage || 0), 0);
    const averageProgress = Math.round(sumProgress / totalStudents);
    const completionRate = Math.round((completedStudents / totalStudents) * 100);

    return {
      totalStudents,
      averageProgress,
      completedStudents,
      completionRate,
    };
  };

  describe('1. Avance Individual por Módulo', () => {
    it('calcula 0% de avance si no hay secciones completadas', () => {
      const res = computeModuleProgress([], 10);
      expect(res.percentage).toBe(0);
      expect(res.isCompleted).toBe(false);
    });

    it('calcula porcentaje exacto proporcional a las secciones completadas', () => {
      // 3 secciones completadas de 4 = 75%
      const res1 = computeModuleProgress(['sec-1', 'sec-2', 'sec-3'], 4);
      expect(res1.percentage).toBe(75);
      expect(res1.isCompleted).toBe(false);

      // 1 de 3 secciones = 33%
      const res2 = computeModuleProgress(['sec-1'], 3);
      expect(res2.percentage).toBe(33);
      expect(res2.isCompleted).toBe(false);
    });

    it('marca isCompleted en true exactamente al llegar al 100%', () => {
      const res = computeModuleProgress(['sec-1', 'sec-2'], 2);
      expect(res.percentage).toBe(100);
      expect(res.isCompleted).toBe(true);
    });

    it('limita el porcentaje al 100% y previene desbordes si hay secciones huérfanas', () => {
      const res = computeModuleProgress(['s-1', 's-2', 's-3', 's-4'], 3);
      expect(res.percentage).toBe(100);
      expect(res.isCompleted).toBe(true);
    });

    it('maneja módulos sin secciones sin producir división por cero (NaN)', () => {
      const res = computeModuleProgress([], 0);
      expect(res.percentage).toBe(0);
      expect(Number.isNaN(res.percentage)).toBe(false);
    });
  });

  describe('2. Avance Promedio del Estudiante (Multi-módulo)', () => {
    it('calcula el promedio de avance exacto entre los módulos asignados', () => {
      const modules = [
        { percentage: 100, isAssigned: true },
        { percentage: 50, isAssigned: true },
      ];
      // Promedio: (100 + 50) / 2 = 75%
      expect(computeStudentOverallProgress(modules)).toBe(75);
    });

    it('ignora módulos no asignados al calcular el promedio', () => {
      const modules = [
        { percentage: 100, isAssigned: true },
        { percentage: 0, isAssigned: false }, // No asignado, no debe promediar
      ];
      expect(computeStudentOverallProgress(modules)).toBe(100);
    });

    it('retorna 0% si el estudiante no tiene módulos asignados', () => {
      expect(computeStudentOverallProgress([])).toBe(0);
      expect(computeStudentOverallProgress([{ percentage: 0, isAssigned: false }])).toBe(0);
    });
  });

  describe('3. Métricas de Cohorte y Avance Promedio Global (AdminStatsCards)', () => {
    it('calcula métricas correctas de cohorte para una nómina con avances diversos', () => {
      const students = [
        { id: 'u-1', progress_percentage: 100 }, // Graduado
        { id: 'u-2', progress_percentage: 100 }, // Graduado
        { id: 'u-3', progress_percentage: 50 },  // En curso
        { id: 'u-4', progress_percentage: 0 },   // Recién iniciado
      ];

      const stats = computeCohortMetrics(students);

      expect(stats.totalStudents).toBe(4);
      expect(stats.completedStudents).toBe(2);
      // Promedio: (100 + 100 + 50 + 0) / 4 = 250 / 4 = 62.5 -> 63%
      expect(stats.averageProgress).toBe(63);
      // Tasa de completitud: 2 / 4 = 50%
      expect(stats.completionRate).toBe(50);
    });

    it('maneja de forma segura una nómina vacía (0 alumnos)', () => {
      const stats = computeCohortMetrics([]);

      expect(stats.totalStudents).toBe(0);
      expect(stats.averageProgress).toBe(0);
      expect(stats.completedStudents).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(Number.isNaN(stats.averageProgress)).toBe(false);
    });
  });
});

describe('Suite de Certificados: Elegibilidad, Folios y Validación Criptográfica', () => {
  // Lógica de validación de elegibilidad para emisión de certificado
  const checkCertificateEligibility = (progressPercentage: number) => {
    return {
      canIssueCertificate: progressPercentage === 100,
      reason: progressPercentage === 100
        ? 'Aprobado: El estudiante ha completado el 100% de los contenidos y evaluaciones'
        : `Pendiente: El alumno registra un ${progressPercentage}% de avance (requiere 100% para certificación)`,
    };
  };

  describe('1. Criterio de Elegibilidad para Certificación', () => {
    it('concede certificado únicamente cuando el avance es exactamente 100%', () => {
      const res = checkCertificateEligibility(100);
      expect(res.canIssueCertificate).toBe(true);
      expect(res.reason).toContain('Aprobado');
    });

    it('deniega certificado si el avance es menor al 100% (ej. 99% o 75%)', () => {
      const res99 = checkCertificateEligibility(99);
      expect(res99.canIssueCertificate).toBe(false);
      expect(res99.reason).toContain('requiere 100%');

      const res75 = checkCertificateEligibility(75);
      expect(res75.canIssueCertificate).toBe(false);
    });
  });

  describe('2. Generación de Folios Únicos (generateCertId)', () => {
    it('genera un folio con prefijo normativo DC- y 8 caracteres hexadecimales', () => {
      const certId = generateCertId('user-12345', 'mod-seguridad-minera');
      expect(certId).toMatch(/^DC-[0-9A-F]{8}$/);
    });

    it('es determinista: genera exactamente el mismo folio para los mismos argumentos', () => {
      const cert1 = generateCertId('u-test-99', 'mod-ley-16744');
      const cert2 = generateCertId('u-test-99', 'mod-ley-16744');
      expect(cert1).toBe(cert2);
    });

    it('genera folios distintos para distintos usuarios en el mismo módulo', () => {
      const certUserA = generateCertId('alumno-a', 'mod-ley-16744');
      const certUserB = generateCertId('alumno-b', 'mod-ley-16744');
      expect(certUserA).not.toBe(certUserB);
    });

    it('genera folios distintos para el mismo usuario en distintos módulos', () => {
      const certMod1 = generateCertId('alumno-a', 'modulo-1');
      const certMod2 = generateCertId('alumno-a', 'modulo-2');
      expect(certMod1).not.toBe(certMod2);
    });

    it('retorna DC-INVALID si falta userId o moduleId', () => {
      expect(generateCertId('', 'mod-1')).toBe('DC-INVALID');
      expect(generateCertId('u-1', '')).toBe('DC-INVALID');
      expect(generateCertId('', '')).toBe('DC-INVALID');
    });
  });

  describe('3. Verificación de Folio (matchesCertId)', () => {
    it('valida con éxito la coincidencia del folio con o sin prefijo DC-', () => {
      const generated = generateCertId('usr-valido', 'mod-valido');
      expect(matchesCertId(generated, 'usr-valido', 'mod-valido')).toBe(true);

      // Con prefijo ID- alternativo
      const altPrefixed = generated.replace('DC-', 'ID-');
      expect(matchesCertId(altPrefixed, 'usr-valido', 'mod-valido')).toBe(true);
    });

    it('rechaza folios que no corresponden al par usuario-módulo', () => {
      const certDeJuan = generateCertId('juan-perez', 'mod-1');
      expect(matchesCertId(certDeJuan, 'carlos-gomez', 'mod-1')).toBe(false);
    });
  });

  describe('4. Firma Digital y Sello QR (createSignedCertId / verifySignedCertId)', () => {
    const payload: CertPayload = {
      student: 'María González',
      moduleTitle: 'Prevención de Riesgos en Minería Subterránea',
      score: 100,
      date: '3 de Septiembre de 2026',
      userId: 'usr-maria-01',
      moduleId: 'mod-mineria-01',
    };

    it('genera un certificado firmado verificable que conserva todos los metadatos', () => {
      const signedToken = createSignedCertId(payload);
      expect(signedToken).toMatch(/^DC-[A-Za-z0-9_-]+\.[0-9A-F]{8}$/);

      const verification = verifySignedCertId(signedToken);
      expect(verification.isValid).toBe(true);
      expect(verification.data?.student).toBe('María González');
      expect(verification.data?.score).toBe(100);
      expect(verification.data?.moduleTitle).toBe('Prevención de Riesgos en Minería Subterránea');
      expect(verification.data?.userId).toBe('usr-maria-01');
    });

    it('detecta y rechaza de inmediato certificados con firma adulterada', () => {
      const signedToken = createSignedCertId(payload);
      const parts = signedToken.split('.');
      const adulteratedToken = `${parts[0]}.12345678`; // Firma falsa

      const result = verifySignedCertId(adulteratedToken);
      expect(result.isValid).toBe(false);
      expect(result.data).toBeUndefined();
    });

    it('rechaza tokens malformados o vacíos', () => {
      expect(verifySignedCertId('')).toEqual({ isValid: false });
      expect(verifySignedCertId('DC-tokenSinPuntoNiFirma')).toEqual({ isValid: false });
      expect(verifySignedCertId('DC-parte1.parte2.parte3')).toEqual({ isValid: false });
    });
  });
});
