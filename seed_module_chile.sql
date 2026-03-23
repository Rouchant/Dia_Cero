-- 1. Asegurarnos de que el módulo principal existe
INSERT INTO public.modules (id, title, description)
VALUES (
  'seguridad-laboral-chile',
  'Seguridad Laboral Básica (Chile)',
  'Normativas y protocolos esenciales de prevención de riesgos en entornos laborales chilenos.'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Limpiar secciones o evaluaciones viejas de este módulo para evitar duplicados
DELETE FROM public.quiz_questions 
WHERE section_id IN (SELECT id FROM public.module_sections WHERE module_id = 'seguridad-laboral-chile');

DELETE FROM public.module_sections 
WHERE module_id = 'seguridad-laboral-chile';

-- 3. Inyectar las 3 Diapositivas Teóricas (Aprendizaje)
INSERT INTO public.module_sections (id, module_id, title, type, content, sort_order)
VALUES 
(
  'sec-chile-1', 
  'seguridad-laboral-chile', 
  'Conceptos Fundamentales de Prevención', 
  'content', 
  'En Chile, la prevención de riesgos laborales está regulada principalmente por la Ley 16.744. Esta ley establece el seguro social obligatorio contra accidentes del trabajo y enfermedades profesionales. Es tu deber como trabajador conocer los riesgos asociados a tu labor y utilizar correctamente los Elementos de Protección Personal (EPP) entregados por tu empleador.', 
  1
),
(
  'sec-chile-2', 
  'seguridad-laboral-chile', 
  'Identificación de Peligros Comunes', 
  'content', 
  'Los peligros en terreno varían según la industria, pero los más comunes incluyen: caídas a distinto nivel, atrapamientos mecánicos, exposición a sustancias peligrosas y riesgos eléctricos. Mantener tu área de trabajo ordenada, limpia e iluminada reduce drásticamente las probabilidades de sufrir un accidente grave.', 
  2
),
(
  'sec-chile-3', 
  'seguridad-laboral-chile', 
  'Procedimiento ante Emergencias', 
  'content', 
  'Frente a un accidente grave, la regla vital es el acrónimo PAS: Proteger, Avisar y Socorrer. Primero asegúrate de que tú estás a salvo. Luego avisa de inmediato a la jefatura o al prevencionista de turno (o llama a la ACHS/Mutual correspondiente). Nunca intentes mover a un herido con traumas severos a menos de que su vida corra peligro inminente.', 
  3
);

-- 4. Inyectar 1 Sección Estructural de Evaluación (El contenedor del Quiz)
INSERT INTO public.module_sections (id, module_id, title, type, content, sort_order)
VALUES 
(
  'seguridad-laboral-chile-quiz', 
  'seguridad-laboral-chile', 
  'Evaluación Final: Seguridad Laboral', 
  'quiz', 
  'Demuestra lo que has aprendido respondiendo las siguientes 3 preguntas clave.', 
  4
);

-- 5. Inyectar las 3 Preguntas de Alternativas atadas a esa Evaluación
INSERT INTO public.quiz_questions (id, section_id, question, options, correct_answer)
VALUES 
(
  'quiz-chile-q1',
  'seguridad-laboral-chile-quiz',
  '¿Cuál es la ley que rige los accidentes de trabajo en Chile?',
  '["Ley 19.300", "Ley 20.001", "Ley 16.744", "Ley de Tránsito"]'::jsonb,
  2
),
(
  'quiz-chile-q2',
  'seguridad-laboral-chile-quiz',
  '¿Cuál es la sigla fundamental ante una emergencia grave?',
  '["FOD (Freno, Orden, Disparo)", "PAS (Proteger, Avisar, Socorrer)", "MUT (Mover, Unir, Tratar)", "EPP (Evitar, Parar, Proteger)"]'::jsonb,
  1
),
(
  'quiz-chile-q3',
  'seguridad-laboral-chile-quiz',
  '¿Qué factor reduce drásticamente las probabilidades de sufrir un accidente?',
  '["Correr en los pasillos", "Hablar por celular mientras se opera maquinaria", "Mantener el área ordenada, limpia e iluminada", "Ignorar las señales de peligro temporalmente"]'::jsonb,
  2
);
