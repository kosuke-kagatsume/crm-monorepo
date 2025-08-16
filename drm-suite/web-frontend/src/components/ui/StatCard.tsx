'use client';
import Sparkline from './Sparkline';
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
  delta?: { value: number; unit?: string };
  spark?: number[];
}) {
  const v =
    value == null
      ? '-'
      : typeof value === 'number'
        ? new Intl.NumberFormat('ja-JP').format(value)
        : value;
  const tone = !delta
    ? 'bg-white/10 text-white'
    : delta.value > 0
      ? 'bg-green-50 text-green-700'
      : delta.value < 0
        ? 'bg-red-50 text-red-700'
        : 'bg-gray-50 text-gray-600';
  return (
    <div className="card-solid p-4">
      <div className="text-xs text-gray-600 dark:text-gray-400">{title}</div>
      <div className="flex items-end gap-2 mt-1">
        <div className="text-2xl font-semibold">{v}</div>
        {delta && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${tone}`}>
            {delta.value > 0 ? '▲' : delta.value < 0 ? '▼' : '='}{' '}
            {Math.abs(delta.value)}
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
