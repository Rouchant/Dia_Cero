import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, moduleId } = await request.json();

    if (!userId || !moduleId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (userId, moduleId)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar si ya existe el registro
    const { data: existing } = await supabaseAdmin
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'El estudiante ya tiene asignado este módulo' }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('user_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        completed_sections: [],
        quiz_scores: {},
        current_section_index: 0,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Módulo asignado correctamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, moduleId } = await request.json();

    if (!userId || !moduleId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (userId, moduleId)' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: deleteError } = await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Módulo desvinculado con éxito' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
