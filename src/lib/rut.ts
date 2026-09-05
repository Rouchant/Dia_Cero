/**
 * Utilidad de validación y formateo de RUT Chileno (Algoritmo Módulo 11)
 * Ley 21.719 y normativa chilena de identificación.
 */

/**
 * Limpia un RUT eliminando puntos, guiones y espacios en blanco.
 * Convierte el dígito verificador a mayúscula.
 */
export function cleanRut(rut: string): string {
  if (typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador oficial mediante el algoritmo de Módulo 11.
 */
export function calculateDv(body: number | string): string {
  const cleanBody = typeof body === 'number' ? body.toString() : cleanRut(body);
  let sum = 0;
  let multiplier = 2;

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

/**
 * Valida si un RUT chileno es válido según el algoritmo de Módulo 11.
 * Admite formatos con o sin puntos y con o sin guión.
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;

  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // El cuerpo debe contener únicamente dígitos numéricos
  if (!/^\d+$/.test(body)) {
    return false;
  }

  // Prevenir RUTs evidentemente inválidos (cuerpos menores a 100.000)
  const numericBody = parseInt(body, 10);
  if (numericBody < 100000) {
    return false;
  }

  return calculateDv(body) === dv;
}

/**
 * Formatea un RUT al estándar chileno: XX.XXX.XXX-X
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return '';

  if (cleaned.length === 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Formatear cuerpo con puntos de miles
  let formattedBody = '';
  let count = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    formattedBody = body.charAt(i) + formattedBody;
    count++;
    if (count === 3 && i > 0) {
      formattedBody = '.' + formattedBody;
      count = 0;
    }
  }

  return `${formattedBody}-${dv}`;
}
