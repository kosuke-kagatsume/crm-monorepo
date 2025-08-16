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
  today.setHours(0, 0, 0, 0);

  // Get pending deliveries from purchase order lines
  const { data, error } = await supabase
    .from('drm.purchase_order_lines')
    .select(
      `
      po_no, item_code, item_name, quantity, unit, unit_price_ex, 
      delivery_date, is_delivered,
      purchase_orders!inner(
        project_code, vendor_name
      )
    `,
    )
    .eq('tenant_id', tenant)
    .eq('is_delivered', false)
    .not('delivery_date', 'is', null)
    .order('delivery_date', { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const deliveries = (data || []).map((line: any) => {
    const deliveryDate = new Date(line.delivery_date + 'T00:00:00Z');
    const daysDiff = Math.floor(
      (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      po_no: line.po_no,
      project_code: line.purchase_orders?.project_code || '',
      vendor_name: line.purchase_orders?.vendor_name || '',
      item_name: line.item_name || line.item_code || '',
      quantity: Number(line.quantity || 0),
      unit: line.unit || '',
      delivery_date: line.delivery_date,
      days_until: daysDiff,
      is_overdue: daysDiff < 0,
      amount: Number(line.unit_price_ex || 0) * Number(line.quantity || 0),
    };
  });

  const stats = {
    pending: deliveries.length,
    overdue: deliveries.filter((d) => d.is_overdue).length,
    total_amount: deliveries.reduce((sum, d) => sum + d.amount, 0),
  };

  return NextResponse.json({ deliveries, stats });
}
