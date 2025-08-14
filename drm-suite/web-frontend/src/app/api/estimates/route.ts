import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Estimate } from '@/types/estimate-v2';

// メモリ仮DB（UAT後に実DBへ）
let DB: Estimate[] = [
  // 初期サンプルデータ
  {
    id: '1',
    customerId: 'CUST-001',
    title: '山田様邸 外壁塗装工事',
    storeId: 'STORE-001',
    method: 'シリコン塗装',
    structure: '木造2階建て',
    category: '戸建住宅',
    versions: [
      {
        id: 'v1',
        label: 'v1',
        createdAt: '2024-01-15T10:00:00Z',
        items: [
          { id: '1', name: '足場設置・撤去', qty: 1, unit: '式', price: 150000, cost: 100000 },
          { id: '2', name: '高圧洗浄', qty: 100, unit: '㎡', price: 300, cost: 150 },
          { id: '3', name: '外壁塗装（シリコン）', qty: 100, unit: '㎡', price: 3500, cost: 2000 },
          { id: '4', name: '付帯部塗装', qty: 1, unit: '式', price: 80000, cost: 50000 }
        ]
      },
      {
        id: 'v2',
        label: 'v2',
        createdAt: '2024-01-16T10:00:00Z',
        items: [
          { id: '1', name: '足場設置・撤去', qty: 1, unit: '式', price: 150000, cost: 100000 },
          { id: '2', name: '高圧洗浄', qty: 100, unit: '㎡', price: 300, cost: 150 },
          { id: '3', name: '外壁塗装（フッ素）', qty: 100, unit: '㎡', price: 4500, cost: 2800 },
          { id: '4', name: '付帯部塗装', qty: 1, unit: '式', price: 80000, cost: 50000 },
          { id: '5', name: '防水工事', qty: 1, unit: '式', price: 120000, cost: 70000 }
        ]
      }
    ],
    selectedVersionId: 'v2',
    approval: {
      steps: [
        { role: 'manager', threshold: 500000 },
        { role: 'director', threshold: 1000000 }
      ],
      status: 'approved'
    },
    paymentPlan: {
      depositPct: 30,
      middlePct: 40,
      finalPct: 30
    },
    createdBy: 'USER-001',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T15:00:00Z'
  },
  {
    id: '2',
    customerId: 'CUST-002',
    title: '鈴木様邸 屋根修理工事',
    storeId: 'STORE-001',
    method: '瓦交換',
    structure: '木造平屋',
    category: '戸建住宅',
    versions: [
      {
        id: 'v1',
        label: 'v1',
        createdAt: '2024-01-20T10:00:00Z',
        items: [
          { id: '1', name: '足場設置・撤去', qty: 1, unit: '式', price: 80000, cost: 50000 },
          { id: '2', name: '既存瓦撤去', qty: 30, unit: '㎡', price: 2000, cost: 1200 },
          { id: '3', name: '防水シート張替', qty: 30, unit: '㎡', price: 1500, cost: 800 },
          { id: '4', name: '新規瓦設置', qty: 30, unit: '㎡', price: 6000, cost: 4000 },
          { id: '5', name: '廃材処分費', qty: 1, unit: '式', price: 30000, cost: 20000 }
        ]
      }
    ],
    selectedVersionId: 'v1',
    approval: {
      steps: [{ role: 'manager', threshold: 500000 }],
      status: 'pending'
    },
    createdBy: 'USER-002',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '3',
    customerId: 'CUST-003',
    title: '田中様邸 キッチンリフォーム',
    storeId: 'STORE-002',
    method: 'システムキッチン交換',
    structure: 'マンション',
    category: 'リフォーム',
    versions: [
      {
        id: 'v1',
        label: 'v1',
        createdAt: '2024-01-22T10:00:00Z',
        items: [
          { id: '1', name: '既存キッチン撤去', qty: 1, unit: '式', price: 50000, cost: 30000 },
          { id: '2', name: 'システムキッチン本体', qty: 1, unit: '台', price: 800000, cost: 600000, skuId: 'SKU-KIT-001' },
          { id: '3', name: '設置工事', qty: 1, unit: '式', price: 150000, cost: 80000 },
          { id: '4', name: '給排水工事', qty: 1, unit: '式', price: 100000, cost: 60000 },
          { id: '5', name: '電気工事', qty: 1, unit: '式', price: 80000, cost: 50000 }
        ],
        selectedVendorIds: ['VENDOR-001', 'VENDOR-003']
      }
    ],
    selectedVersionId: 'v1',
    approval: {
      steps: [
        { role: 'manager', threshold: 500000 },
        { role: 'director', threshold: 1000000 },
        { role: 'cfo', threshold: 2000000 }
      ],
      status: 'draft'
    },
    contract: {
      provider: 'cloudsign',
      status: 'draft'
    },
    paymentPlan: {
      depositPct: 50,
      finalPct: 50
    },
    createdBy: 'USER-003',
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  }
];

// 見積一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  let filteredDB = [...DB];
  
  // フィルタリング
  const status = searchParams.get('status');
  if (status && status !== 'all') {
    filteredDB = filteredDB.filter(est => est.approval?.status === status);
  }
  
  const customerId = searchParams.get('customerId');
  if (customerId) {
    filteredDB = filteredDB.filter(est => est.customerId === customerId);
  }
  
  const search = searchParams.get('search');
  if (search) {
    filteredDB = filteredDB.filter(est => 
      est.title.toLowerCase().includes(search.toLowerCase()) ||
      est.customerId.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // ソート（作成日の降順）
  filteredDB.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // ページネーション
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const start = (page - 1) * limit;
  const end = start + limit;
  
  const paginatedDB = filteredDB.slice(start, end);
  
  return NextResponse.json({
    estimates: paginatedDB,
    total: filteredDB.length,
    page,
    limit
  });
}

// 見積作成
export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date().toISOString();
  
  const estimate: Estimate = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    versions: body.versions || [{
      id: randomUUID(),
      label: 'v1',
      createdAt: now,
      items: []
    }],
    selectedVersionId: body.selectedVersionId || body.versions?.[0]?.id || randomUUID(),
    approval: body.approval || {
      steps: [{ role: 'manager', threshold: 500000 }],
      status: 'draft'
    },
    ...body
  };
  
  DB.push(estimate);
  
  return NextResponse.json(estimate, { status: 201 });
}

// データベースを外部からアクセス可能にする（他のAPIルートで使用）
export function getDB() {
  return DB;
}

export function updateDB(newDB: Estimate[]) {
  DB = newDB;
}