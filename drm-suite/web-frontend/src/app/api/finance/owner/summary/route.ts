export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const tenant = req.nextUrl.searchParams.get('tenant');
  if (!tenant)
    return NextResponse.json({ error: 'tenant required' }, { status: 400 });

  // MVはRLS対象外。必ず tenant_id でフィルタ
  const { data, error } = await supabase
    .from('drm.mv_project_finance')
    .select(
      'estimate_revenue_ex, estimate_cost_ex, committed_cost_ex, actual_cost_ex',
      { head: false },
    )
    .eq('tenant_id', tenant);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const sum = (k: keyof (typeof data)[number]) =>
    data?.reduce((a: number, r: any) => a + Number(r[k] || 0), 0) || 0;
  const res = {
    estimate_revenue_ex: sum('estimate_revenue_ex'),
    estimate_cost_ex: sum('estimate_cost_ex'),
    committed_cost_ex: sum('committed_cost_ex'),
    actual_cost_ex: sum('actual_cost_ex'),
    gross_ex: sum('estimate_revenue_ex') - sum('estimate_cost_ex'),
  };
  return NextResponse.json(res);
}
