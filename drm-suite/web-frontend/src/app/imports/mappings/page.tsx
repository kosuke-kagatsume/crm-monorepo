'use client';
import { useEffect, useMemo, useState } from 'react';

type CSVType = 'estimate' | 'po' | 'bill';
const TYPES: { key: CSVType; label: string; std: string[] }[] = [
  {
    key: 'estimate',
    label: '見積（estimate）',
    std: [
      '現場コード',
      '見積番号',
      '見積日',
      '行番号',
      '分類',
      '品番',
      '品名',
      '規格',
      '数量',
      '単位',
      '原価単価(税抜)',
      '販売単価(税抜)',
      '税率(%)',
      '備考',
    ],
  },
  {
    key: 'po',
    label: '発注（po）',
    std: [
      '現場コード',
      '発注番号',
      '発注日',
      '発注先コード',
      '発注先名',
      '行番号',
      '分類',
      '品番',
      '品名',
      '数量',
      '単位',
      '仕入単価(税抜)',
      '税率(%)',
      '納期',
      '備考',
    ],
  },
  {
    key: 'bill',
    label: '仕入請求（bill）',
    std: [
      '発注番号',
      '仕入請求番号',
      '請求日',
      '支払予定日',
      '行番号',
      '品番',
      '品名',
      '数量',
      '単位',
      '請求金額(税抜)',
      '税率(%)',
      '備考',
    ],
  },
];

type Mapping = {
  id?: string;
  tenant_id: string;
  type: CSVType;
  template_name: string;
  header_map: Record<string, string>;
};

export default function MappingPage() {
  const [tenant, setTenant] = useState<string>(
    process.env.NEXT_PUBLIC_TENANT_ID || '',
  );
  const [type, setType] = useState<CSVType>('estimate');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Mapping[]>([]);
  const std = useMemo(() => TYPES.find((t) => t.key === type)!.std, [type]);

  useEffect(() => {
    if (tenant) loadTemplates();
  }, [tenant, type]);

  async function loadTemplates() {
    const res = await fetch(
      `/api/imports/mappings?tenant=${tenant}&type=${type}`,
    );
    setTemplates(await res.json());
  }

  async function inspectFile() {
    if (!file) return alert('CSVファイルを選択');
    const text = await file.text();
    const line = text.split(/\r?\n/)[0] || '';
    const cols = line
      .split(',')
      .map((s) => s.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
    setHeaders(cols);
    // 既知のautoマップ（完全一致）
    const m: Record<string, string> = {};
    for (const h of cols) {
      const hit =
        std.find((s) => s === h) ||
        std.find((s) => s.includes(h) || h.includes(s));
      if (hit) m[h] = hit;
    }
    setMapping(m);
  }

  const setMap = (src: string, dst: string) =>
    setMapping((prev) => ({ ...prev, [src]: dst }));

  async function saveTemplate() {
    const template_name = prompt('テンプレート名を入力');
    if (!template_name) return;
    const body: Mapping = {
      tenant_id: tenant,
      type,
      template_name,
      header_map: mapping,
    };
    const res = await fetch('/api/imports/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return alert('保存失敗');
    await loadTemplates();
    alert('保存しました');
  }

  async function applyTemplate(t: Mapping) {
    setMapping(t.header_map || {});
  }

  async function preview() {
    if (!file) return alert('CSVファイルを選択');
    const fd = new FormData();
    fd.append('csv', file);
    fd.append('header_map', JSON.stringify(mapping));
    const res = await fetch(`/api/imports/${type}/preview`, {
      method: 'POST',
      body: fd,
    });
    const json = await res.json();
    alert(
      `total=${json.total}, sample_ok=${json.sample_ok}, sample_errors=${json.sample_errors}`,
    );
  }

  async function commit() {
    if (!tenant) return alert('tenant UUID を入力');
    if (!file) return alert('CSVファイルを選択');
    const fd = new FormData();
    fd.append('csv', file);
    fd.append('header_map', JSON.stringify(mapping));
    fd.append('tenant', tenant);
    const res = await fetch(`/api/imports/${type}/commit`, {
      method: 'POST',
      body: fd,
    });
    const json = await res.json();
    alert(JSON.stringify(json, null, 2));
  }

  return (
    <main className="p-6 space-y-5 max-w-5xl">
      <h1 className="text-xl font-semibold">CSV ヘッダマッピング</h1>

      <div className="flex gap-2 items-center">
        <label className="text-sm">tenant</label>
        <input
          className="border rounded px-2 py-1 w-[360px]"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <select
          className="border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value as CSVType)}
        >
          {TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button className="border rounded px-3 py-1" onClick={inspectFile}>
          CSVのヘッダを読み取る
        </button>
      </div>

      {!!headers.length && (
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">
            ヘッダ対応（左：外部 / 右：標準）
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {headers.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <div className="w-[46%] truncate">{h}</div>
                <div className="w-[54%]">
                  <select
                    className="border rounded px-2 py-1 w-full"
                    value={mapping[h] || ''}
                    onChange={(e) => setMap(h, e.target.value)}
                  >
                    <option value="">（未設定）</option>
                    {std.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="border rounded px-3 py-1" onClick={preview}>
              プレビュー(100行)
            </button>
            <button className="border rounded px-3 py-1" onClick={commit}>
              確定インポート
            </button>
            <button className="border rounded px-3 py-1" onClick={saveTemplate}>
              テンプレ保存
            </button>
          </div>
        </div>
      )}

      <div className="border rounded p-3">
        <h2 className="font-medium mb-2">保存済みテンプレート</h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.template_name}
              className="border rounded px-3 py-1"
              onClick={() => applyTemplate(t)}
            >
              {t.template_name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
