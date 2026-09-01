/**
 * Utility for generating and verifying deterministic and signed tamper-proof Certificate IDs.
 */

const SYSTEM_SALT = 'diacero_cert_security_v1';

export interface CertPayload {
  student: string;
  moduleTitle: string;
  score: number;
  date: string;
  userId?: string;
  moduleId?: string;
}

export function generateCertId(userId: string, moduleId: string): string {
  if (!userId || !moduleId) return 'DC-INVALID';
  
  const str = `${SYSTEM_SALT}_${userId.trim().toLowerCase()}_${moduleId.trim().toLowerCase()}`;
  
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

function computeSignature(base64Data: string): string {
  const str = `${SYSTEM_SALT}:${base64Data}`;
  let hash1 = 5381;
  let hash2 = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }

  const combined = (Math.abs(hash1 ^ hash2) >>> 0).toString(16).toUpperCase();
  return combined.padStart(8, '0').substring(0, 8);
}

function base64UrlEncode(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(encodeURIComponent(str))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(str).toString('base64url');
}

function base64UrlDecode(str: string): string {
  if (typeof atob === 'function') {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(atob(base64));
  }
  return Buffer.from(str, 'base64url').toString('utf8');
}

export function createSignedCertId(payload: CertPayload): string {
  const minified = {
    s: payload.student,
    m: payload.moduleTitle,
    sc: payload.score,
    d: payload.date,
    u: payload.userId || '',
    mod: payload.moduleId || ''
  };
  const jsonStr = JSON.stringify(minified);
  const base64Data = base64UrlEncode(jsonStr);
  const signature = computeSignature(base64Data);
  return `DC-${base64Data}.${signature}`;
}

export function verifySignedCertId(certId: string): { isValid: boolean; data?: CertPayload } {
  if (!certId) return { isValid: false };
  
  const cleanId = certId.trim().replace(/^ID-/, '').replace(/^DC-/, '');
  const parts = cleanId.split('.');
  
  if (parts.length !== 2) return { isValid: false };
  
  const [base64Data, providedSignature] = parts;
  const expectedSignature = computeSignature(base64Data);
  
  if (providedSignature.toUpperCase() !== expectedSignature.toUpperCase()) {
    return { isValid: false }; // Signature invalid or tampered!
  }
  
  try {
    const jsonStr = base64UrlDecode(base64Data);
    const minified = JSON.parse(jsonStr);
    
    return {
      isValid: true,
      data: {
        student: minified.s,
        moduleTitle: minified.m,
        score: minified.sc,
        date: minified.d,
        userId: minified.u,
        moduleId: minified.mod
      }
    };
  } catch (e) {
    return { isValid: false };
  }
}

