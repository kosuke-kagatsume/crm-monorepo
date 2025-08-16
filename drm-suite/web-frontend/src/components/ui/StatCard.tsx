'use client';
import Sparkline from './Sparkline';

type Delta = { value: number; unit?: string };
export default function StatCard({
  title,
  value,
  sub,
  delta,
  spark,
}: {
  title: string;
  value: number | string | null;
  sub?: string;
  delta?: Delta;
  spark?: number[];
}) {
  const v =
    value == null
      ? '-'
      : typeof value === 'number'
        ? new Intl.NumberFormat('ja-JP').format(value)
        : value;
  const up = delta && delta.value > 0,
    dn = delta && delta.value < 0;
  return (
    <div className="rounded-xl p-4 bg-white/80 dark:bg-neutral-900/70 shadow-sm border border-white/40 dark:border-neutral-800 backdrop-blur">
      <div className="text-xs text-gray-600 dark:text-gray-400">{title}</div>
      <div className="flex items-end gap-2 mt-1">
        <div className="text-2xl font-semibold">{v}</div>
        {delta && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${up ? 'bg-green-50 text-green-700' : dn ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}
          >
            {up ? '▲' : dn ? '▼' : '='} {Math.abs(delta.value)}
            {delta.unit ?? '%'}
          </span>
        )}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      {spark && (
        <div className="mt-2 text-gray-400">
          <Sparkline points={spark} width={180} height={36} />
        </div>
      )}
    </div>
  );
}
