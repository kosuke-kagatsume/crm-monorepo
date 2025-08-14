import { NextResponse } from 'next/server';
import { getDB } from '../../route';

interface StockItem {
  skuId: string;
  qty: number;
}

interface StockAvailability {
  skuId: string;
  requested: number;
  available: number;
  reserved: number;
  shortage: number;
}

// 在庫予約
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const DB = getDB();
  const body = await req.json();
  const { items }: { items: StockItem[] } = body;
  
  const estimate = DB.find(est => est.id === params.id);
  
  if (!estimate) {
    return NextResponse.json(
      { error: 'Estimate not found' },
      { status: 404 }
    );
  }
  
  // 入力バリデーション
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Invalid stock items' },
      { status: 400 }
    );
  }
  
  // モック：在庫チェック（後でsvc-inventoryに差し替え）
  const stockAvailability: StockAvailability[] = items.map(item => {
    // ランダムに在庫状況を生成（デモ用）
    const available = Math.floor(Math.random() * 100) + 10;
    const reserved = Math.floor(Math.random() * 20);
    const actualAvailable = available - reserved;
    const shortage = Math.max(0, item.qty - actualAvailable);
    
    // 特定のSKUで在庫不足をシミュレート
    if (item.skuId === 'SKU-KIT-001') {
      return {
        skuId: item.skuId,
        requested: item.qty,
        available: 0,
        reserved: 0,
        shortage: item.qty
      };
    }
    
    return {
      skuId: item.skuId,
      requested: item.qty,
      available: actualAvailable,
      reserved: shortage === 0 ? item.qty : actualAvailable,
      shortage
    };
  });
  
  // 在庫不足チェック
  const hasShortage = stockAvailability.some(item => item.shortage > 0);
  const totalShortage = stockAvailability.reduce((sum, item) => sum + item.shortage, 0);
  
  // 予約ID生成
  const bookingId = `BOOKING-${Date.now()}`;
  
  // モック：在庫予約処理
  if (!hasShortage) {
    console.log(`Stock booked successfully for estimate ${params.id}`);
    stockAvailability.forEach(item => {
      console.log(`Reserved ${item.reserved} units of ${item.skuId}`);
    });
  } else {
    console.log(`Stock shortage detected for estimate ${params.id}`);
  }
  
  // レスポンス
  const response = {
    bookingId,
    estimateId: params.id,
    status: hasShortage ? 'partial' : 'complete',
    items: stockAvailability,
    summary: {
      totalRequested: items.reduce((sum, item) => sum + item.qty, 0),
      totalAvailable: stockAvailability.reduce((sum, item) => sum + item.available, 0),
      totalReserved: stockAvailability.reduce((sum, item) => sum + item.reserved, 0),
      totalShortage
    },
    recommendations: hasShortage ? {
      message: '在庫不足があります。以下の対応をご検討ください。',
      actions: [
        '代替品の検討',
        '納期の調整',
        '追加発注の手配',
        '他店舗からの在庫移動'
      ],
      alternativeSuppliers: [
        { name: 'サプライヤーA', leadTime: 3, hasStock: true },
        { name: 'サプライヤーB', leadTime: 5, hasStock: true }
      ]
    } : null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後
  };
  
  return NextResponse.json(response);
}