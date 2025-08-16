'use client';
import { useEffect, useState } from 'react';
import Sparkline from '@/components/ui/Sparkline';

type P = { tenant: string };
type Pipeline = {
  stage: string;
  count: number;
  value: number;
};

export default function PipelinePanel({ tenant }: P) {
  const [pipeline, setPipeline] = useState<Pipeline[]>([]);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/sales/pipeline?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setPipeline(d.pipeline || []))
      .catch(() => setPipeline([]));
  }, [tenant]);

  if (!pipeline.length) return null;

  const stages = ['リード', '商談', '見積', '受注待ち', '受注'];
  const values = stages.map(
    (s) => pipeline.find((p) => p.stage === s)?.value || 0,
  );

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-3">営業パイプライン</h3>

      <div className="mb-3">
        <Sparkline points={values} color="#10b981" width={240} height={60} />
      </div>

      <div className="space-y-2">
        {stages.map((stage) => {
          const item = pipeline.find((p) => p.stage === stage);
          if (!item) return null;

          return (
            <div key={stage} className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{stage}</span>
                <span className="text-xs bg-gray-100 px-1 rounded">
                  {item.count}件
                </span>
              </div>
              <span className="font-medium">{fmt(item.value)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t text-sm">
        <div className="flex justify-between font-medium">
          <span>合計見込み</span>
          <span>{fmt(values.reduce((a, b) => a + b, 0))}</span>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(n);
}
