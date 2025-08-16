'use client';
import { useEffect, useMemo, useState } from 'react';
import StatCard from '@/components/ui/StatCard';
import Sparkline from '@/components/ui/Sparkline';
import { demoOverview, demoPay } from '@/lib/demo';

type Role = 'mgmt' | 'branch' | 'accounting' | 'site';
type Overview = {
  kpi: {
    revenue: number;
    estCost: number;
    committed: number;
    actual: number;
    gross: number;
    margin: number;
  };
  trend: {
    months: string[];
    revenue: number[];
    estCost: number[];
    committed: number[];
    actual: number[];
  };
  alerts: {
    overdue: number;
    pending: number;
    topPending: {
      project_code: string;
      vendor: string;
      due_date: string | null;
      remain: number;
      overdue: boolean;
    }[];
  };
  varianceTop5: { project_code: string; name: string | null; diff: number }[];
};

export default function Dash() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [role, setRole] = useState<Role>('mgmt');
  const [ov, setOv] = useState<Overview | null>(null);
  const [pay, setPay] = useState<Record<string, number>>({});
  const [err, setErr] = useState('');

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    [],
  );

  async function load() {
    if (!tenant) {
      // デモモードで"映える"表示
      setOv(demoOverview() as any);
      setPay(demoPay());
      setErr('');
      return;
    }
    setErr('');
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/dash/overview?tenant=${tenant}&role=${role}`),
        fetch(`/api/finance/accounting/summary?tenant=${tenant}`),
      ]);
      const j1 = await r1.json(),
        j2 = await r2.json();
      if (!r1.ok) throw new Error(j1.error || 'overview error');
      if (!r2.ok) throw new Error(j2.error || 'summary error');
      setOv(j1);
      setPay(j2.payables_by_month || {});
    } catch (e: any) {
      // API失敗時も"映える"デモを表示しつつ右上にエラー
      setOv(demoOverview() as any);
      setPay(demoPay());
      setErr(e?.message || 'error');
    }
  }
  useEffect(() => {
    load();
  }, [role]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('ja-JP').format(Math.round(n || 0));
  const impactPct = (diff: number, base: number) =>
    !base ? 0 : Math.min(100, Math.round((Math.abs(diff) / base) * 100));

  return (
    <main className="min-h-screen text-white">
      {/* === HERO === */}
      <header className="bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs/5">{today}</div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                DRM Suite ダッシュボード
              </h1>
              <div className="text-sm opacity-90">
                リアルタイム経営指標の可視化
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleTabs value={role} onChange={setRole} />
              <input
                className="rounded px-2 py-1 text-black"
                placeholder="tenant UUID"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              />
              <button
                className="px-3 py-1 rounded bg-white/90 text-sky-700 font-semibold shadow"
                onClick={load}
              >
                更新
              </button>
            </div>
          </div>

          {/* KPI Row（スクショ風のハイライト） */}
          {ov && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <HeroStat
                label="総売上高"
                value={`¥${fmt(ov.kpi.revenue)}`}
                progress={percent(ov.kpi.revenue, ov.kpi.revenue + 1)}
              />
              <HeroStat
                label="粗利益"
                value={`¥${fmt(ov.kpi.gross)}`}
                progress={ov.kpi.margin}
              />
              <HeroStat
                label="粗利率"
                value={`${ov.kpi.margin.toFixed(1)}%`}
                progress={ov.kpi.margin}
              />
              <HeroStat
                label="キャッシュフロー"
                value={`¥${fmt(Object.values(pay).reduce((a, b) => a + b, 0))}`}
                progress={50}
              />
            </div>
          )}
        </div>
      </header>

      {/* === BODY === */}
      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {/* 右上にエラー表示（API失敗時でもデモ表示は継続） */}
        {err && (
          <div className="text-xs text-red-300 text-right">
            API Error: {err}
          </div>
        )}

        {/* 経営判断が必要な事項 */}
        {ov && (
          <section className="card-solid p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">⚠️ 経営判断が必要な事項</div>
              <div className="flex gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded ${ov.alerts.overdue ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}
                >
                  納期超過 {ov.alerts.overdue}
                </span>
                <span
                  className={`px-2 py-0.5 rounded ${ov.alerts.pending ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}
                >
                  未完了 {ov.alerts.pending}
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {ov.alerts.topPending.map((x, i) => (
                <div
                  key={i}
                  className="card-solid p-3 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {x.project_code}{' '}
                      <span className="text-gray-500">/ {x.vendor || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      期日: {x.due_date || '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-sm ${x.overdue ? 'text-red-600' : 'text-gray-700'}`}
                    >
                      ¥{fmt(x.remain)}
                    </div>
                    <button className="px-3 py-1 rounded bg-sky-600 text-white text-sm">
                      承認
                    </button>
                  </div>
                </div>
              ))}
              {!ov.alerts.topPending.length && (
                <div className="text-sm text-gray-400">
                  現在アラートはありません
                </div>
              )}
            </div>
          </section>
        )}

        {/* パフォーマンス＆差異 */}
        {ov && (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="card-solid p-4">
              <div className="font-medium mb-2">
                📈 パフォーマンス（直近6ヶ月）
              </div>
              <TrendRow label="見積売上" points={ov.trend.revenue} />
              <TrendRow label="見積原価" points={ov.trend.estCost} />
              <TrendRow label="発注コミット" points={ov.trend.committed} />
              <TrendRow label="実績原価(AP)" points={ov.trend.actual} />
            </div>
            <div className="card-solid p-4">
              <div className="font-medium mb-2">
                🧮 差異トップ5（発注−見積原価）
              </div>
              <table className="text-sm w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-2 pr-3">現場</th>
                    <th className="py-2 pr-3">名称</th>
                    <th className="py-2 pr-3">差額</th>
                    <th className="py-2 pr-3">影響</th>
                  </tr>
                </thead>
                <tbody>
                  {ov.varianceTop5.map((r) => (
                    <tr
                      key={r.project_code}
                      className="border-b last:border-0 border-gray-100"
                    >
                      <td className="py-1 pr-3">{r.project_code}</td>
                      <td className="py-1 pr-3">{r.name || '-'}</td>
                      <td className="py-1 pr-3">¥{fmt(r.diff)}</td>
                      <td className="py-1 pr-3">
                        <div className="w-full h-2 bg-gray-100 rounded">
                          <div
                            className="h-2 rounded bg-blue-600"
                            style={{
                              width: `${impactPct(r.diff, ov.kpi.revenue)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-xs text-gray-500 mt-2">
                ※ 正＝発注が見積より高い / 負＝安い
              </div>
            </div>
          </section>
        )}

        {/* キャッシュフロー + 追加カード */}
        {ov && (
          <section className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 card-solid p-4">
              <div className="font-medium mb-2">
                💵 キャッシュフロー（支払予定）
              </div>
              <table className="text-sm">
                <tbody>
                  {Object.entries(pay).map(([ym, amt]) => (
                    <tr key={ym}>
                      <td className="py-1 pr-6">{ym}</td>
                      <td className="py-1">¥{fmt(amt)}</td>
                    </tr>
                  ))}
                  {Object.keys(pay).length === 0 && (
                    <tr>
                      <td className="text-sm text-gray-400 py-1">データなし</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="space-y-3">
              <StatCard
                title="見積売上(税抜)"
                value={ov.kpi.revenue}
                sub="今期累計"
                spark={ov.trend.revenue}
              />
              <StatCard
                title="見積粗利(税抜)"
                value={ov.kpi.gross}
                sub={`粗利率 ${ov.kpi.margin.toFixed(1)}%`}
                spark={ov.trend.revenue.map(
                  (v, i) => v - (ov.trend.estCost[i] || 0),
                )}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ===== helpers ===== */
function RoleTabs({
  value,
  onChange,
}: {
  value: Role;
  onChange: (v: Role) => void;
}) {
  const items: [string, Role][] = [
    ['経営', 'mgmt'],
    ['支店', 'branch'],
    ['経理', 'accounting'],
    ['工務', 'site'],
  ];
  return (
    <div className="flex bg-white/20 rounded-lg overflow-hidden">
      {items.map(([label, val]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`px-3 py-1 text-sm ${value === val ? 'bg-white text-sky-700' : 'text-white/90'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
function HeroStat({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur p-4 border border-white/25">
      <div className="text-xs text-white/90">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-2">
        <div className="w-full h-2 bg-white/20 rounded">
          <div className="h-2 rounded bg-white" style={{ width: `${p}%` }} />
        </div>
      </div>
    </div>
  );
}
function TrendRow({ label, points }: { label: string; points: number[] }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-28 text-xs text-gray-500">{label}</div>
      <Sparkline points={points} />
    </div>
  );
}
function percent(a: number, b: number) {
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}
