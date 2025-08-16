'use client';
import { useEffect, useState } from 'react';

type P = { tenant: string };
type Variance = {
  project_code: string;
  project_name: string;
  estimate_cost: number;
  actual_cost: number;
  variance: number;
  variance_pct: number;
};

export default function VariancePanel({ tenant }: P) {
  const [variances, setVariances] = useState<Variance[]>([]);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/finance/variance?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setVariances(d.variances || []))
      .catch(() => setVariances([]));
  }, [tenant]);

  if (!variances.length) return null;

  const overBudget = variances.filter((v) => v.variance < 0);

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-3">予実差異アラート</h3>

      {overBudget.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm text-red-600">
            {overBudget.length}件の案件が予算超過
          </div>
          <div className="space-y-1">
            {overBudget.slice(0, 5).map((v) => (
              <div
                key={v.project_code}
                className="text-sm border-l-4 border-red-500 pl-2"
              >
                <div className="font-medium">{v.project_code}</div>
                <div className="text-xs text-gray-600">
                  予算: {fmt(v.estimate_cost)} → 実績: {fmt(v.actual_cost)}
                  <span className="text-red-600 ml-2">
                    ({v.variance_pct.toFixed(1)}% 超過)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-green-600">全案件が予算内で推移中</div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(n);
}
