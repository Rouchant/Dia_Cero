-- Añadir columna de rol a la tabla "profiles" con un valor por default
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'estudiante';

-- Extensión requerida para Hashear contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid := uuid_generate_v4();
  nuevo_id uuid := uuid_generate_v4();
  medio_id uuid := uuid_generate_v4();
  graduado_id uuid := uuid_generate_v4();
  pass_hash text := crypt('Secreta123!', gen_salt('bf'));
BEGIN

  -- Limpiar dependencias primero para no romper las restricciones (foreign keys)
  DELETE FROM public.user_progress WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@diacero.com', 'nuevo@diacero.com', 'medio@diacero.com', 'graduado@diacero.com'));
  DELETE FROM public.profiles WHERE email IN ('admin@diacero.com', 'nuevo@diacero.com', 'medio@diacero.com', 'graduado@diacero.com');
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN ('admin@diacero.com', 'nuevo@diacero.com', 'medio@diacero.com', 'graduado@diacero.com'));
  
  -- Ahora limpiar los usuarios de Auth
  DELETE FROM auth.users WHERE email IN ('admin@diacero.com', 'nuevo@diacero.com', 'medio@diacero.com', 'graduado@diacero.com');

  -- 1. Insertar en auth.users (AHORA CON "ROLE" ADENTRO DEL METADATA JSONB)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, 
    email_confirmed_at, created_at, updated_at, 
    raw_app_meta_data, raw_user_meta_data, is_sso_user
  )
  VALUES 
  (admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@diacero.com', pass_hash, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Admin Supervisor", "role":"admin"}', false),
  (nuevo_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nuevo@diacero.com', pass_hash, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Estudiante Nuevo", "role":"estudiante"}', false),
  (medio_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'medio@diacero.com', pass_hash, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Estudiante Medio", "role":"estudiante"}', false),
  (graduado_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'graduado@diacero.com', pass_hash, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Estudiante Graduado", "role":"estudiante"}', false);

  -- 2. Insertar identities (requerido para login en últimas versiones de Supabase)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES
  (uuid_generate_v4(), admin_id, format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@diacero.com')::jsonb, 'email', admin_id::text, now(), now(), now()),
  (uuid_generate_v4(), nuevo_id, format('{"sub":"%s","email":"%s"}', nuevo_id::text, 'nuevo@diacero.com')::jsonb, 'email', nuevo_id::text, now(), now(), now()),
  (uuid_generate_v4(), medio_id, format('{"sub":"%s","email":"%s"}', medio_id::text, 'medio@diacero.com')::jsonb, 'email', medio_id::text, now(), now(), now()),
  (uuid_generate_v4(), graduado_id, format('{"sub":"%s","email":"%s"}', graduado_id::text, 'graduado@diacero.com')::jsonb, 'email', graduado_id::text, now(), now(), now());

  -- 3. Actualizar perfiles o crearlos con los nombres reales y roles
  INSERT INTO public.profiles (id, name, email, role)
  VALUES 
    (admin_id, 'Administrador Supervisor', 'admin@diacero.com', 'admin'),
    (nuevo_id, 'Estudiante Nuevo', 'nuevo@diacero.com', 'estudiante'),
    (medio_id, 'Estudiante Medio', 'medio@diacero.com', 'estudiante'),
    (graduado_id, 'Estudiante Graduado', 'graduado@diacero.com', 'estudiante')
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email;

  -- 4. Insertar la simulación de progresos
  INSERT INTO public.user_progress (user_id, module_id, completed_sections, quiz_scores, current_section_index, updated_at)
  VALUES 
    -- Estudiante Medio progresado (pasó 3 pantallas y contestó un quiz con nota 100)
    (medio_id, 'seguridad-laboral-chile', '["welcome", "core-concepts"]'::jsonb, '{"quiz-1": 100}'::jsonb, 2, now()),
    
    -- Estudiante Graduado (Pasó absolutamente todo al 100%)
    (graduado_id, 'seguridad-laboral-chile', '["welcome", "core-concepts", "quiz-1", "knowledge-synthesis", "final-assessment", "feedback-survey"]'::jsonb, '{"quiz-1": 100, "final-assessment": 100}'::jsonb, 5, now());

END $$;
