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
  const today = new Date();

  const { data, error } = await supabase
    .from('drm.ap_invoices')
    .select('amount_ex, pay_due_date')
    .eq('tenant_id', tenant);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const aging = {
    current: 0,
    days_30: 0,
    days_60: 0,
    days_90: 0,
    over_90: 0,
  };

  (data || []).forEach((inv: any) => {
    const amount = Number(inv.amount_ex || 0);
    const dueDate = new Date(inv.pay_due_date + 'T00:00:00Z');
    const daysDiff = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= 0) {
      aging.current += amount;
    } else if (daysDiff <= 30) {
      aging.days_30 += amount;
    } else if (daysDiff <= 60) {
      aging.days_60 += amount;
    } else if (daysDiff <= 90) {
      aging.days_90 += amount;
    } else {
      aging.over_90 += amount;
    }
  });

  return NextResponse.json({ aging });
}
