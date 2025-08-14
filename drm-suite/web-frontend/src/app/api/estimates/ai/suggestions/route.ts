import { NextResponse } from 'next/server';
import { EstimateItem } from '@/types/estimate-v2';

// AI提案
export async function POST(req: Request) {
  const body = await req.json();
  const { title, description, category, items } = body;
  
  // モック：AI提案生成（後でsvc-aiに差し替え）
  const suggestions: {
    items: Partial<EstimateItem>[];
    vendors: Array<{ id: string; name: string; score: number }>;
    insights: string[];
  } = {
    items: [],
    vendors: [],
    insights: []
  };
  
  // カテゴリに基づく項目提案
  if (category === '戸建住宅' || title?.includes('外壁')) {
    suggestions.items.push(
      {
        name: '足場設置・撤去',
        qty: 1,
        unit: '式',
        price: 150000,
        cost: 100000
      },
      {
        name: '高圧洗浄',
        qty: 100,
        unit: '㎡',
        price: 300,
        cost: 150
      },
      {
        name: '下地補修',
        qty: 1,
        unit: '式',
        price: 50000,
        cost: 30000
      }
    );
    
    suggestions.insights.push(
      '外壁塗装では足場設置が必須です',
      '高圧洗浄は塗装の密着性を高めます',
      '下地補修を含めることで長期的な品質を保証できます'
    );
  }
  
  if (category === 'リフォーム' || title?.includes('キッチン')) {
    suggestions.items.push(
      {
        name: '既存設備撤去',
        qty: 1,
        unit: '式',
        price: 50000,
        cost: 30000
      },
      {
        name: '配管工事',
        qty: 1,
        unit: '式',
        price: 100000,
        cost: 60000
      },
      {
        name: '電気工事',
        qty: 1,
        unit: '式',
        price: 80000,
        cost: 50000
      }
    );
    
    suggestions.insights.push(
      'キッチンリフォームでは配管・電気工事が重要です',
      '既存設備の撤去費用を見積もることを忘れずに',
      'IHコンロの場合は200V電源工事が必要な場合があります'
    );
  }
  
  // 既存項目の分析
  if (items && items.length > 0) {
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.qty * item.price), 0
    );
    
    const avgProfitRate = items.reduce((sum: number, item: any) => {
      const profit = item.price - (item.cost || 0);
      const rate = item.price > 0 ? (profit / item.price) : 0;
      return sum + rate;
    }, 0) / items.length;
    
    if (avgProfitRate < 0.2) {
      suggestions.insights.push('粗利率が低めです。価格の見直しを検討してください');
    }
    
    if (totalAmount > 1000000) {
      suggestions.insights.push('高額案件のため、分割払いオプションの提案をお勧めします');
    }
  }
  
  // おすすめ仕入先
  suggestions.vendors = [
    {
      id: 'VENDOR-001',
      name: '建材商事株式会社',
      score: 95
    },
    {
      id: 'VENDOR-002',
      name: '住設サプライ',
      score: 88
    },
    {
      id: 'VENDOR-003',
      name: 'リフォーム資材センター',
      score: 82
    }
  ];
  
  // 一般的な洞察
  suggestions.insights.push(
    '類似案件と比較して妥当な価格設定です',
    '現在の市場価格を反映しています',
    '季節要因を考慮した工期設定をお勧めします'
  );
  
  return NextResponse.json(suggestions);
}