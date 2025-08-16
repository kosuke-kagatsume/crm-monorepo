// src/app/api/imports/[type]/preview/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { toUtf8 } from '@/lib/csv/encoding';
import { parseCsv } from '@/lib/csv/parse';
import { EstimateRow, PORow, BillRow } from '@/lib/csv/schemas';
import { applyHeaderMap } from '@/lib/csv/map';

const validators = {
  estimate: EstimateRow,
  po: PORow,
  bill: BillRow,
} as const;

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } },
) {
  try {
    const type = params.type;
    if (!type || !(type in validators)) {
      return NextResponse.json(
        { error: 'invalid type (estimate|po|bill)' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get('csv') as File | null;
    if (!file)
      return NextResponse.json({ error: 'file required' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const text = toUtf8(buf);
    const headerMapStr = form.get('header_map') as string | null;
    let rows = parseCsv(text);
    const headerMap = headerMapStr ? JSON.parse(headerMapStr) : undefined;
    rows = applyHeaderMap(rows, headerMap);
    const schema = validators[type as keyof typeof validators];

    // 100行だけ検証
    const sample = rows.slice(0, 100);
    const errors: any[] = [];
    let okCount = 0;

    for (let i = 0; i < sample.length; i++) {
      const r = sample[i];
      const res = schema.safeParse(r);
      if (!res.success) {
        errors.push({ row: i + 2, issues: res.error.issues }); // +2 = ヘッダ＋1始まり
      } else {
        okCount++;
      }
    }

    return NextResponse.json({
      total: rows.length,
      sample_ok: okCount,
      sample_errors: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'unknown error' },
      { status: 500 },
    );
  }
}
