export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type Row = {
  project_code: string;
  project_name: string | null;
  estimate_revenue_ex: number | null;
  estimate_cost_ex: number | null;
  committed_cost_ex: number | null;
  actual_cost_ex: number | null;
};

export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant');
  if (!tenant)
    return NextResponse.json({ error: 'tenant required' }, { status: 400 });

  const supabase = sb();
  const { data, error } = await supabase
    .from('drm.mv_project_finance')
    .select(
      'project_code, project_name, estimate_revenue_ex, estimate_cost_ex, committed_cost_ex, actual_cost_ex',
    )
    .eq('tenant_id', tenant)
    .order('project_code', { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r: Row) => {
    const estRev = Number(r.estimate_revenue_ex || 0);
    const estCost = Number(r.estimate_cost_ex || 0);
    const gross = estRev - estCost;
    const margin = estRev ? Math.round((gross / estRev) * 10000) / 100 : null;
    return { ...r, gross_ex: gross, gross_margin_pct: margin };
  });

  const sum = (k: keyof Row | 'gross_ex') =>
    rows.reduce((a: number, r: any) => a + Number(r[k] || 0), 0);

  return NextResponse.json({
    totals: {
      estimate_revenue_ex: sum('estimate_revenue_ex'),
      estimate_cost_ex: sum('estimate_cost_ex'),
      committed_cost_ex: sum('committed_cost_ex'),
      actual_cost_ex: sum('actual_cost_ex'),
      gross_ex: sum('gross_ex'),
    },
    rows,
  });
}
