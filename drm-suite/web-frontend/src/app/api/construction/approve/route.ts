export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST() {
  // ここで本実装時はDB更新 or ワークフロー起動
  return NextResponse.json({ ok: true, approved_at: new Date().toISOString() });
}
