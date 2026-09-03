-- ==============================================================================
-- DiaCero — Script de Base de Datos Oficial (Supabase / PostgreSQL)
-- ==============================================================================
-- Esquema sincronizado con la base de datos de producción de DiaCero.
-- Incluye tablas, claves foráneas, políticas de seguridad RLS, triggers y seed data.
-- ==============================================================================

-- 1. Extensiones necesarias para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLA: public.profiles (Perfiles de usuario)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'estudiante'::text,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de perfiles para usuarios autenticados"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Acceso total para service_role y administradores"
ON public.profiles FOR ALL TO authenticated
USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 3. TRIGGER: Sincronización automática de perfil al registrarse en Auth
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, last_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'estudiante'),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        last_active = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABLA: public.modules (Módulos y Cursos de Capacitación)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT modules_pkey PRIMARY KEY (id)
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Módulos visibles para todos los usuarios autenticados"
ON public.modules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestión de módulos para administradores"
ON public.modules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- 5. TABLA: public.module_sections (Diapositivas y contenedor de examen)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.module_sections (
    id TEXT NOT NULL,
    module_id TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    image_url TEXT,
    image_hint TEXT,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ai_summary TEXT,
    ai_explanation TEXT,
    CONSTRAINT module_sections_pkey PRIMARY KEY (id),
    CONSTRAINT module_sections_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE
);

ALTER TABLE public.module_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Secciones visibles para usuarios autenticados"
ON public.module_sections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestión de secciones para administradores"
ON public.module_sections FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- 6. TABLA: public.quiz_questions (Banco de preguntas de exámenes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT NOT NULL,
    section_id TEXT,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
    CONSTRAINT quiz_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.module_sections(id) ON DELETE CASCADE
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preguntas visibles para usuarios autenticados"
ON public.quiz_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestión de preguntas para administradores"
ON public.quiz_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- 7. TABLA: public.user_progress (Progreso de los alumnos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    module_id TEXT,
    completed_sections JSONB DEFAULT '[]'::jsonb,
    quiz_scores JSONB DEFAULT '{}'::jsonb,
    current_section_index INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT user_progress_pkey PRIMARY KEY (id),
    CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiantes pueden ver su propio progreso"
ON public.user_progress FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Estudiantes pueden registrar su progreso"
ON public.user_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Estudiantes pueden actualizar sus avances"
ON public.user_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Administradores gestionan todo el progreso"
ON public.user_progress FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- 8. DATOS SEMILLA (Seed Data) — Módulo Piloto Ley 16.744
-- ==============================================================================
INSERT INTO public.modules (id, title, description)
VALUES (
    'mod-1',
    'Módulo Piloto: Seguridad Laboral (Ley 16.744)',
    'Capacitación inicial obligatoria sobre prevención de riesgos laborales y normativas de seguridad ocupacional en Chile.'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO public.module_sections (id, module_id, title, type, content, sort_order)
VALUES 
(
    'sec-1-1', 'mod-1', 'Conceptos Fundamentales de Prevención', 'content',
    'La **Ley 16.744** establece normas sobre accidentes del trabajo y enfermedades profesionales en Chile. Su objetivo es otorgar cobertura médica integral y preventiva a todos los trabajadores del país.',
    0
),
(
    'sec-1-2', 'mod-1', 'Identificación de Peligros Comunes', 'content',
    'En toda faena es indispensable realizar la identificación de riesgos antes de iniciar cualquier labor:
1. Inspeccionar el entorno inmediato de trabajo.
2. Comprobar el uso correcto de los Elementos de Protección Personal (EPP).
3. Reportar oportunamente condiciones subestándar.',
    1
),
(
    'sec-1-3', 'mod-1', 'Procedimiento ante Emergencias', 'content',
    'Ante una contingencia, el protocolo **PAS** salva vidas:
• **Proteger**: Asegurar el área antes de intervenir.
• **Avisar**: Notificar inmediatamente a la jefatura y brigada de emergencia.
• **Socorrer**: Atender a las personas afectadas sólo si estás capacitado.',
    2
),
(
    'sec-1-quiz', 'mod-1', 'Evaluación Final del Módulo', 'quiz',
    'Cuestionario evaluativo para validar la asimilación de conceptos clave de la Ley 16.744.',
    3
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, section_id, question, options, correct_answer)
VALUES
(
    'q-1-1', 'sec-1-quiz',
    '¿Cuál es la ley que rige los accidentes de trabajo en Chile?',
    '["Ley 19.300", "Ley 20.001", "Ley 16.744", "Ley de Tránsito"]'::jsonb,
    2
),
(
    'q-1-2', 'sec-1-quiz',
    '¿Cuál es la sigla fundamental ante una emergencia grave?',
    '["FOD (Freno, Orden, Disparo)", "PAS (Proteger, Avisar, Socorrer)", "MUT (Mover, Unir, Tratar)", "EPP (Evitar, Parar, Proteger)"]'::jsonb,
    1
),
(
    'q-1-3', 'sec-1-quiz',
    '¿Qué factor reduce drásticamente las probabilidades de sufrir un accidente?',
    '["Correr en los pasillos", "Hablar por celular mientras se opera maquinaria", "Mantener el área ordenada, limpia e iluminada", "Ignorar las señales de peligro temporalmente"]'::jsonb,
    2
)
ON CONFLICT (id) DO NOTHING;
