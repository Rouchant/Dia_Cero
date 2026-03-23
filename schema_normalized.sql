-- =========================================================================================
-- NORMALIZACIÓN DEL ESQUEMA
-- Este script actualiza tu base de datos actual para que funcionen las eliminaciones 
-- en cascada y las actualizaciones de progreso en código sin perder nada de tus datos.
-- =========================================================================================

-- 1. Agregar restricción UNIQUE vital para el Guardado de Progreso
-- React usa 'upsert' que requiere que no hayan progresos repetidos para el mismo módulo y usuario
ALTER TABLE public.user_progress 
DROP CONSTRAINT IF EXISTS user_progress_user_id_module_id_key;

ALTER TABLE public.user_progress 
ADD CONSTRAINT user_progress_user_id_module_id_key UNIQUE(user_id, module_id);


-- 2. Normalizar llaves foráneas para que tengan ON DELETE CASCADE
-- Esto permite que si borras un usuario o módulo, se limpien automática y limpiamente sus restos.

-- En profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- En user_progress
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_module_id_fkey;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_module_id_fkey 
  FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- En module_sections
ALTER TABLE public.module_sections DROP CONSTRAINT IF EXISTS module_sections_module_id_fkey;
ALTER TABLE public.module_sections ADD CONSTRAINT module_sections_module_id_fkey 
  FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- En quiz_questions
ALTER TABLE public.quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_section_id_fkey;
ALTER TABLE public.quiz_questions ADD CONSTRAINT quiz_questions_section_id_fkey 
  FOREIGN KEY (section_id) REFERENCES public.module_sections(id) ON DELETE CASCADE;
