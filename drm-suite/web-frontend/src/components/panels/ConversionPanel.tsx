'use client';
import { useEffect, useState } from 'react';

type P = { tenant: string };
type Conversion = {
  total_leads: number;
  converted_leads: number;
  total_quotes: number;
  won_quotes: number;
  avg_deal_size: number;
  conversion_rate: number;
  win_rate: number;
};

export default function ConversionPanel({ tenant }: P) {
  const [metrics, setMetrics] = useState<Conversion | null>(null);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/sales/conversion?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setMetrics(d.metrics || null))
      .catch(() => setMetrics(null));
  }, [tenant]);

  if (!metrics) return null;

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-3">コンバージョン率</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">リード→商談</span>
            <span className="font-medium">
              {metrics.conversion_rate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${metrics.conversion_rate}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.converted_leads} / {metrics.total_leads} 件
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">商談→受注</span>
            <span className="font-medium">{metrics.win_rate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${metrics.win_rate}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {metrics.won_quotes} / {metrics.total_quotes} 件
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">平均受注額</span>
            <span className="font-medium">{fmt(metrics.avg_deal_size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n);
}
