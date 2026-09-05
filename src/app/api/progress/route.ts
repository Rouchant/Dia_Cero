import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component write fallback
            }
          },
        },
      }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, completedSections, quizScores, currentSectionIndex, score } = body;

    if (!moduleId) {
      return NextResponse.json({ error: 'Se requiere moduleId' }, { status: 400 });
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const now = new Date().toISOString();

    // Persistir el progreso del colaborador asociado a su UUID
    const { data: progressData, error: upsertError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: authData.user.id,
        module_id: moduleId,
        completed_sections: completedSections || [],
        quiz_scores: quizScores || {},
        current_section_index: currentSectionIndex ?? 0,
        updated_at: now,
        last_active_at: now,
        last_ip_address: ip
      }, { onConflict: 'user_id, module_id' })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json({ error: 'Falla al guardar progreso: ' + upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Progreso y telemetría de usuario actualizados correctamente', 
      progress: progressData 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
