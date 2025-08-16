'use client';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import TrendPanel from '@/components/panels/TrendPanel';

type Totals = {
  estimate_revenue_ex: number;
  estimate_cost_ex: number;
  committed_cost_ex: number;
  actual_cost_ex: number;
  gross_ex: number;
};
type Row = {
  project_code: string;
  project_name: string;
  estimate_revenue_ex: number;
  estimate_cost_ex: number;
  committed_cost_ex: number;
  actual_cost_ex: number;
  gross_ex: number;
  gross_margin_pct: number | null;
};

export default function OwnerDashboard() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [totals, setTotals] = useState<Totals | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    if (!tenant) return setErr('tenant UUID を入力してください');
    setErr('');
    const res = await fetch(`/api/finance/owner/projects?tenant=${tenant}`);
    const json = await res.json();
    if (!res.ok) return setErr(json.error || 'error');
    setTotals(json.totals);
    setRows(json.rows);
  }

  useEffect(() => {
    if (tenant) load();
  }, []);

  return (
    <main className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">経営ダッシュ（実数）</h1>

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

      {totals && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MetricCard
              title="見積売上(税抜)"
              value={totals.estimate_revenue_ex}
            />
            <MetricCard
              title="見積原価(税抜)"
              value={totals.estimate_cost_ex}
            />
            <MetricCard
              title="発注コミット原価"
              value={totals.committed_cost_ex}
            />
            <MetricCard title="実績原価(AP)" value={totals.actual_cost_ex} />
            <MetricCard title="見積粗利(税抜)" value={totals.gross_ex} />
          </div>

          <TrendPanel tenant={tenant} />
        </>
      )}

      <div className="border rounded p-4">
        <div className="font-medium mb-3">案件別 収支サマリ</div>
        <div className="overflow-auto">
          <table className="min-w-[720px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">現場コード</th>
                <th className="py-2 pr-3">名称</th>
                <th className="py-2 pr-3">売上(見積)</th>
                <th className="py-2 pr-3">原価(見積)</th>
                <th className="py-2 pr-3">原価(発注)</th>
                <th className="py-2 pr-3">原価(実績)</th>
                <th className="py-2 pr-3">粗利</th>
                <th className="py-2 pr-3">粗利率%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.project_code} className="border-b last:border-0">
                  <td className="py-1 pr-3">{r.project_code}</td>
                  <td className="py-1 pr-3">{r.project_name || '-'}</td>
                  <td className="py-1 pr-3">{fmt(r.estimate_revenue_ex)}</td>
                  <td className="py-1 pr-3">{fmt(r.estimate_cost_ex)}</td>
                  <td className="py-1 pr-3">{fmt(r.committed_cost_ex)}</td>
                  <td className="py-1 pr-3">{fmt(r.actual_cost_ex)}</td>
                  <td className="py-1 pr-3">{fmt(r.gross_ex)}</td>
                  <td className="py-1 pr-3">
                    {r.gross_margin_pct == null
                      ? '-'
                      : r.gross_margin_pct.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function fmt(n: number | null | undefined) {
  if (n == null) return '-';
  return new Intl.NumberFormat('ja-JP').format(n);
}
