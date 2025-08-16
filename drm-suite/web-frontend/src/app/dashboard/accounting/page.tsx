'use client';
import { useEffect, useState } from 'react';
import MetricCard from '@/components/ui/MetricCard';
import VariancePanel from '@/components/panels/VariancePanel';
import AgingPanel from '@/components/panels/AgingPanel';
import VendorAnalytics from '@/components/panels/VendorAnalytics';

type Totals = {
  estimate_revenue_ex: number;
  estimate_cost_ex: number;
  committed_cost_ex: number;
  actual_cost_ex: number;
  gross_ex: number;
};
type PayablesBucket = Record<string, number>;
type Payable = {
  ap_no: string;
  amount_ex: number;
  pay_due_date: string;
  project_code: string;
  vendor_name: string;
};

export default function AccountingDash() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [totals, setTotals] = useState<Totals | null>(null);
  const [buckets, setBuckets] = useState<PayablesBucket>({});
  const [list, setList] = useState<Payable[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    if (!tenant) return setErr('tenant UUID を入力してください');
    setErr('');
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/finance/accounting/summary?tenant=${tenant}`),
      fetch(`/api/finance/accounting/payables?tenant=${tenant}`),
    ]);
    const sJson = await sRes.json();
    const pJson = await pRes.json();
    if (!sRes.ok) return setErr(sJson.error || 'summary error');
    if (!pRes.ok) return setErr(pJson.error || 'payables error');
    setTotals(sJson.totals);
    setBuckets(sJson.payables_by_month);
    setList(pJson);
  }

  useEffect(() => {
    if (tenant) load();
  }, []);

  return (
    <main className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">経理ダッシュ（実数）</h1>

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
          <div className="grid md:grid-cols-3 gap-3">
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

          <div className="grid md:grid-cols-3 gap-3">
            <VariancePanel tenant={tenant} />
            <AgingPanel tenant={tenant} />
            <VendorAnalytics tenant={tenant} />
          </div>
        </>
      )}

      <div className="border rounded p-4">
        <div className="font-medium mb-2">支払予定（今月〜3ヶ月）</div>
        <table className="text-sm">
          <tbody>
            {Object.entries(buckets).map(([ym, amt]) => (
              <tr key={ym}>
                <td className="pr-4 py-1">{ym}</td>
                <td className="py-1">
                  {new Intl.NumberFormat('ja-JP').format(amt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded p-4">
        <div className="font-medium mb-2">
          支払予定一覧（仕入先別／期日昇順）
        </div>
        <div className="overflow-auto">
          <table className="min-w-[720px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">支払期日</th>
                <th className="py-2 pr-3">仕入先</th>
                <th className="py-2 pr-3">現場</th>
                <th className="py-2 pr-3">請求金額(税抜)</th>
                <th className="py-2 pr-3">AP番号</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.ap_no} className="border-b last:border-0">
                  <td className="py-1 pr-3">{r.pay_due_date}</td>
                  <td className="py-1 pr-3">{r.vendor_name || '-'}</td>
                  <td className="py-1 pr-3">{r.project_code || '-'}</td>
                  <td className="py-1 pr-3">{fmt(r.amount_ex)}</td>
                  <td className="py-1 pr-3">{r.ap_no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        ※ 入金予定・未回収は
        ARテーブル追加後に配線予定（現状はAP=支払のみ対応）。
      </div>
    </main>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n);
}
