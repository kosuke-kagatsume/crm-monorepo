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

  // Get active projects count
  const { data: projects } = await supabase
    .from('drm.projects')
    .select('project_code, status')
    .eq('tenant_id', tenant)
    .in('status', ['planning', 'estimated', 'negotiating', 'active']);

  // Mock appointments (would come from CRM in real app)
  const appointments_week = 12;

  // Get quotes submitted this month
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const { data: quotes } = await supabase
    .from('drm.projects')
    .select('project_code')
    .eq('tenant_id', tenant)
    .in('status', ['estimated', 'negotiating', 'contracted'])
    .gte('updated_at', monthStart);

  return NextResponse.json({
    stats: {
      active_projects: (projects || []).length,
      appointments_week,
      quotes_month: (quotes || []).length,
    },
  });
}
