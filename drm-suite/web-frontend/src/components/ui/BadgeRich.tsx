'use client';
export default function Badge({
  children,
  tone = 'gray',
}: {
  children: any;
  tone?: 'gray' | 'green' | 'red' | 'amber' | 'blue' | 'purple';
}) {
  const map: any = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${map[tone]}`}>
      {children}
    </span>
  );
}
