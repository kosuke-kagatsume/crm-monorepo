'use client';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import PipelinePanel from '@/components/panels/PipelinePanel';
import ConversionPanel from '@/components/panels/ConversionPanel';

type Stats = {
  active_projects: number;
  appointments_week: number;
  quotes_month: number;
};

export default function SalesDash() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');

  async function load() {
    if (!tenant) return setErr('tenant UUID を入力してください');
    setErr('');

    const res = await fetch(`/api/sales/stats?tenant=${tenant}`);
    const json = await res.json();
    if (!res.ok) return setErr(json.error || 'error');
    setStats(json.stats);
  }

  useEffect(() => {
    if (tenant) load();
  }, []);

  return (
    <main className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">営業ダッシュ（実数）</h1>

      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1"
          placeholder="tenant UUID"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
        <button className="border rounded px-3 py-1" onClick={load}>
          更新
        </button>
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {stats && (
        <div className="grid md:grid-cols-3 gap-3">
          <MetricCard title="担当案件" value={stats.active_projects} />
          <MetricCard title="今週アポ" value={stats.appointments_week} />
          <MetricCard title="見積提出(今月)" value={stats.quotes_month} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <PipelinePanel tenant={tenant} />
        <ConversionPanel tenant={tenant} />
      </div>
    </main>
  );
}
