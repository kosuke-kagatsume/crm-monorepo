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
  // FK: ap_invoices.po_no -> purchase_orders.po_no で仕入先・現場をJOIN
  const { data, error } = await supabase
    .from('drm.ap_invoices')
    .select(
      `
      ap_no, amount_ex, pay_due_date,
      purchase_orders!inner(
        po_no, project_code, vendor_code, vendor_name
      )
    `,
    )
    .eq('tenant_id', tenant)
    .order('pay_due_date', { ascending: true })
    .limit(500);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data || []).map((r: any) => ({
      ap_no: r.ap_no,
      amount_ex: Number(r.amount_ex || 0),
      pay_due_date: r.pay_due_date,
      project_code: r.purchase_orders?.project_code || null,
      vendor_code: r.purchase_orders?.vendor_code || null,
      vendor_name: r.purchase_orders?.vendor_name || null,
    })),
  );
}
