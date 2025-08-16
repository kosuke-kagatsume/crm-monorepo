'use client';
import { useEffect, useState } from 'react';

type P = { tenant: string };
type Delivery = {
  po_no: string;
  project_code: string;
  vendor_name: string;
  item_name: string;
  quantity: number;
  unit: string;
  delivery_date: string;
  days_until: number;
  is_overdue: boolean;
};

export default function PendingDeliveriesPanel({ tenant }: P) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<{
    pending: number;
    overdue: number;
    total_amount: number;
  }>({
    pending: 0,
    overdue: 0,
    total_amount: 0,
  });

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/construction/deliveries?tenant=${tenant}`)
      .then((r) => r.json())
      .then((d) => {
        setDeliveries(d.deliveries || []);
        setStats(d.stats || { pending: 0, overdue: 0, total_amount: 0 });
      })
      .catch(() => {
        setDeliveries([]);
        setStats({ pending: 0, overdue: 0, total_amount: 0 });
      });
  }, [tenant]);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div className="border rounded p-3">
          <div className="text-sm text-gray-600">納品待ち</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm text-gray-600">納期遅延</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm text-gray-600">未納品金額</div>
          <div className="text-xl font-bold">{fmt(stats.total_amount)}</div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h3 className="font-medium mb-3">納品予定リスト</h3>

        <div className="overflow-auto">
          <table className="min-w-[720px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">納期</th>
                <th className="py-2 pr-3">現場</th>
                <th className="py-2 pr-3">仕入先</th>
                <th className="py-2 pr-3">品目</th>
                <th className="py-2 pr-3">数量</th>
                <th className="py-2 pr-3">状態</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.slice(0, 10).map((d) => (
                <tr
                  key={`${d.po_no}-${d.item_name}`}
                  className="border-b last:border-0"
                >
                  <td
                    className={`py-1 pr-3 ${d.is_overdue ? 'text-red-600 font-medium' : ''}`}
                  >
                    {d.delivery_date}
                  </td>
                  <td className="py-1 pr-3">{d.project_code}</td>
                  <td className="py-1 pr-3">{d.vendor_name}</td>
                  <td className="py-1 pr-3">{d.item_name}</td>
                  <td className="py-1 pr-3">
                    {d.quantity} {d.unit}
                  </td>
                  <td className="py-1 pr-3">
                    {d.is_overdue ? (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        {Math.abs(d.days_until)}日遅延
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {d.days_until}日後
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('ja-JP').format(n);
}
