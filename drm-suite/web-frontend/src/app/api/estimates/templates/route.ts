import { NextResponse } from 'next/server';
import { EstimateItem } from '@/types/estimate-v2';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  items: Partial<EstimateItem>[];
  totalAmount: number;
  createdAt: string;
  usageCount: number;
}

// テンプレートDB（モック）
const TEMPLATES: Template[] = [
  {
    id: 'TPL-001',
    name: '外壁塗装工事（標準）',
    description: '一般的な戸建住宅の外壁塗装',
    category: '塗装',
    totalAmount: 1200000,
    createdAt: '2024-01-01T00:00:00Z',
    usageCount: 45,
    items: [
      { name: '足場設置・撤去', qty: 1, unit: '式', price: 150000, cost: 100000 },
      { name: '高圧洗浄', qty: 100, unit: '㎡', price: 300, cost: 150 },
      { name: '下地処理', qty: 100, unit: '㎡', price: 500, cost: 300 },
      { name: '外壁塗装（シリコン）', qty: 100, unit: '㎡', price: 3500, cost: 2000 },
      { name: '付帯部塗装', qty: 1, unit: '式', price: 80000, cost: 50000 },
      { name: '諸経費', qty: 1, unit: '式', price: 100000, cost: 30000 }
    ]
  },
  {
    id: 'TPL-002',
    name: '屋根修理工事（瓦）',
    description: '瓦屋根の部分修理',
    category: '屋根',
    totalAmount: 450000,
    createdAt: '2024-01-05T00:00:00Z',
    usageCount: 23,
    items: [
      { name: '足場設置・撤去', qty: 1, unit: '式', price: 80000, cost: 50000 },
      { name: '既存瓦撤去', qty: 30, unit: '㎡', price: 2000, cost: 1200 },
      { name: '防水シート張替', qty: 30, unit: '㎡', price: 1500, cost: 800 },
      { name: '新規瓦設置', qty: 30, unit: '㎡', price: 6000, cost: 4000 },
      { name: '棟瓦補修', qty: 10, unit: 'm', price: 3000, cost: 1800 },
      { name: '廃材処分費', qty: 1, unit: '式', price: 30000, cost: 20000 }
    ]
  },
  {
    id: 'TPL-003',
    name: 'キッチンリフォーム（標準）',
    description: 'システムキッチン交換工事',
    category: 'リフォーム',
    totalAmount: 1800000,
    createdAt: '2024-01-10T00:00:00Z',
    usageCount: 67,
    items: [
      { name: '既存キッチン撤去', qty: 1, unit: '式', price: 50000, cost: 30000 },
      { name: 'システムキッチン本体', qty: 1, unit: '台', price: 800000, cost: 600000, skuId: 'SKU-KIT-001' },
      { name: '設置工事', qty: 1, unit: '式', price: 150000, cost: 80000 },
      { name: '給排水工事', qty: 1, unit: '式', price: 100000, cost: 60000 },
      { name: '電気工事', qty: 1, unit: '式', price: 80000, cost: 50000 },
      { name: '内装補修', qty: 1, unit: '式', price: 120000, cost: 70000 },
      { name: '諸経費', qty: 1, unit: '式', price: 100000, cost: 30000 }
    ]
  },
  {
    id: 'TPL-004',
    name: 'バスルームリフォーム',
    description: 'ユニットバス交換工事',
    category: 'リフォーム',
    totalAmount: 1500000,
    createdAt: '2024-01-12T00:00:00Z',
    usageCount: 34,
    items: [
      { name: '既存浴室解体', qty: 1, unit: '式', price: 80000, cost: 50000 },
      { name: 'ユニットバス本体', qty: 1, unit: '台', price: 700000, cost: 500000, skuId: 'SKU-BATH-001' },
      { name: '設置工事', qty: 1, unit: '式', price: 200000, cost: 120000 },
      { name: '給排水工事', qty: 1, unit: '式', price: 120000, cost: 70000 },
      { name: '電気工事', qty: 1, unit: '式', price: 60000, cost: 35000 },
      { name: '防水工事', qty: 1, unit: '式', price: 80000, cost: 50000 },
      { name: '内装仕上げ', qty: 1, unit: '式', price: 100000, cost: 60000 }
    ]
  },
  {
    id: 'TPL-005',
    name: 'フルリフォーム（戸建）',
    description: '戸建住宅の全面リフォーム',
    category: 'リフォーム',
    totalAmount: 8000000,
    createdAt: '2024-01-15T00:00:00Z',
    usageCount: 12,
    items: [
      { name: '解体工事', qty: 1, unit: '式', price: 500000, cost: 300000 },
      { name: '基礎補強工事', qty: 1, unit: '式', price: 800000, cost: 500000 },
      { name: '構造補強工事', qty: 1, unit: '式', price: 1000000, cost: 600000 },
      { name: '屋根工事', qty: 1, unit: '式', price: 800000, cost: 500000 },
      { name: '外壁工事', qty: 1, unit: '式', price: 1200000, cost: 700000 },
      { name: '内装工事', qty: 1, unit: '式', price: 1500000, cost: 900000 },
      { name: '設備工事', qty: 1, unit: '式', price: 1200000, cost: 800000 },
      { name: '電気工事', qty: 1, unit: '式', price: 500000, cost: 300000 },
      { name: '諸経費', qty: 1, unit: '式', price: 500000, cost: 200000 }
    ]
  }
];

// テンプレート一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  let filteredTemplates = [...TEMPLATES];
  
  if (category && category !== 'all') {
    filteredTemplates = filteredTemplates.filter(t => t.category === category);
  }
  
  // 使用回数順にソート
  filteredTemplates.sort((a, b) => b.usageCount - a.usageCount);
  
  return NextResponse.json({
    templates: filteredTemplates,
    categories: ['塗装', '屋根', 'リフォーム', '新築']
  });
}

// テンプレートから見積作成
export async function POST(req: Request) {
  const body = await req.json();
  const { templateId, customerId } = body;
  
  const template = TEMPLATES.find(t => t.id === templateId);
  
  if (!template) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  }
  
  // テンプレートから新しい見積を生成
  const now = new Date().toISOString();
  const estimate = {
    id: `EST-${Date.now()}`,
    customerId,
    title: `${template.name}（テンプレートから作成）`,
    storeId: 'STORE-001',
    category: template.category,
    versions: [{
      id: 'v1',
      label: 'v1',
      createdAt: now,
      items: template.items.map((item, index) => ({
        id: `${index + 1}`,
        ...item
      }))
    }],
    selectedVersionId: 'v1',
    approval: {
      steps: [{ role: 'manager' as const, threshold: 500000 }],
      status: 'draft' as const
    },
    createdBy: 'USER-CURRENT',
    createdAt: now,
    updatedAt: now,
    templateId
  };
  
  // 使用回数を増やす（実際にはDBで管理）
  const templateIndex = TEMPLATES.findIndex(t => t.id === templateId);
  if (templateIndex !== -1) {
    TEMPLATES[templateIndex].usageCount++;
  }
  
  return NextResponse.json({
    message: 'Estimate created from template',
    estimate,
    template: {
      id: template.id,
      name: template.name
    }
  });
}