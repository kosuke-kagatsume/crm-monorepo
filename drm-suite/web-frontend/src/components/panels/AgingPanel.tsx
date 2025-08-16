'use client';
import { useEffect, useState } from 'react';
import Sparkline from '@/components/ui/Sparkline';

type P = { tenant: string };
type Aging = {
  current: number;
  days_30: number;
  days_60: number;
  days_90: number;
  over_90: number;
};

export default function AgingPanel({ tenant }: P) {
  const [aging, setAging] = useState<Aging | null>(null);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/finance/aging?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setAging(d.aging || null))
      .catch(() => setAging(null));
  }, [tenant]);

  if (!aging) return null;

  const total =
    aging.current +
    aging.days_30 +
    aging.days_60 +
    aging.days_90 +
    aging.over_90;
  const points = [
    aging.current,
    aging.days_30,
    aging.days_60,
    aging.days_90,
    aging.over_90,
  ];

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-3">買掛金エージング</h3>

      <div className="mb-3">
        <Sparkline points={points} color="#ef4444" width={200} height={60} />
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">当月</span>
          <span>{fmt(aging.current)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">30日以内</span>
          <span>{fmt(aging.days_30)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">60日以内</span>
          <span>{fmt(aging.days_60)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">90日以内</span>
          <span className={aging.days_90 > 0 ? 'text-orange-600' : ''}>
            {fmt(aging.days_90)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">90日超過</span>
          <span className={aging.over_90 > 0 ? 'text-red-600 font-medium' : ''}>
            {fmt(aging.over_90)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t font-medium">
          <span>合計</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n);
}
