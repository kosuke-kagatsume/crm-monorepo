'use client';
export default function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded">
      <div
        className="h-2 rounded bg-gradient-to-r from-blue-500 to-cyan-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
