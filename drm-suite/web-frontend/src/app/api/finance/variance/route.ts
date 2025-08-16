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

export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant');
  if (!tenant)
    return NextResponse.json({ error: 'tenant required' }, { status: 400 });

  const supabase = sb();

  const { data, error } = await supabase
    .from('drm.mv_project_finance')
    .select('project_code, project_name, estimate_cost_ex, actual_cost_ex')
    .eq('tenant_id', tenant)
    .not('actual_cost_ex', 'is', null)
    .gt('actual_cost_ex', 0);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const variances = (data || [])
    .map((r: any) => {
      const estimate = Number(r.estimate_cost_ex || 0);
      const actual = Number(r.actual_cost_ex || 0);
      const variance = estimate - actual;
      const variance_pct = estimate
        ? ((actual - estimate) / estimate) * 100
        : 0;

      return {
        project_code: r.project_code,
        project_name: r.project_name || '',
        estimate_cost: estimate,
        actual_cost: actual,
        variance,
        variance_pct,
      };
    })
    .sort((a, b) => a.variance - b.variance);

  return NextResponse.json({ variances });
}
