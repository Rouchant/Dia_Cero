import { describe, it, expect } from 'vitest';
import { cleanRut, calculateDv, validateRut, formatRut } from './rut';

describe('Utilidades de RUT Chileno (Módulo 11)', () => {
  describe('cleanRut', () => {
    it('elimina puntos, guiones y espacios', () => {
      expect(cleanRut(' 12.345.678-K ')).toBe('12345678K');
      expect(cleanRut('11.111.111-1')).toBe('111111111');
      expect(cleanRut('76.123.456-0')).toBe('761234560');
    });

    it('maneja strings vacíos o no strings', () => {
      expect(cleanRut('')).toBe('');
      // @ts-ignore
      expect(cleanRut(null)).toBe('');
    });
  });

  describe('calculateDv', () => {
    it('calcula correctamente dígitos verificadores conocidos', () => {
      // 11.111.111 -> 1
      expect(calculateDv('11111111')).toBe('1');
      // 76.123.456 -> 0
      expect(calculateDv('76123456')).toBe('0');
      // Casos con 'K'
      // 17.584.298 -> K (comprobemos sum: 1*3 + 7*2 + 5*7 + 8*6 + 4*5 + 2*4 + 9*3 + 8*2)
      // 3 + 14 + 35 + 48 + 20 + 8 + 27 + 16 = 171 % 11 = 6 -> 11-6 = 5 (no es K)
      // Probemos calcular el DV de un número y verificar consistencia:
      const body = '18999888';
      const dv = calculateDv(body);
      expect(validateRut(`${body}-${dv}`)).toBe(true);
    });

    it('devuelve K cuando el resto es 10', () => {
      // 12.345.678-5 -> calculemos un RUT con K: 15.345.678-?
      // Busquemos un body cuyo dv sea K:
      let foundK = '';
      for (let b = 10000000; b < 10000020; b++) {
        if (calculateDv(b) === 'K') {
          foundK = b.toString();
          break;
        }
      }
      expect(foundK.length).toBeGreaterThan(0);
      expect(calculateDv(foundK)).toBe('K');
      expect(validateRut(`${foundK}-K`)).toBe(true);
      expect(validateRut(`${foundK}-k`)).toBe(true);
    });
  });

  describe('validateRut', () => {
    it('valida RUTs reales chilenos válidos en distintos formatos', () => {
      expect(validateRut('11.111.111-1')).toBe(true);
      expect(validateRut('11111111-1')).toBe(true);
      expect(validateRut('111111111')).toBe(true);
      expect(validateRut('76.123.456-0')).toBe(true);
      expect(validateRut('761234560')).toBe(true);
    });

    it('rechaza RUTs con dígito verificador incorrecto', () => {
      expect(validateRut('11.111.111-2')).toBe(false);
      expect(validateRut('76.123.456-9')).toBe(false);
      expect(validateRut('12345678-0')).toBe(false);
    });

    it('rechaza inputs inválidos, malformados o vacíos', () => {
      expect(validateRut('')).toBe(false);
      expect(validateRut('abc')).toBe(false);
      expect(validateRut('1-9')).toBe(false);
      // @ts-ignore
      expect(validateRut(null)).toBe(false);
      expect(validateRut('12.345.678-Z')).toBe(false);
    });
  });

  describe('formatRut', () => {
    it('formatea correctamente con puntos y guion', () => {
      expect(formatRut('111111111')).toBe('11.111.111-1');
      expect(formatRut('761234560')).toBe('76.123.456-0');
      expect(formatRut('12345678k')).toBe('12.345.678-K');
    });

    it('maneja strings vacíos', () => {
      expect(formatRut('')).toBe('');
    });
  });
});
