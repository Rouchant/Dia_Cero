/**
 * Utility for generating and verifying deterministic, tamper-proof Certificate IDs (e.g. DC-A8F92B4C).
 * Based on user_id, module_id, and system salt.
 */

export function generateCertId(userId: string, moduleId: string): string {
  if (!userId || !moduleId) return 'DC-INVALID';
  
  const salt = 'diacero_cert_security_v1';
  const str = `${salt}_${userId.trim().toLowerCase()}_${moduleId.trim().toLowerCase()}`;
  
  let hash1 = 5381;
  let hash2 = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }

  const combined = (Math.abs(hash1 ^ hash2) >>> 0).toString(16).toUpperCase();
  const certIdCode = combined.padStart(8, '0').substring(0, 8);
  
  return `DC-${certIdCode}`;
}

export function matchesCertId(certId: string, userId: string, moduleId: string): boolean {
  if (!certId) return false;
  const target = certId.trim().toUpperCase().replace(/^ID-/, '').replace(/^DC-/, '');
  const expected = generateCertId(userId, moduleId).replace(/^DC-/, '');
  return target === expected;
}
