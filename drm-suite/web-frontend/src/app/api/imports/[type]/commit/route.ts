// src/app/api/imports/[type]/commit/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toUtf8 } from '@/lib/csv/encoding';
import { parseCsv } from '@/lib/csv/parse';
import { EstimateRow, PORow, BillRow } from '@/lib/csv/schemas';
import { z } from 'zod';

/** ====== Supabase クライアント ======
 * 優先: リクエストの Authorization(JWT) を使用 → RLS で tenant_id を解決
 * 代替: SERVICE_ROLE があればそれで実行（RLS無視）。この場合は tenant_id を必ず明示して投入。
 */
function getSupabase(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const headerAuth = req.headers.get('authorization');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const key = headerAuth ? anonKey : (serviceKey ?? anonKey);
  const headers: Record<string, string> = {};
  if (headerAuth) headers['Authorization'] = headerAuth;
  else if (serviceKey) headers['Authorization'] = `Bearer ${serviceKey}`;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers },
  });
}

/** 数値/日付 正規化 */
const toNum = (v: any) => {
  if (v === null || v === undefined || v === '') return null;
  return Number(String(v).replace(/[,￥\s]/g, ''));
};
const toDateStr = (v: any) => {
  if (!v) return null;
  const s = String(v).trim().replace(/[.\/]/g, '-');
  // YYYY-M-D を YYYY-MM-DD に
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const mm = m[2].padStart(2, '0');
    const dd = m[3].padStart(2, '0');
    return `${m[1]}-${mm}-${dd}`;
  }
  return s;
};

/** Zod で最終チェック（全行） */
const schemas = {
  estimate: EstimateRow,
  po: PORow,
  bill: BillRow,
};

type CSVType = keyof typeof schemas;

