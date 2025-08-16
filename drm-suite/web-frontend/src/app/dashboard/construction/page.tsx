'use client';
import { useEffect, useState } from 'react';
import PendingDeliveriesPanel from '@/components/panels/PendingDeliveriesPanel';

export default function ConstructionDash() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [err, setErr] = useState('');

  return (
    <main className="p-6 space-y-5">
      <h1 className="text-xl font-semibold">工務ダッシュ（実数）</h1>

      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1"
          placeholder="tenant UUID"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
      </div>
      {err && <p className="text-red-600 text-sm">{err}</p>}

      <PendingDeliveriesPanel tenant={tenant} />

      <div className="text-xs text-gray-500">
        ※ 着工予定・職人手配は別途テーブル追加後に実装予定
      </div>
    </main>
  );
}
