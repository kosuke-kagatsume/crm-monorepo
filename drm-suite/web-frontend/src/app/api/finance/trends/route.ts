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

  // Get last 6 months of data
  const now = new Date();
  const months: { key: string; start: string; end: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      start: d.toISOString().slice(0, 10),
      end: nextMonth.toISOString().slice(0, 10),
    });
  }

  // Get estimate lines grouped by month
  const { data: estimates } = await supabase
    .from('drm.estimate_lines')
    .select('created_at, unit_price_ex, quantity')
    .eq('tenant_id', tenant)
    .gte('created_at', months[0].start);

  // Get purchase orders grouped by month
  const { data: purchases } = await supabase
    .from('drm.purchase_order_lines')
    .select('created_at, unit_price_ex, quantity')
    .eq('tenant_id', tenant)
    .gte('created_at', months[0].start);

  // Calculate monthly totals
  const trends = months.map((m) => {
    const monthEstimates = (estimates || []).filter(
      (e: any) => e.created_at >= m.start && e.created_at < m.end,
    );
    const monthPurchases = (purchases || []).filter(
      (p: any) => p.created_at >= m.start && p.created_at < m.end,
    );

    const revenue = monthEstimates.reduce(
      (sum: number, e: any) =>
        sum + Number(e.unit_price_ex || 0) * Number(e.quantity || 0),
      0,
    );
    const cost = monthPurchases.reduce(
      (sum: number, p: any) =>
        sum + Number(p.unit_price_ex || 0) * Number(p.quantity || 0),
      0,
    );

    return {
      month: m.key,
      revenue,
      cost,
      gross: revenue - cost,
    };
  });

  return NextResponse.json({ trends });
}
