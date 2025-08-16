'use client';
import { useEffect, useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import Sparkline from '@/components/ui/Sparkline';
import Badge from '@/components/ui/BadgeRich';
import Progress from '@/components/ui/ProgressRich';

export default function Dash() {
  const [tenant] = useState<string>(process.env.NEXT_PUBLIC_TENANT_ID || '');
  const [data, setData] = useState<any>(null);
  const [fin, setFin] = useState<any>(null);

  async function load() {
    if (!tenant) return;
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/dash/overview?tenant=${tenant}&role=mgmt`),
        fetch(`/api/finance/accounting/summary?tenant=${tenant}`),
      ]);
      const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
      if (r1.ok) setData(j1);
      if (r2.ok) setFin(j2);
    } catch {}
  }
  useEffect(() => {
    if (tenant) load();
  }, [tenant]);

  const fmt = (n: number | null | undefined) =>
    n == null ? '-' : new Intl.NumberFormat('ja-JP').format(n);
  const cash = fin?.cash_flow || {};
  const cf_net = (cash.inflow || 0) - (cash.outflow || 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 text-white">
        <div className="container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">DRM Suite ダッシュボード</h1>
          <p className="text-white/90">リアルタイム経営指標の可視化</p>
        </div>
      </div>

      {/* Hero KPI Bar */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                総売上高
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ¥{fmt(data?.kpi?.revenue)}
              </div>
              <div className="mt-1">
                <Progress value={100} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                粗利益
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                ¥{fmt(data?.kpi?.gross)}
              </div>
              <div className="mt-1">
                <Progress value={data?.kpi?.margin || 0} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                粗利率
              </div>
              <div className="text-3xl font-bold text-indigo-600">
                {data?.kpi?.margin?.toFixed?.(1) || '-'}%
              </div>
              <div className="mt-1">
                <Progress value={data?.kpi?.margin || 0} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                キャッシュフロー
              </div>
              <div
                className={`text-3xl font-bold ${cf_net >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                ¥{fmt(cf_net)}
              </div>
              <div className="mt-1">
                <Progress
                  value={Math.abs((cf_net / (cash.inflow || 1)) * 100)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Alert Section */}
        {data && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-lg border border-white/50 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">アラート</h2>
                <div className="flex gap-2">
                  <Badge tone={data.alerts.overdue ? 'red' : 'gray'}>
                    超過 {data.alerts.overdue}
                  </Badge>
                  <Badge tone={data.alerts.pending ? 'amber' : 'gray'}>
                    未完了 {data.alerts.pending}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {data.alerts.topPending.slice(0, 3).map((r: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div>
                      <div className="font-medium">{r.project_code}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {r.vendor} / {r.due_date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">¥{fmt(r.remain)}</div>
                      {r.overdue && <Badge tone="red">超過</Badge>}
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition">
                承認画面へ →
              </button>
            </div>

            <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-lg border border-white/50 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4">キャッシュフロー</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>入金予定</span>
                    <span>¥{fmt(cash.inflow)}</span>
                  </div>
                  <Progress value={100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>支払予定</span>
                    <span>¥{fmt(cash.outflow)}</span>
                  </div>
                  <Progress
                    value={Math.abs((cash.outflow / (cash.inflow || 1)) * 100)}
                  />
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">ネットCF</span>
                    <span
                      className={`text-2xl font-bold ${cf_net >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      ¥{fmt(cf_net)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Grid */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="見積売上"
              value={data.kpi.revenue}
              spark={data.trend.revenue}
            />
            <StatCard
              title="見積原価"
              value={data.kpi.estCost}
              spark={data.trend.estCost}
            />
            <StatCard
              title="発注コミット"
              value={data.kpi.committed}
              spark={data.trend.committed}
            />
            <StatCard
              title="実績原価"
              value={data.kpi.actual}
              spark={data.trend.actual}
            />
          </div>
        )}

        {/* Trend & Variance */}
        {data && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-lg border border-white/50 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4">トレンド（6ヶ月）</h2>
              <div className="space-y-3">
                <TrendLine
                  label="売上"
                  points={data.trend.revenue}
                  color="text-blue-500"
                />
                <TrendLine
                  label="原価"
                  points={data.trend.estCost}
                  color="text-red-500"
                />
                <TrendLine
                  label="発注"
                  points={data.trend.committed}
                  color="text-amber-500"
                />
                <TrendLine
                  label="実績"
                  points={data.trend.actual}
                  color="text-green-500"
                />
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-lg border border-white/50 dark:border-gray-800">
              <h2 className="text-lg font-semibold mb-4">差異分析 TOP5</h2>
              <div className="space-y-2">
                {data.varianceTop5.map((r: any) => (
                  <div
                    key={r.project_code}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {r.project_code}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {r.name}
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${r.diff > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {r.diff > 0 ? '+' : ''}
                      {fmt(r.diff)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TrendLine({
  label,
  points,
  color,
}: {
  label: string;
  points: number[];
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-20 text-sm ${color}`}>{label}</div>
      <div className="flex-1">
        <Sparkline points={points} />
      </div>
      <div className="text-sm font-medium">
        {new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(
          points.at(-1) || 0,
        )}
      </div>
    </div>
  );
}
