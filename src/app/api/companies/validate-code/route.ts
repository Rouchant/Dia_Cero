import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code || code.length !== 6) {
      return NextResponse.json({
        isValid: false,
        error: 'El código de empresa debe tener exactamente 6 caracteres.'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, code, name, business_name, rut, logo_url, is_active')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ isValid: false, error: error.message }, { status: 500 });
    }

    if (!company || !company.is_active) {
      return NextResponse.json({
        isValid: false,
        error: 'El código de empresa ingresado no existe o se encuentra inactivo.'
      }, { status: 404 });
    }

    return NextResponse.json({
      isValid: true,
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        businessName: company.business_name,
        rut: company.rut,
        logoUrl: company.logo_url
      }
    });
  } catch (err: any) {
    return NextResponse.json({ isValid: false, error: err.message }, { status: 500 });
  }
}
