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

  // Get project counts and values by status
  const { data: projects } = await supabase
    .from('drm.projects')
    .select('project_code, status')
    .eq('tenant_id', tenant);

  const { data: estimates } = await supabase
    .from('drm.estimate_lines')
    .select('project_code, unit_price_ex, quantity')
    .eq('tenant_id', tenant);

  // Calculate project values
  const projectValues = new Map<string, number>();
  (estimates || []).forEach((e: any) => {
    const current = projectValues.get(e.project_code) || 0;
    projectValues.set(
      e.project_code,
      current + Number(e.unit_price_ex || 0) * Number(e.quantity || 0),
    );
  });

  // Mock pipeline stages based on project status
  const statusToStage: Record<string, string> = {
    draft: 'リード',
    planning: '商談',
    estimated: '見積',
    negotiating: '受注待ち',
    contracted: '受注',
    active: '受注',
    completed: '受注',
  };

  const pipeline = new Map<string, { count: number; value: number }>();
  ['リード', '商談', '見積', '受注待ち', '受注'].forEach((stage) => {
    pipeline.set(stage, { count: 0, value: 0 });
  });

  (projects || []).forEach((p: any) => {
    const stage = statusToStage[p.status] || 'リード';
    const item = pipeline.get(stage)!;
    item.count++;
    item.value += projectValues.get(p.project_code) || 0;
  });

  return NextResponse.json({
    pipeline: Array.from(pipeline.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    })),
  });
}
