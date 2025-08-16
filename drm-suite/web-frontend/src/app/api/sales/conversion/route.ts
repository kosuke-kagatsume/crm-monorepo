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

  // Get projects for conversion metrics
  const { data: projects } = await supabase
    .from('drm.projects')
    .select('project_code, status')
    .eq('tenant_id', tenant);

  const { data: estimates } = await supabase
    .from('drm.estimate_lines')
    .select('project_code, unit_price_ex, quantity')
    .eq('tenant_id', tenant);

  // Calculate metrics
  const statuses = (projects || []).map((p: any) => p.status);
  const leadStatuses = ['draft', 'planning'];
  const quoteStatuses = ['estimated', 'negotiating'];
  const wonStatuses = ['contracted', 'active', 'completed'];

  const total_leads = statuses.filter((s) => leadStatuses.includes(s)).length;
  const converted_leads = statuses.filter(
    (s) => !leadStatuses.includes(s),
  ).length;
  const total_quotes = statuses.filter((s) => quoteStatuses.includes(s)).length;
  const won_quotes = statuses.filter((s) => wonStatuses.includes(s)).length;

  // Calculate average deal size from won projects
  const wonProjects = (projects || []).filter((p: any) =>
    wonStatuses.includes(p.status),
  );
  let total_won_value = 0;

  wonProjects.forEach((p: any) => {
    const projectEstimates = (estimates || []).filter(
      (e: any) => e.project_code === p.project_code,
    );
    const value = projectEstimates.reduce(
      (sum: number, e: any) =>
        sum + Number(e.unit_price_ex || 0) * Number(e.quantity || 0),
      0,
    );
    total_won_value += value;
  });

  const avg_deal_size = won_quotes > 0 ? total_won_value / won_quotes : 0;
  const conversion_rate =
    total_leads > 0 ? (converted_leads / total_leads) * 100 : 0;
  const win_rate = total_quotes > 0 ? (won_quotes / total_quotes) * 100 : 0;

  return NextResponse.json({
    metrics: {
      total_leads,
      converted_leads,
      total_quotes,
      won_quotes,
      avg_deal_size,
      conversion_rate,
      win_rate,
    },
  });
}
