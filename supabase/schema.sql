-- ==============================================================================
-- DiaCero — Script de Creación de Base de Datos (Supabase / PostgreSQL)
-- ==============================================================================
-- Este script crea todas las tablas, relaciones, políticas de seguridad (RLS),
-- triggers automáticos y datos semilla necesarios para la plataforma.
-- ==============================================================================

-- 1. Extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: profiles (Perfiles de usuario sincronizados con auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de perfiles para usuarios autenticados"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Acceso total para service_role y administradores"
ON public.profiles FOR ALL
TO authenticated
USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 3. TRIGGER: Sincronización automática al registrar usuario en Supabase Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABLA: modules (Módulos de capacitación y mallas normativas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Módulos visibles para todos los usuarios autenticados"
ON public.modules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestión de módulos reservada para administradores"
ON public.modules FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 5. TABLA: module_sections (Diapositivas teóricas y contenedor del quiz)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.module_sections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'content', -- 'content' | 'quiz'
    content TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    image_url TEXT,
    ai_summary TEXT,
    ai_explanation TEXT,
    ai_analogy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en module_sections
ALTER TABLE public.module_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secciones visibles para usuarios autenticados"
ON public.module_sections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestión de secciones reservada para administradores"
ON public.module_sections FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 6. TABLA: quiz_questions (Banco de preguntas de opción múltiple para exámenes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    section_id TEXT NOT NULL REFERENCES public.module_sections(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de 4 opciones ["A", "B", "C", "D"]
    correct_answer INTEGER NOT NULL DEFAULT 0,  -- Índice de la opción correcta (0, 1, 2, 3)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en quiz_questions
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preguntas visibles para usuarios autenticados"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestión de preguntas reservada para administradores"
ON public.quiz_questions FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 7. TABLA: user_progress (Avance de estudiantes, notas y certificaciones)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    completed_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    quiz_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    current_section_index INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    score NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);

-- Habilitar RLS en user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiantes pueden ver su propio progreso"
ON public.user_progress FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Estudiantes pueden registrar y actualizar su progreso"
ON public.user_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Estudiantes pueden actualizar sus avances"
ON public.user_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Administradores pueden gestionar todo el progreso"
ON public.user_progress FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 8. DATOS SEMILLA (Seed Data) — Módulo Piloto Inicial
-- ==============================================================================
INSERT INTO public.modules (id, title, description)
VALUES (
    'mod-1',
    'Módulo Piloto: Seguridad Laboral (Ley 16.744)',
    'Capacitación inicial obligatoria sobre prevención de riesgos laborales y normativas de seguridad ocupacional en Chile.'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title, description = EXCLUDED.description;

-- Diapositivas teóricas iniciales
INSERT INTO public.module_sections (id, module_id, title, type, content, sort_order)
VALUES 
(
    'sec-1-1',
    'mod-1',
    'Conceptos Fundamentales de Prevención',
    'content',
    'La **Ley 16.744** establece normas sobre accidentes del trabajo y enfermedades profesionales en Chile. Su objetivo es otorgar cobertura médica integral y preventiva a todos los trabajadores del país.',
    0
),
(
    'sec-1-2',
    'mod-1',
    'Identificación de Peligros Comunes',
    'content',
    'En toda faena es indispensable realizar la identificación de riesgos antes de iniciar cualquier labor.

1. Inspeccionar el entorno inmediato de trabajo.
2. Comprobar el estado y uso correcto de los Elementos de Protección Personal (EPP).
3. Reportar oportunamente condiciones subestándar.',
    1
),
(
    'sec-1-3',
    'mod-1',
    'Procedimiento ante Emergencias',
    'content',
    'Ante una contingencia, el protocolo **PAS** salva vidas:
• **Proteger**: Asegurar el área antes de intervenir.
• **Avisar**: Notificar inmediatamente a la jefatura y brigada de emergencia.
• **Socorrer**: Atender a las personas afectadas sólo si estás capacitado.',
    2
),
(
    'sec-1-quiz',
    'mod-1',
    'Evaluación Final del Módulo',
    'quiz',
    'Cuestionario evaluativo para validar la asimilación de conceptos clave de la Ley 16.744.',
    3
)
ON CONFLICT (id) DO NOTHING;

-- Preguntas iniciales del Examen
INSERT INTO public.quiz_questions (id, section_id, question, options, correct_answer)
VALUES
(
    'q-1-1',
    'sec-1-quiz',
    '¿Cuál es la ley que rige los accidentes de trabajo en Chile?',
    '["Ley 19.300", "Ley 20.001", "Ley 16.744", "Ley de Tránsito"]'::jsonb,
    2
),
(
    'q-1-2',
    'sec-1-quiz',
    '¿Cuál es la sigla fundamental ante una emergencia grave?',
    '["FOD (Freno, Orden, Disparo)", "PAS (Proteger, Avisar, Socorrer)", "MUT (Mover, Unir, Tratar)", "EPP (Evitar, Parar, Proteger)"]'::jsonb,
    1
),
(
    'q-1-3',
    'sec-1-quiz',
    '¿Qué factor reduce drásticamente las probabilidades de sufrir un accidente?',
    '["Correr en los pasillos", "Hablar por celular mientras se opera maquinaria", "Mantener el área ordenada, limpia e iluminada", "Ignorar las señales de peligro temporalmente"]'::jsonb,
    2
)
ON CONFLICT (id) DO NOTHING;
