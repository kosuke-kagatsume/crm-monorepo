'use client';
import { useState } from 'react';

const TYPES = [
  { key: 'estimate', label: '見積（estimate）' },
  { key: 'po', label: '発注（po）' },
  { key: 'bill', label: '仕入請求（bill）' },
] as const;

export default function ImportsPage() {
  const [type, setType] = useState<'estimate' | 'po' | 'bill'>('estimate');
  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState<string>('');
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );

  async function call(endpoint: 'preview' | 'commit') {
    if (!file) return alert('CSVファイルを選んでください');
    if (endpoint === 'commit' && !tenant)
      return alert('tenant UUID を入力してください');

    const fd = new FormData();
    fd.append('csv', file);
    if (endpoint === 'commit' && tenant) {
      fd.append('tenant', tenant);
    }
    setLog(`/${endpoint} 実行中...`);

    const res = await fetch(`/api/imports/${type}/${endpoint}`, {
      method: 'POST',
      body: fd,
    });
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
  }

  return (
    <main className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">CSV Import</h1>

      <div className="space-y-2">
        <label className="block text-sm">種別</label>
        <select
          className="border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          {TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm">CSVファイル</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm">
          tenant UUID（SERVICE_ROLEでcommitする時のみ必須）
        </label>
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          className="border rounded px-3 py-1"
          onClick={() => call('preview')}
        >
          プレビュー(100行)
        </button>
        <button
          className="border rounded px-3 py-1"
          onClick={() => call('commit')}
        >
          確定インポート
        </button>
      </div>

      <pre className="bg-black text-white text-xs p-3 rounded overflow-auto max-h-96">
        {log}
      </pre>
    </main>
  );
}
