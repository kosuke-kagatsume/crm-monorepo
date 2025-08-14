import { NextResponse } from 'next/server';
import { getDB, updateDB } from '../route';
import { Estimate } from '@/types/estimate-v2';

// 見積詳細取得
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
  
  return NextResponse.json(estimate);
}

// 見積更新（PATCH）
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const patch = await req.json();
  const estimateIndex = DB.findIndex(est => est.id === params.id);
  
  if (estimateIndex === -1) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  const updatedEstimate: Estimate = {
    ...DB[estimateIndex],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  
  const newDB = [...DB];
  newDB[estimateIndex] = updatedEstimate;
  updateDB(newDB);
  
  return NextResponse.json(updatedEstimate);
}

// 見積更新（PUT）
export async function PUT(
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
  
  const updatedEstimate: Estimate = {
    ...body,
    id: params.id,
    updatedAt: new Date().toISOString()
  };
  
  const newDB = [...DB];
  newDB[estimateIndex] = updatedEstimate;
  updateDB(newDB);
  
  return NextResponse.json(updatedEstimate);
}

// 見積削除
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const estimateIndex = DB.findIndex(est => est.id === params.id);
  
  if (estimateIndex === -1) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  const newDB = DB.filter(est => est.id !== params.id);
  updateDB(newDB);
  
  return NextResponse.json({ message: 'Estimate deleted successfully' });
}