'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EstimateItem } from '@/types/estimate-v2'

interface RAGSuggestProps {
  currentItems: EstimateItem[]
  context?: {
    category?: string
    method?: string
    structure?: string
    storeId?: string
  }
  onSuggestionApply?: (suggestion: Suggestion) => void
  onItemAdd?: (item: EstimateItem) => void
}

interface Suggestion {
  id: string
  type: 'item' | 'price' | 'description' | 'bundle'
  title: string
  description: string
  confidence: number
  data: any
  source: string
}

interface AIAnalysis {
  missingItems: string[]
  priceAnomalies: Array<{
    itemId: string
    currentPrice: number
    suggestedPrice: number
    reason: string
  }>
  recommendations: string[]
  totalCostEstimate: {
    min: number
    max: number
    average: number
  }
}

export function RAGSuggest({ 
  currentItems, 
  context,
  onSuggestionApply,
  onItemAdd
}: RAGSuggestProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis'>('suggestions')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    if (currentItems.length > 0) {
      generateSuggestions()
    }
  }, [currentItems, context])

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      // AI分析API呼び出し（モック）
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // コンテキストに基づいた提案を生成
      const mockSuggestions: Suggestion[] = []
      
      // 工事カテゴリに基づく必須項目の提案
      if (context?.category === '塗装' || currentItems.some(item => 
        item.name.includes('塗装') || item.name.includes('外壁')
      )) {
        mockSuggestions.push({
          id: 'SUG-001',
          type: 'item',
          title: '養生作業を追加',
          description: '外壁塗装では養生作業が必須です。近隣への配慮も含まれます。',
          confidence: 0.95,
          data: {
            name: '養生作業（近隣配慮含む）',
            qty: 1,
            unit: '式',
            price: 45000,
            cost: 30000
          },
          source: '過去100件の外壁塗装見積から'
        })
        
        if (!currentItems.some(item => item.name.includes('足場'))) {
          mockSuggestions.push({
            id: 'SUG-002',
            type: 'item',
            title: '足場設置が未設定',
            description: '2階建て以上の外壁塗装には足場が必要です',
            confidence: 0.98,
            data: {
              name: '足場設置・撤去',
              qty: 150,
              unit: '㎡',
              price: 800,
              cost: 500
            },
            source: '建築基準法・安全規定'
          })
        }
      }
      
      // 価格の異常検知
      currentItems.forEach(item => {
        if (item.name.includes('塗装') && item.price > 5000) {
          mockSuggestions.push({
            id: `SUG-PRICE-${item.id}`,
            type: 'price',
            title: `${item.name}の単価が相場より高い`,
            description: `現在: ¥${item.price}/㎡ → 推奨: ¥3,500/㎡（シリコン塗装の場合）`,
            confidence: 0.85,
            data: {
              itemId: item.id,
              currentPrice: item.price,
              suggestedPrice: 3500,
              marketAverage: 3200,
              priceRange: { min: 2800, max: 4000 }
            },
            source: '直近3ヶ月の市場価格データ'
          })
        }
      })
      
      // バンドル提案
      if (currentItems.length > 3) {
        mockSuggestions.push({
          id: 'SUG-BUNDLE-001',
          type: 'bundle',
          title: '外壁塗装パッケージプランの提案',
          description: '個別見積より15%お得な標準パッケージがあります',
          confidence: 0.78,
          data: {
            packageName: '外壁塗装スタンダードパック',
            originalTotal: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0),
            packagePrice: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0) * 0.85,
            savings: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0) * 0.15,
            includedItems: ['外壁塗装', '屋根塗装', '付帯部塗装', '養生', '足場']
          },
          source: '人気パッケージプラン'
        })
      }
      
      // 関連商品の提案
      mockSuggestions.push({
        id: 'SUG-RELATED-001',
        type: 'item',
        title: '雨樋清掃・補修の追加提案',
        description: '外壁塗装と同時施工で足場代を節約できます',
        confidence: 0.72,
        data: {
          name: '雨樋清掃・補修',
          qty: 1,
          unit: '式',
          price: 35000,
          cost: 20000,
          crossSellReason: '足場設置時の同時施工で効率的'
        },
        source: 'クロスセル分析'
      })
      
      setSuggestions(mockSuggestions)
      
      // 全体分析
      const mockAnalysis: AIAnalysis = {
        missingItems: [
          '廃材処分費',
          '諸経費',
          '現場管理費'
        ],
        priceAnomalies: currentItems
          .filter(item => item.price > 5000)
          .map(item => ({
            itemId: item.id,
            currentPrice: item.price,
            suggestedPrice: item.price * 0.8,
            reason: '市場価格より20%高い'
          })),
        recommendations: [
          '保証期間を明記することで信頼性が向上します',
          '施工写真の添付で透明性をアピールできます',
          '近隣挨拶費用を含めると好印象です'
        ],
        totalCostEstimate: {
          min: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0) * 0.9,
          max: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0) * 1.1,
          average: currentItems.reduce((sum, item) => sum + item.qty * item.price, 0)
        }
      }
      
      setAnalysis(mockAnalysis)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplySuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'item' && onItemAdd) {
      const newItem: EstimateItem = {
        id: `ITEM-${Date.now()}`,
        ...suggestion.data
      }
      onItemAdd(newItem)
      alert(`「${suggestion.data.name}」を追加しました`)
    } else if (onSuggestionApply) {
      onSuggestionApply(suggestion)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-100 text-green-800">高精度</Badge>
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-100 text-yellow-800">中精度</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">参考</Badge>
    }
  }

  const filteredSuggestions = suggestions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <span>🤖</span>
              <span>AI見積アシスタント</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              RAG: {currentItems.length}項目を分析中
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* タブ切り替え */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={activeTab === 'suggestions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('suggestions')}
            >
              提案 ({suggestions.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'analysis' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analysis')}
            >
              分析レポート
            </Button>
          </div>

          {/* 検索バー */}
          {activeTab === 'suggestions' && (
            <Input
              placeholder="提案を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-pulse flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-sm text-gray-600">AIが見積内容を分析中...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 提案タブ */}
          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              {filteredSuggestions.map(suggestion => (
                <Card key={suggestion.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{suggestion.title}</span>
                          {getConfidenceBadge(suggestion.confidence)}
                        </div>
                        <p className="text-xs text-gray-600">{suggestion.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type === 'item' ? '項目追加' :
                         suggestion.type === 'price' ? '価格調整' :
                         suggestion.type === 'bundle' ? 'パッケージ' : '説明'}
                      </Badge>
                    </div>

                    {/* 詳細表示 */}
                    {showDetails === suggestion.id && (
                      <div className="mt-3 pt-3 border-t">
                        {suggestion.type === 'item' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">項目名:</span>
                                <span className="ml-1">{suggestion.data.name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">数量:</span>
                                <span className="ml-1">{suggestion.data.qty}{suggestion.data.unit}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">単価:</span>
                                <span className="ml-1">¥{suggestion.data.price.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">小計:</span>
                                <span className="ml-1 font-medium">
                                  ¥{(suggestion.data.qty * suggestion.data.price).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {suggestion.type === 'bundle' && (
                          <div className="space-y-2">
                            <div className="p-2 bg-green-50 rounded text-xs">
                              <p className="font-medium text-green-800">
                                節約額: ¥{suggestion.data.savings.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p className="font-medium mb-1">含まれる項目:</p>
                              <ul className="list-disc list-inside">
                                {suggestion.data.includedItems.map((item: string, i: number) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* アクション */}
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => setShowDetails(showDetails === suggestion.id ? null : suggestion.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {showDetails === suggestion.id ? '詳細を隠す' : '詳細を見る'}
                      </button>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          適用
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        データソース: {suggestion.source}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredSuggestions.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      {searchQuery ? '該当する提案が見つかりません' : '現在、提案はありません'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 分析タブ */}
          {activeTab === 'analysis' && analysis && (
            <div className="space-y-4">
              {/* 全体サマリー */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">見積全体分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">最小見積</p>
                      <p className="text-lg font-bold">¥{analysis.totalCostEstimate.min.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">平均見積</p>
                      <p className="text-lg font-bold text-blue-600">
                        ¥{analysis.totalCostEstimate.average.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">最大見積</p>
                      <p className="text-lg font-bold">¥{analysis.totalCostEstimate.max.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 不足項目 */}
              {analysis.missingItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">推奨追加項目</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.missingItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                          <span className="text-sm">{item}</span>
                          <Button size="sm" variant="outline">
                            追加
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 価格異常 */}
              {analysis.priceAnomalies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">価格の見直し推奨</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.priceAnomalies.map((anomaly, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded">
                          <div className="flex justify-between items-center">
                            <div className="text-sm">
                              <p className="font-medium">項目ID: {anomaly.itemId}</p>
                              <p className="text-xs text-gray-600">{anomaly.reason}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs line-through text-gray-500">
                                ¥{anomaly.currentPrice.toLocaleString()}
                              </p>
                              <p className="text-sm font-medium text-red-600">
                                ¥{anomaly.suggestedPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 改善提案 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">改善提案</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* フッター情報 */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>最終分析: {new Date().toLocaleString('ja-JP')}</span>
            <span>AI Model: GPT-4 with RAG</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}