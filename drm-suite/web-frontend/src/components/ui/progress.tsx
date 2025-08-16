'use client';

// Named export for existing imports
export function Progress({
  value = 0,
  className = '',
}: {
  value?: number;
  className?: string;
}) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
    >
      <div
        className="h-full bg-blue-600 transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// Default export for new dash
export default function ProgressNew({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full h-2 bg-gray-100 rounded">
      <div className="h-2 rounded bg-blue-600" style={{ width: `${v}%` }} />
    </div>
  );
}
