import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDB, updateDB } from '../../route';
import { EstimateVersion } from '@/types/estimate-v2';

// バージョン追加
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const body = await req.json();
  const estimateIndex = DB.findIndex(est => est.id === params.id);
  
  if (estimateIndex === -1) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  const estimate = DB[estimateIndex];
  const currentVersion = estimate.versions.find(v => v.id === estimate.selectedVersionId);
  
  // 新しいバージョンを作成（現在のバージョンをベースに）
  const newVersion: EstimateVersion = {
    id: body.id || randomUUID(),
    label: body.label || `v${estimate.versions.length + 1}`,
    createdAt: new Date().toISOString(),
    items: body.items || currentVersion?.items || [],
    notes: body.notes,
    selectedVendorIds: body.selectedVendorIds
  };
  
  // 見積を更新
  const updatedEstimate = {
    ...estimate,
    versions: [...estimate.versions, newVersion],
    selectedVersionId: newVersion.id, // 新しいバージョンを選択
    updatedAt: new Date().toISOString()
  };
  
  const newDB = [...DB];
  newDB[estimateIndex] = updatedEstimate;
  updateDB(newDB);
  
  return NextResponse.json({
    message: 'Version added successfully',
    version: newVersion,
    estimate: updatedEstimate
  });
}

// バージョン一覧取得
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const estimate = DB.find(est => est.id === params.id);
  
  if (!estimate) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    versions: estimate.versions,
    selectedVersionId: estimate.selectedVersionId
  });
}