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
function ymKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant');
  const role = (req.nextUrl.searchParams.get('role') || 'mgmt') as
    | 'mgmt'
    | 'accounting'
    | 'branch'
    | 'site';
  if (!tenant)
    return NextResponse.json({ error: 'tenant required' }, { status: 400 });

  const supabase = sb();

  // ベース：案件ファイナンス
  const { data: mv, error: e1 } = await supabase
    .from('drm.mv_project_finance')
    .select(
      'project_code, project_name, estimate_revenue_ex, estimate_cost_ex, committed_cost_ex, actual_cost_ex',
    )
    .eq('tenant_id', tenant);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const sum = (k: keyof (typeof mv)[number]) =>
    (mv || []).reduce((a, r) => a + Number((r as any)[k] || 0), 0);
  const revenue = sum('estimate_revenue_ex');
  const estCost = sum('estimate_cost_ex');
  const committed = sum('committed_cost_ex');
  const actual = sum('actual_cost_ex');
  const gross = revenue - estCost;
  const margin = revenue ? Math.round((gross / revenue) * 10000) / 100 : 0;

  // トレンド（直近6ヶ月：見積売上/実績原価）
  const sixAgo = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1),
  )
    .toISOString()
    .slice(0, 10);
  const [est, ap, pol] = await Promise.all([
    supabase
      .from('drm.estimate_lines')
      .select('created_at, unit_price_ex, quantity')
      .eq('tenant_id', tenant)
      .gte('created_at', sixAgo),
    supabase
      .from('drm.ap_invoices')
      .select('invoice_date, amount_ex')
      .eq('tenant_id', tenant)
      .gte('invoice_date', sixAgo),
    supabase
      .from('drm.purchase_order_lines')
      .select('unit_cost_ex, quantity, created_at')
      .eq('tenant_id', tenant)
      .gte('created_at', sixAgo),
  ]);
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - i, 1),
    );
    months.push(ymKey(d));
  }
  const series = (base: string[]) =>
    base.reduce((m, k) => ((m[k] = 0), m), {} as Record<string, number>);
  const sRev = series(months),
    sAP = series(months),
    sPO = series(months),
    sEstCost = series(months);
  (est.data || []).forEach((r: any) => {
    const k = ymKey(new Date((r.created_at || '') + 'T00:00:00Z'));
    if (k in sRev) {
      sRev[k] += Number(r.unit_price_ex || 0) * Number(r.quantity || 0);
      sEstCost[k] +=
        Number(r.unit_price_ex || 0) * Number(r.quantity || 0) * 0.7;
    }
  });
  (ap.data || []).forEach((r: any) => {
    const k = ymKey(new Date((r.invoice_date || '') + 'T00:00:00Z'));
    if (k in sAP) sAP[k] += Number(r.amount_ex || 0);
  });
  (pol.data || []).forEach((r: any) => {
    const k = ymKey(new Date((r.created_at || '') + 'T00:00:00Z'));
    if (k in sPO)
      sPO[k] += Number(r.unit_cost_ex || 0) * Number(r.quantity || 0);
  });

  // 施工：未納（未請求）/超過
  const { data: pol2 } = await supabase
    .from('drm.purchase_order_lines')
    .select(
      'po_no, unit_cost_ex, quantity, delivery_date, purchase_orders!inner(project_code, vendor_name)',
    )
    .eq('tenant_id', tenant);
  const { data: ap2 } = await supabase
    .from('drm.ap_invoices')
    .select('po_no, amount_ex')
    .eq('tenant_id', tenant);
  const apByPo: Record<string, number> = {};
  (ap2 || []).forEach(
    (r: any) =>
      (apByPo[r.po_no] = (apByPo[r.po_no] || 0) + Number(r.amount_ex || 0)),
  );
  const today = new Date().toISOString().slice(0, 10);
  const materials = (pol2 || [])
    .map((l: any) => {
      const poAmt = Number(l.unit_cost_ex || 0) * Number(l.quantity || 0);
      const remain = Math.max(poAmt - (apByPo[l.po_no] || 0), 0);
      const overdue = l.delivery_date && l.delivery_date < today && remain > 0;
      return {
        project_code: l.purchase_orders?.project_code,
        vendor: l.purchase_orders?.vendor_name,
        due_date: l.delivery_date,
        remain,
        overdue,
      };
    })
    .filter((x) => x.remain > 0);

  return NextResponse.json({
    role,
    kpi: { revenue, estCost, committed, actual, gross, margin },
    trend: {
      months,
      revenue: months.map((m) => sRev[m]),
      estCost: months.map((m) => sEstCost[m]),
      committed: months.map((m) => sPO[m]),
      actual: months.map((m) => sAP[m]),
    },
    alerts: {
      overdue: materials.filter((x) => x.overdue).length,
      pending: materials.length,
      topPending: materials.sort((a, b) => b.remain - a.remain).slice(0, 5),
    },
    varianceTop5: (mv || [])
      .map((r: any) => ({
        project_code: r.project_code,
        name: r.project_name,
        diff:
          Number(r.committed_cost_ex || 0) - Number(r.estimate_cost_ex || 0),
      }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5),
  });
}
