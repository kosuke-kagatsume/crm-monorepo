export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length) {
    return NextResponse.json({ ok: false, missing }, { status: 500 });
  }

  // 読み取り疎通（サービスキーがあれば使う）
  const key = service ?? anon;
  const supabase = createClient(url!, key!, {
    auth: { persistSession: false },
  });

  try {
    // 軽いヘッドクエリ（RLSの有無に関わらず失敗してもレスポンスは返す）
    const { error } = await supabase
      .from('drm.projects')
      .select('project_code', { count: 'exact', head: true });
    return NextResponse.json({
      ok: true,
      using: service ? 'service_role' : 'anon',
      rls_error: error?.message ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unknown' },
      { status: 500 },
    );
  }
}
