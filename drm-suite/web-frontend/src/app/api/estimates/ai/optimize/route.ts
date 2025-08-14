import { NextRequest, NextResponse } from 'next/server'
import { EstimateSection } from '@/components/estimate/types'

export async function POST(request: NextRequest) {
  try {
    const { sections } = await request.json()
    
    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 })
    }
    
    // 価格最適化機能のスタブ実装
    const optimizedSections = await optimizePricing(sections)
    
    return NextResponse.json({ sections: optimizedSections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to optimize pricing' }, { status: 500 })
  }
}

async function optimizePricing(sections: EstimateSection[]): Promise<EstimateSection[]> {
  // AIサービスを使用した価格最適化のスタブ
  // 市場価格データベースやAIモデルを使用して適正価格を提案
  
  await new Promise(resolve => setTimeout(resolve, 1500)) // API呼び出しのシミュレーション
  
  const optimizedSections = sections.map(section => {
    const optimizedItems = section.items.map(item => {
      let optimizedUnitPrice = item.unitPrice
      
      // 簡易的な最適化ロジック（実際にはより高度なアルゴリズムを使用）
      if (item.description.includes('洗浄')) {
        optimizedUnitPrice = Math.max(item.unitPrice * 0.9, 30000) // 10%削減、最低30,000円
      } else if (item.description.includes('塗装')) {
        optimizedUnitPrice = Math.min(item.unitPrice * 1.05, 3000) // 5%増加、最大3,000円/㎡
      } else if (item.description.includes('管理')) {
        optimizedUnitPrice = Math.round(item.unitPrice * 0.95) // 5%削減
      } else if (item.unitPrice > 100000) {
        optimizedUnitPrice = Math.round(item.unitPrice * 0.92) // 高額項目は8%削減
      }
      
      const optimizedAmount = item.quantity * optimizedUnitPrice
      
      return {
        ...item,
        unitPrice: optimizedUnitPrice,
        amount: optimizedAmount,
        notes: item.notes ? `${item.notes} (AI最適化済み)` : 'AI最適化済み'
      }
    })
    
    const optimizedSubtotal = optimizedItems.reduce((sum, item) => sum + item.amount, 0)
    
    return {
      ...section,
      items: optimizedItems,
      subtotal: optimizedSubtotal
    }
  })
  
  return optimizedSections
}