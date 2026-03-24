import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch all users (paginates up to 1000)
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unconfirmed = data.users.filter(u => !u.email_confirmed_at);

  const results = await Promise.all(
    unconfirmed.map(u =>
      supabaseAdmin.auth.admin.updateUserById(u.id, { email_confirm: true })
    )
  );

  const failed = results.filter(r => r.error).map(r => r.error?.message);

  return NextResponse.json({
    total: data.users.length,
    confirmed: unconfirmed.length - failed.length,
    failed,
  });
}
