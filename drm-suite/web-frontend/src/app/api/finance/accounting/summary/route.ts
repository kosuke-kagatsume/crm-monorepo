export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0; // キャッシュ無効（Vercelでの空返り対策）

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

type MVRow = {
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

  // mv_project_finance から全体サマリ
  const { data: mv, error: e1 } = await supabase
    .from('drm.mv_project_finance')
    .select(
      'estimate_revenue_ex, estimate_cost_ex, committed_cost_ex, actual_cost_ex',
    )
    .eq('tenant_id', tenant);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const sum = (k: keyof MVRow) =>
    (mv || []).reduce((a, r) => a + Number((r as any)[k] || 0), 0);
  const totals = {
    estimate_revenue_ex: sum('estimate_revenue_ex'),
    estimate_cost_ex: sum('estimate_cost_ex'),
    committed_cost_ex: sum('committed_cost_ex'),
    actual_cost_ex: sum('actual_cost_ex'),
    gross_ex: sum('estimate_revenue_ex') - sum('estimate_cost_ex'),
  };

  // 支払予定（AP）：今月/来月/再来月の月別合計
  const now = new Date();
  const months: { key: string; from: Date; to: Date }[] = [];
  for (let i = 0; i < 3; i++) {
    const d1 = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1),
    );
    const d2 = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i + 1, 1),
    );
    months.push({
      key: `${d1.getUTCFullYear()}-${String(d1.getUTCMonth() + 1).padStart(2, '0')}`,
      from: d1,
      to: d2,
    });
  }

  const { data: ap, error: e2 } = await supabase
    .from('drm.ap_invoices')
    .select('amount_ex, pay_due_date')
    .eq('tenant_id', tenant)
    .gte('pay_due_date', months[0].from.toISOString().slice(0, 10))
    .lt('pay_due_date', months[2].to.toISOString().slice(0, 10));

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const buckets: Record<string, number> = {};
  months.forEach((m) => (buckets[m.key] = 0));
  (ap || []).forEach((r: any) => {
    const d = new Date(r.pay_due_date + 'T00:00:00Z');
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (key in buckets) buckets[key] += Number(r.amount_ex || 0);
  });

  return NextResponse.json(
    {
      totals: totals || {
        estimate_revenue_ex: 0,
        estimate_cost_ex: 0,
        committed_cost_ex: 0,
        actual_cost_ex: 0,
        gross_ex: 0,
      },
      payables_by_month: buckets || {},
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
