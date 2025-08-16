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

  // Get vendor aggregates from purchase orders and AP invoices
  const { data: poData, error: e1 } = await supabase
    .from('drm.purchase_orders')
    .select('vendor_code, vendor_name, total_amount_ex')
    .eq('tenant_id', tenant);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: apData, error: e2 } = await supabase
    .from('drm.ap_invoices')
    .select(
      `
      amount_ex, pay_due_date, invoice_date,
      purchase_orders!inner(vendor_code, vendor_name)
    `,
    )
    .eq('tenant_id', tenant);

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // Aggregate by vendor
  const vendorMap = new Map<string, any>();

  (poData || []).forEach((po: any) => {
    const code = po.vendor_code;
    if (!code) return;

    if (!vendorMap.has(code)) {
      vendorMap.set(code, {
        vendor_code: code,
        vendor_name: po.vendor_name || code,
        total_amount: 0,
        invoice_count: 0,
        total_payment_days: 0,
      });
    }

    const vendor = vendorMap.get(code);
    vendor.total_amount += Number(po.total_amount_ex || 0);
  });

  (apData || []).forEach((ap: any) => {
    const code = ap.purchase_orders?.vendor_code;
    if (!code) return;

    if (!vendorMap.has(code)) {
      vendorMap.set(code, {
        vendor_code: code,
        vendor_name: ap.purchase_orders?.vendor_name || code,
        total_amount: 0,
        invoice_count: 0,
        total_payment_days: 0,
      });
    }

    const vendor = vendorMap.get(code);
    vendor.invoice_count++;

    if (ap.invoice_date && ap.pay_due_date) {
      const invDate = new Date(ap.invoice_date + 'T00:00:00Z');
      const payDate = new Date(ap.pay_due_date + 'T00:00:00Z');
      const days = Math.floor(
        (payDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      vendor.total_payment_days += days;
    }
  });

  const vendors = Array.from(vendorMap.values())
    .map((v) => ({
      ...v,
      avg_payment_days:
        v.invoice_count > 0
          ? Math.round(v.total_payment_days / v.invoice_count)
          : 0,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  return NextResponse.json({ vendors });
}
