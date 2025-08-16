'use client';
import { useEffect, useState } from 'react';
import Sparkline from '@/components/ui/Sparkline';

type P = { tenant: string };
type Trend = { month: string; revenue: number; cost: number; gross: number };

export default function TrendPanel({ tenant }: P) {
  const [trends, setTrends] = useState<Trend[]>([]);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/finance/trends?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setTrends(d.trends || []))
      .catch(() => setTrends([]));
  }, [tenant]);

  if (!trends.length) return null;

  const revPoints = trends.map((t) => t.revenue);
  const costPoints = trends.map((t) => t.cost);
  const grossPoints = trends.map((t) => t.gross);

  return (
    <div className="border rounded p-4 space-y-3">
      <h3 className="font-medium">過去6ヶ月トレンド</h3>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600 mb-1">売上推移</div>
          <Sparkline points={revPoints} color="#10b981" />
          <div className="text-xs mt-1">
            {fmt(revPoints[revPoints.length - 1])}
          </div>
        </div>

        <div>
          <div className="text-gray-600 mb-1">原価推移</div>
          <Sparkline points={costPoints} color="#ef4444" />
          <div className="text-xs mt-1">
            {fmt(costPoints[costPoints.length - 1])}
          </div>
        </div>

        <div>
          <div className="text-gray-600 mb-1">粗利推移</div>
          <Sparkline points={grossPoints} color="#3b82f6" />
          <div className="text-xs mt-1">
            {fmt(grossPoints[grossPoints.length - 1])}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        {trends[0].month} - {trends[trends.length - 1].month}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(n);
}
