import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: Request) {
  try {
    const { moduleId } = await request.json();

    if (!moduleId) {
      return NextResponse.json({ error: 'Falta moduleId requerido' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Obtener todas las secciones del módulo
    const { data: sections, error: secError } = await supabaseAdmin
      .from('module_sections')
      .select('id')
      .eq('module_id', moduleId);

    if (secError) {
      return NextResponse.json({ error: 'Error consultando secciones: ' + secError.message }, { status: 500 });
    }

    const sectionIds = (sections || []).map(s => s.id);

    // 2. Eliminar preguntas de examen vinculadas a las secciones de este módulo
    if (sectionIds.length > 0) {
      const { error: quizError } = await supabaseAdmin
        .from('quiz_questions')
        .delete()
        .in('section_id', sectionIds);

      if (quizError) {
        return NextResponse.json({ error: 'Error eliminando preguntas de examen: ' + quizError.message }, { status: 500 });
      }
    }

    // 3. Eliminar las secciones del módulo
    const { error: delSecError } = await supabaseAdmin
      .from('module_sections')
      .delete()
      .eq('module_id', moduleId);

    if (delSecError) {
      return NextResponse.json({ error: 'Error eliminando secciones del módulo: ' + delSecError.message }, { status: 500 });
    }

    // 4. Eliminar progresos de usuarios asociados a este módulo
    const { error: progError } = await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('module_id', moduleId);

    if (progError) {
      return NextResponse.json({ error: 'Error eliminando registros de avance: ' + progError.message }, { status: 500 });
    }

    // 5. Eliminar el registro del módulo
    const { error: modError } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', moduleId);

    if (modError) {
      return NextResponse.json({ error: 'Error eliminando el módulo: ' + modError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Módulo y todos sus contenidos eliminados correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
