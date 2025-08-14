import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()
    
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }
    
    // AI提案機能のスタブ実装
    const suggestions = await generateAISuggestions(title, description)
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate AI suggestions' }, { status: 500 })
  }
}

async function generateAISuggestions(title: string, description: string) {
  // AIサービス（OpenAI、Claude APIなど）を使用した提案生成のスタブ
  // プロジェクトの内容に基づいて見積項目を提案する
  
  await new Promise(resolve => setTimeout(resolve, 1000)) // API呼び出しのシミュレーション
  
  const suggestions = []
  
  // タイトルと説明に基づく簡易的な提案ロジック
  if (title.includes('外壁') || description.includes('外壁')) {
    suggestions.push(
      {
        description: '外壁洗浄・下地処理',
        quantity: 1,
        unitPrice: 50000,
        unit: '式',
        notes: 'AI提案: 外壁塗装には必須の前処理です'
      },
      {
        description: '外壁塗装（シリコン系）',
        quantity: 100,
        unitPrice: 2500,
        unit: '㎡',
        notes: 'AI提案: 一般的な戸建て住宅の場合'
      }
    )
  }
  
  if (title.includes('屋根') || description.includes('屋根')) {
    suggestions.push(
      {
        description: '屋根点検・診断',
        quantity: 1,
        unitPrice: 30000,
        unit: '式',
        notes: 'AI提案: 工事前の必要な診断'
      },
      {
        description: '屋根材修理・交換',
        quantity: 50,
        unitPrice: 4000,
        unit: '㎡',
        notes: 'AI提案: 標準的な修理単価'
      }
    )
  }
  
  if (title.includes('リフォーム') || description.includes('リフォーム')) {
    suggestions.push(
      {
        description: '解体工事',
        quantity: 1,
        unitPrice: 150000,
        unit: '式',
        notes: 'AI提案: 既存設備の解体費用'
      },
      {
        description: '内装仕上げ工事',
        quantity: 20,
        unitPrice: 15000,
        unit: '㎡',
        notes: 'AI提案: クロス・床仕上げ等'
      }
    )
  }
  
  // デフォルト提案（具体的なキーワードがない場合）
  if (suggestions.length === 0) {
    suggestions.push(
      {
        description: '現地調査・見積作成',
        quantity: 1,
        unitPrice: 10000,
        unit: '式',
        notes: 'AI提案: 詳細な見積のための調査'
      },
      {
        description: 'プロジェクト管理費',
        quantity: 1,
        unitPrice: 50000,
        unit: '式',
        notes: 'AI提案: 工事全体の管理費用'
      }
    )
  }
  
  return suggestions
}