/** アップサート（チャンク） */
async function upsertChunk<T extends Record<string, any>>(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  data: T[],
  onConflict: string,
  chunkSize = 1000,
) {
  let inserted = 0;
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const { error, count } = await supabase.from(table).upsert(chunk, {
      onConflict,
      ignoreDuplicates: false,
      count: 'exact',
    });
    if (error) throw new Error(`${table} upsert error: ${error.message}`);
    inserted += count ?? chunk.length;
  }
  return inserted;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase(req);
    const type = req.nextUrl.searchParams.get('type') as CSVType | null;
    if (!type || !(type in schemas)) {
      return NextResponse.json(
        { error: 'invalid type (estimate|po|bill)' },
        { status: 400 },
      );
    }

    // SERVICE_ROLE 経由で入れる場合は tenant をクエリ必須
    const tenantIdParam = req.nextUrl.searchParams.get('tenant') ?? undefined;

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file)
      return NextResponse.json({ error: 'file required' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const text = toUtf8(buf);

    // 解析
    const rawRows = parseCsv(text);

    // スキーマ検証（全行）
    const schema = schemas[type];
    const errors: any[] = [];
    const rows: any[] = [];
    rawRows.forEach((r: any, idx: number) => {
      const res = schema.safeParse(r);
      if (!res.success) {
        errors.push({ row: idx + 2, issues: res.error.issues });
      } else {
        rows.push(res.data);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'validation error',
          total: rawRows.length,
          valid: rows.length,
          errors: errors.slice(0, 50),
        },
        { status: 400 },
      );
    }

    // 変換して投入
    let inserted = 0;

    if (type === 'estimate') {
      // drm.projects を先に upsert（存在しない可能性）
      const projectCodes = Array.from(
        new Set(rows.map((r: any) => r['現場コード'])),
      );
      if (projectCodes.length > 0) {
        const projectsPayload = projectCodes.map((code: string) => ({
          project_code: code,
          project_name: code, // 名前が無い場合はいったんコードをセット
          tenant_id: tenantIdParam, // SERVICE_ROLE時のみ使用。RLS時はDB側でJWTから解決
        }));
        // projects は PK=project_code なので onConflict は project_code
        const { error } = await supabase
          .from('drm.projects')
          .upsert(projectsPayload, {
            onConflict: 'project_code',
            ignoreDuplicates: true,
          });
        if (error) throw new Error(`projects upsert error: ${error.message}`);
      }

      const lines = rows.map((r: any) => ({
        project_code: r['現場コード'],
        estimate_no: r['見積番号'],
        estimate_date: toDateStr(r['見積日']),
        line_no: Number(r['行番号']),
        category: r['分類'] ?? null,
        sku: r['品番'] ?? null,
        item_name: r['品名'],
        spec: r['規格'] ?? null,
        quantity: toNum(r['数量']),
        unit: r['単位'],
        cost_unit_ex:
          r['原価単価(税抜)'] != null ? toNum(r['原価単価(税抜)']) : null,
        price_unit_ex: toNum(r['販売単価(税抜)']),
        tax_rate: r['税率(%)'] != null ? toNum(r['税率(%)']) : 10,
        note: r['備考'] ?? null,
        tenant_id: tenantIdParam,
      }));

      inserted = await upsertChunk(
        supabase,
        'drm.estimate_lines',
        lines,
        'project_code,estimate_no,line_no',
      );
    } else if (type === 'po') {
      // POヘッダと明細を分けて投入
      const poHeaderMap = new Map<string, any>(); // po_no -> header
      const poLines: any[] = [];

      for (const r of rows) {
        const po_no = r['発注番号'];
        if (!poHeaderMap.has(po_no)) {
          poHeaderMap.set(po_no, {
            po_no,
            project_code: r['現場コード'],
            order_date: toDateStr(r['発注日']),
            vendor_code: r['発注先コード'],
            vendor_name: r['発注先名'] ?? null,
            tenant_id: tenantIdParam,
          });
        }
        poLines.push({
          po_no,
          line_no: Number(r['行番号']),
          category: r['分類'] ?? null,
          sku: r['品番'] ?? null,
          item_name: r['品名'],
          quantity: toNum(r['数量']),
          unit: r['単位'],
          unit_cost_ex: toNum(r['仕入単価(税抜)']),
          tax_rate: r['税率(%)'] != null ? toNum(r['税率(%)']) : 10,
          due_date: toDateStr(r['納期']),
          note: r['備考'] ?? null,
          tenant_id: tenantIdParam,
        });
      }

      // projects も先に upsert（現場コードがあれば）
      const projectCodes = Array.from(
        new Set(
          Array.from(poHeaderMap.values()).map((h: any) => h.project_code),
        ),
      );
      if (projectCodes.length > 0) {
        const projectsPayload = projectCodes.map((code: string) => ({
          project_code: code,
          project_name: code,
          tenant_id: tenantIdParam,
        }));
        const { error } = await supabase
          .from('drm.projects')
          .upsert(projectsPayload, {
            onConflict: 'project_code',
            ignoreDuplicates: true,
          });
        if (error) throw new Error(`projects upsert error: ${error.message}`);
      }

      // ヘッダ → 明細の順で
      const headers = Array.from(poHeaderMap.values());
      await upsertChunk(supabase, 'drm.purchase_orders', headers, 'po_no');
      inserted = await upsertChunk(
        supabase,
        'drm.purchase_order_lines',
        poLines,
        'po_no,line_no',
      );
    } else if (type === 'bill') {
      const bills = rows.map((r: any) => ({
        ap_no: r['仕入請求番号'],
        po_no: r['発注番号'],
        invoice_date: toDateStr(r['請求日']),
        pay_due_date: toDateStr(r['支払予定日']),
        line_no: Number(r['行番号'] ?? 1),
        sku: r['品番'] ?? null,
        item_name: r['品名'],
        quantity: toNum(r['数量'] ?? null),
        unit: r['単位'] ?? null,
        amount_ex: toNum(r['請求金額(税抜)']),
        tax_rate: r['税率(%)'] != null ? toNum(r['税率(%)']) : 10,
        note: r['備考'] ?? null,
        tenant_id: tenantIdParam,
      }));

      inserted = await upsertChunk(supabase, 'drm.ap_invoices', bills, 'ap_no');
    }

    // 集計MVを更新（存在すれば）
    try {
      await supabase.rpc('refresh_finance'); // SQL 定義があれば RPC 経由でも OK
    } catch {
      // RPC 未作成でも無視（後で PROMPT 5 で作成済みのはず）
    }

    return NextResponse.json({
      type,
      received: rows.length,
      inserted,
      status: 'ok',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown error' },
      { status: 500 },
    );
  }
}
