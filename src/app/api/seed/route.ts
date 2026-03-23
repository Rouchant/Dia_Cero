import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { DIA_CERO_MODULE } from '@/lib/module-data';

export async function GET() {
  const supabase = await createClient();

  // Sembrar el módulo
  const { error: moduleError } = await supabase.from('modules').upsert({
    id: DIA_CERO_MODULE.id,
    title: DIA_CERO_MODULE.title,
    description: DIA_CERO_MODULE.description,
  });

  if (moduleError) return NextResponse.json({ error: moduleError.message }, { status: 500 });

  // Sembrar secciones y preguntas
  for (let i = 0; i < DIA_CERO_MODULE.sections.length; i++) {
    const section = DIA_CERO_MODULE.sections[i];
    
    const { error: sectionError } = await supabase.from('module_sections').upsert({
      id: section.id,
      module_id: DIA_CERO_MODULE.id,
      title: section.title,
      type: section.type,
      content: section.content || null,
      video_url: section.videoUrl || null,
      image_url: section.imageUrl || null,
      image_hint: section.imageHint || null,
      sort_order: i,
    });

    if (sectionError) return NextResponse.json({ error: sectionError.message }, { status: 500 });

    if (section.questions) {
      for (const q of section.questions) {
        await supabase.from('quiz_questions').upsert({
          id: q.id,
          section_id: section.id,
          question: q.question,
          options: q.options, // Guardado como JSONB
          correct_answer: q.correctAnswer,
        });
      }
    }
  }

  return NextResponse.json({ success: true, message: 'Base de datos poblada exitosamente con los módulos y preguntas.' });
}
