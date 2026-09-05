-- ==============================================================================
-- DiaCero — Migración: Cumplimiento Ley 21.719, Multi-Tenancy y Certificados
-- Fecha: 2026-09-04
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: public.companies (Empresas Clientes y Organizaciones)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    code VARCHAR(6) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    business_name TEXT NOT NULL,
    rut TEXT NOT NULL,
    legal_address TEXT NOT NULL,
    business_line TEXT NOT NULL,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT companies_pkey PRIMARY KEY (id)
);

-- Asegurar índice para búsqueda rápida por código de empresa
CREATE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);

-- 2. AMPLIAR TABLA: public.profiles
-- Soportar roles: 'estudiante', 'admin', 'superadmin'
-- Datos sensibles del estudiante: rut, hire_date, company_id, company_code
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS rut TEXT,
    ADD COLUMN IF NOT EXISTS hire_date DATE,
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS company_code VARCHAR(6);

-- Asegurar índices para búsquedas multi-tenant
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company_code ON public.profiles(company_code);
CREATE INDEX IF NOT EXISTS idx_profiles_rut ON public.profiles(rut);

-- 3. TABLA: public.consent_audit_logs (Audit Trail de Consentimientos Ley 21.719)
CREATE TABLE IF NOT EXISTS public.consent_audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    privacy_version TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT consent_audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_logs_user ON public.consent_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_logs_email ON public.consent_audit_logs(email);

-- 4. AMPLIAR TABLA: public.user_progress
-- Trazabilidad de IP y última actividad
ALTER TABLE public.user_progress
    ADD COLUMN IF NOT EXISTS last_ip_address TEXT,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 5. TABLA: public.suppression_requests (Derecho al Olvido / Supresión Ley 21.719)
CREATE TABLE IF NOT EXISTS public.suppression_requests (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    ticket_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    rut TEXT,
    full_name TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT suppression_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_suppression_company_id ON public.suppression_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_suppression_status ON public.suppression_requests(status);
CREATE INDEX IF NOT EXISTS idx_suppression_ticket ON public.suppression_requests(ticket_number);

-- 6. TABLA: public.certificates (Certificados Inmutables Sellados)
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_rut TEXT NOT NULL,
    student_hire_date DATE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    company_rut TEXT NOT NULL,
    company_logo_url TEXT,
    signer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    signer_name TEXT NOT NULL,
    signer_role TEXT NOT NULL,
    module_id TEXT REFERENCES public.modules(id) ON DELETE SET NULL,
    module_title TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 100,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'valid',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT certificates_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_company_id ON public.certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_certificates_module_id ON public.certificates(module_id);

-- 7. TABLA: public.audit_logs (Trazabilidad y Gobernanza de Acciones Sensibles)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ip_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 8. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppression_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Companies
DROP POLICY IF EXISTS "Lectura de empresas activas para autenticados" ON public.companies;
CREATE POLICY "Lectura de empresas activas para autenticados"
ON public.companies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Lectura pública de empresa para validación de código" ON public.companies;
CREATE POLICY "Lectura pública de empresa para validación de código"
ON public.companies FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS "Gestión de empresas para administradores" ON public.companies;
CREATE POLICY "Gestión de empresas para administradores"
ON public.companies FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')));

-- Certificates: lectura pública de certificados válidos (portal de verificación)
DROP POLICY IF EXISTS "Verificación pública de certificados" ON public.certificates;
CREATE POLICY "Verificación pública de certificados"
ON public.certificates FOR SELECT TO anon, authenticated USING (status = 'valid');

-- Suppression requests: creación pública anon y lectura para administradores
DROP POLICY IF EXISTS "Creación pública de solicitudes de supresión" ON public.suppression_requests;
CREATE POLICY "Creación pública de solicitudes de supresión"
ON public.suppression_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de solicitudes de supresión para administradores" ON public.suppression_requests;
CREATE POLICY "Lectura de solicitudes de supresión para administradores"
ON public.suppression_requests FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')));

-- user_progress: permitir a superadministradores y administradores consultar y auditar
DROP POLICY IF EXISTS "Estudiantes pueden ver su propio progreso" ON public.user_progress;
CREATE POLICY "Estudiantes pueden ver su propio progreso"
ON public.user_progress FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')));

DROP POLICY IF EXISTS "Administradores gestionan todo el progreso" ON public.user_progress;
CREATE POLICY "Administradores gestionan todo el progreso"
ON public.user_progress FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')));

-- 9. DATOS SEMILLA: Empresa Piloto "Día Cero Demo" (Código DC2026)
INSERT INTO public.companies (
    id, code, name, business_name, rut, legal_address, business_line, is_active
)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'DC2026',
    'Día Cero Prevención',
    'Día Cero Prevención y Capacitación SpA',
    '76.543.210-K',
    'Av. Apoquindo 4501, Piso 8, Las Condes, Santiago',
    'Servicios de Capacitación y Asesoría en Seguridad Laboral',
    true
)
ON CONFLICT (code) DO NOTHING;

-- Asociar perfiles existentes huérfanos a la empresa demo
UPDATE public.profiles
SET company_id = 'c0000000-0000-0000-0000-000000000001', company_code = 'DC2026'
WHERE company_id IS NULL;
