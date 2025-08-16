'use client';
export default function MetricCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: number | string | null;
  hint?: string;
}) {
  const v =
    value == null
      ? '-'
      : typeof value === 'number'
        ? new Intl.NumberFormat('ja-JP').format(value)
        : value;
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{v}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
