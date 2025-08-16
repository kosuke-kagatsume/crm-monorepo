'use client';

// Named export for existing imports
export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: any;
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}) {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Default export for new dash
export default function BadgeNew({
  children,
  tone = 'gray',
}: {
  children: any;
  tone?: 'gray' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const map: any = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${map[tone]}`}>
      {children}
    </span>
  );
}
