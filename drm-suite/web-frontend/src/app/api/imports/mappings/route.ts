// src/app/api/imports/mappings/route.ts
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

// GET /api/imports/mappings?tenant=...&type=estimate
export async function GET(req: NextRequest) {
  const tenant = req.nextUrl.searchParams.get('tenant');
  const type = req.nextUrl.searchParams.get('type') ?? undefined;
  if (!tenant)
    return NextResponse.json({ error: 'tenant required' }, { status: 400 });

  const supabase = sb();
  let query = supabase
    .from('drm.import_mappings')
    .select('*')
    .eq('tenant_id', tenant);
  if (type) query = query.eq('type', type);
  const { data, error } = await query.order('template_name', {
    ascending: true,
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST body: { tenant_id, type, template_name, header_map }
export async function POST(req: NextRequest) {
  const supabase = sb();
  const body = await req.json();
  if (
    !body?.tenant_id ||
    !body?.type ||
    !body?.template_name ||
    !body?.header_map
  ) {
    return NextResponse.json(
      { error: 'tenant_id, type, template_name, header_map required' },
      { status: 400 },
    );
  }
  const { data, error } = await supabase
    .from('drm.import_mappings')
    .upsert({ ...body }, { onConflict: 'tenant_id,type,template_name' })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/imports/mappings?tenant=...&type=estimate&template_name=Foo
export async function DELETE(req: NextRequest) {
  const supabase = sb();
  const tenant = req.nextUrl.searchParams.get('tenant');
  const type = req.nextUrl.searchParams.get('type');
  const template_name = req.nextUrl.searchParams.get('template_name');
  if (!tenant || !type || !template_name) {
    return NextResponse.json(
      { error: 'tenant, type, template_name required' },
      { status: 400 },
    );
  }
  const { error } = await supabase
    .from('drm.import_mappings')
    .delete()
    .eq('tenant_id', tenant)
    .eq('type', type)
    .eq('template_name', template_name);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
