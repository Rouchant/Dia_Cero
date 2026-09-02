import { describe, it, expect } from 'vitest';
import { 
  generateCertId, 
  matchesCertId, 
  createSignedCertId, 
  verifySignedCertId,
  CertPayload
} from './cert-hash';

describe('Módulo de Validación y Firma QR de Certificados (cert-hash)', () => {
  const samplePayload: CertPayload = {
    student: 'Juan Pérez',
    moduleTitle: 'Seguridad en Trabajos en Altura - Nivel 1',
    score: 100,
    date: '1 de Septiembre de 2026',
    userId: 'usr_8f9a2b',
    moduleId: 'mod_alturas_v1'
  };

  it('Escenario 1: Genera y verifica exitosamente un token de certificado firmado por QR (Mejor Caso)', () => {
    // 1. Generar token firmado (Sello Electrónico QR)
    const token = createSignedCertId(samplePayload);
    expect(token).toBeDefined();
    expect(token).toMatch(/^DC-[A-Za-z0-9_-]+\.[0-9A-F]{8}$/);

    // 2. Verificar token
    const result = verifySignedCertId(token);
    expect(result.isValid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.student).toBe('Juan Pérez');
    expect(result.data?.moduleTitle).toBe('Seguridad en Trabajos en Altura - Nivel 1');
    expect(result.data?.score).toBe(100);
    expect(result.data?.date).toBe('1 de Septiembre de 2026');
    expect(result.data?.userId).toBe('usr_8f9a2b');
    expect(result.data?.moduleId).toBe('mod_alturas_v1');
  });

  it('Escenario 2: Rechaza certificados adulterados o con firma digital inválida (Caso de Error / Tampering)', () => {
    const validToken = createSignedCertId(samplePayload);
    
    // Simular adulteración del payload base64 o de la firma HMAC
    const parts = validToken.split('.');
    const tamperedSignatureToken = `${parts[0]}.FFFFFFFF`;

    const resultTampered = verifySignedCertId(tamperedSignatureToken);
    expect(resultTampered.isValid).toBe(false);
    expect(resultTampered.data).toBeUndefined();

    // Simular token malformado o vacío
    expect(verifySignedCertId('').isValid).toBe(false);
    expect(verifySignedCertId('DC-INVALID-FORMAT').isValid).toBe(false);
  });

  it('Escenario 3: Genera e identifica correctamente hashes deterministas para búsqueda en BD (MatchesCertId)', () => {
    const userId = 'usr_8f9a2b';
    const moduleId = 'mod_alturas_v1';

    // Generar Hash determinista
    const certId = generateCertId(userId, moduleId);
    expect(certId).toMatch(/^DC-[0-9A-F]{8}$/);

    // Verificar coincidencia exacta
    const isMatch = matchesCertId(certId, userId, moduleId);
    expect(isMatch).toBe(true);

    // Verificar rechazo con userId o moduleId incorrectos
    const wrongUserMatch = matchesCertId(certId, 'usr_hacker', moduleId);
    expect(wrongUserMatch).toBe(false);

    const wrongModuleMatch = matchesCertId(certId, userId, 'mod_otro');
    expect(wrongModuleMatch).toBe(false);
  });
});
