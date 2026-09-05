import { createClient } from '@supabase/supabase-js';

export interface AuditLogParams {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  companyId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, any>;
}

export interface ConsentLogParams {
  userId?: string | null;
  email: string;
  termsVersion?: string;
  privacyVersion?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Registra un evento administrativo o crítico en audit_logs.
 */
export async function recordAuditLog(params: AuditLogParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const tableRef = supabaseAdmin.from('audit_logs');
    if (typeof tableRef?.insert === 'function') {
      const { error } = await tableRef.insert({
        actor_id: params.actorId || null,
        actor_email: params.actorEmail || null,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        company_id: params.companyId || null,
        ip_address: params.ipAddress || null,
        metadata: params.metadata || {}
      });
      if (error) {
        console.error('Error al registrar audit_log:', error);
      }
    }
  } catch (err) {
    console.error('Excepción al registrar audit_log:', err);
  }
}

/**
 * Registra la aceptación de consentimientos legales (Ley 21.719) en consent_audit_logs.
 */
export async function recordConsentAuditLog(params: ConsentLogParams) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const tableRef = supabaseAdmin.from('consent_audit_logs');
    if (typeof tableRef?.insert === 'function') {
      const { error } = await tableRef.insert({
        user_id: params.userId || null,
        email: params.email,
        terms_version: params.termsVersion || 'v1.0-2026',
        privacy_version: params.privacyVersion || 'v1.0-ley-21719',
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null
      });
      if (error) {
        console.error('Error al registrar consent_audit_log:', error);
      }
    }
  } catch (err) {
    console.error('Excepción al registrar consent_audit_log:', err);
  }
}
