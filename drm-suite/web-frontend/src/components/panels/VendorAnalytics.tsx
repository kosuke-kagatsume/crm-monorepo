'use client';
import { useEffect, useState } from 'react';

type P = { tenant: string };
type Vendor = {
  vendor_code: string;
  vendor_name: string;
  total_amount: number;
  invoice_count: number;
  avg_payment_days: number;
};

export default function VendorAnalytics({ tenant }: P) {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/finance/vendors?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors || []))
      .catch(() => setVendors([]));
  }, [tenant]);

  if (!vendors.length) return null;

  return (
    <div className="border rounded p-4">
      <h3 className="font-medium mb-3">仕入先別分析 (Top 5)</h3>

      <div className="space-y-2">
        {vendors.slice(0, 5).map((v) => (
          <div
            key={v.vendor_code}
            className="border-b last:border-0 pb-2 last:pb-0"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">{v.vendor_name}</div>
                <div className="text-xs text-gray-600">
                  {v.invoice_count}件 / 平均{v.avg_payment_days}日
                </div>
              </div>
              <div className="text-sm font-medium">{fmt(v.total_amount)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        合計: {vendors.length}社 /{' '}
        {fmt(vendors.reduce((sum, v) => sum + v.total_amount, 0))}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(n);
}
