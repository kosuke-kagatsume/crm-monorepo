'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Vendor, EstimateItem } from '@/types/estimate-v2'

interface VendorRecommendProps {
  items: EstimateItem[]
  onVendorSelect: (itemId: string, vendor: Vendor) => void
  userId?: string
}

interface VendorHistory {
  vendorId: string
  itemType: string
  usageCount: number
  avgPrice: number
  lastUsed: string
  satisfaction: number
}

export function VendorRecommend({ items, onVendorSelect, userId }: VendorRecommendProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<Map<string, string>>(new Map())
  const [vendorHistory, setVendorHistory] = useState<VendorHistory[]>([])
  const [copyPreviousVendors, setCopyPreviousVendors] = useState(true)
  const [showPriceHints, setShowPriceHints] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchVendors()
    fetchVendorHistory()
  }, [userId])

  const fetchVendors = async () => {
    // モックデータ
    const mockVendors: Vendor[] = [
      { id: 'VENDOR-001', name: '建材商事株式会社', unitPriceHint: 2000, score: 95 },
      { id: 'VENDOR-002', name: '住設サプライ', unitPriceHint: 2200, score: 88 },
      { id: 'VENDOR-003', name: 'リフォーム資材センター', unitPriceHint: 1900, score: 82 },
      { id: 'VENDOR-004', name: 'プロ工具商会', unitPriceHint: 2100, score: 76 },
      { id: 'VENDOR-005', name: '塗料専門店', unitPriceHint: 1800, score: 90 },
      { id: 'VENDOR-006', name: '建築金物卸', unitPriceHint: 2300, score: 85 },
      { id: 'VENDOR-007', name: '電材デポ', unitPriceHint: 2400, score: 79 },
      { id: 'VENDOR-008', name: '配管資材商社', unitPriceHint: 2500, score: 83 }
    ]
    setVendors(mockVendors)
  }

  const fetchVendorHistory = async () => {
    // 個人履歴ベースのモックデータ
    const mockHistory: VendorHistory[] = [
      {
        vendorId: 'VENDOR-001',
        itemType: '外壁塗装',
        usageCount: 45,
        avgPrice: 1950,
        lastUsed: '2024-01-20',
        satisfaction: 95
      },
      {
        vendorId: 'VENDOR-002',
        itemType: 'キッチン',
        usageCount: 23,
        avgPrice: 580000,
        lastUsed: '2024-01-18',
        satisfaction: 88
      },
      {
        vendorId: 'VENDOR-005',
        itemType: '塗料',
        usageCount: 67,
        avgPrice: 1750,
        lastUsed: '2024-01-22',
        satisfaction: 92
      }
    ]
    setVendorHistory(mockHistory)
  }

  const getRecommendedVendors = (itemName: string): Vendor[] => {
    // アイテム名に基づく推奨協力会社を返す
    const itemLower = itemName.toLowerCase()
    let recommended: Vendor[] = []

    if (itemLower.includes('塗装') || itemLower.includes('塗料')) {
      recommended = vendors.filter(v => 
        ['VENDOR-001', 'VENDOR-005'].includes(v.id)
      )
    } else if (itemLower.includes('キッチン') || itemLower.includes('システム')) {
      recommended = vendors.filter(v => 
        ['VENDOR-002', 'VENDOR-003'].includes(v.id)
      )
    } else if (itemLower.includes('電気') || itemLower.includes('配線')) {
      recommended = vendors.filter(v => 
        ['VENDOR-007'].includes(v.id)
      )
    } else if (itemLower.includes('配管') || itemLower.includes('給排水')) {
      recommended = vendors.filter(v => 
        ['VENDOR-008'].includes(v.id)
      )
    } else {
      // デフォルトはスコア上位3社
      recommended = [...vendors].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
    }

    // 履歴に基づくソート
    return recommended.sort((a, b) => {
      const historyA = vendorHistory.find(h => h.vendorId === a.id)
      const historyB = vendorHistory.find(h => h.vendorId === b.id)
      
      if (historyA && historyB) {
        return historyB.usageCount - historyA.usageCount
      } else if (historyA) {
        return -1
      } else if (historyB) {
        return 1
      }
      return (b.score || 0) - (a.score || 0)
    })
  }

  const handleVendorSelect = (itemId: string, vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId)
    if (vendor) {
      setSelectedVendors(new Map(selectedVendors.set(itemId, vendorId)))
      onVendorSelect(itemId, vendor)
    }
  }

  const applyPreviousVendors = () => {
    // 前回選択した協力会社を自動適用
    items.forEach(item => {
      const history = vendorHistory.find(h => 
        item.name.toLowerCase().includes(h.itemType.toLowerCase())
      )
      if (history) {
        handleVendorSelect(item.id, history.vendorId)
      }
    })
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>🏢 協力会社選択</CardTitle>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPriceHints}
                  onChange={(e) => setShowPriceHints(e.target.checked)}
                />
                単価ヒント表示
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 一括適用オプション */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={copyPreviousVendors}
                onChange={(e) => setCopyPreviousVendors(e.target.checked)}
              />
              <span className="text-sm">前回のコピー時に選んだ協力会社をそのまま選ぶ</span>
            </label>
            {copyPreviousVendors && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={applyPreviousVendors}
              >
                前回の選択を適用
              </Button>
            )}
          </div>

          {/* 検索 */}
          <div className="mb-4">
            <Input
              placeholder="協力会社を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 項目ごとの協力会社選択 */}
          <div className="space-y-3">
            {items.map(item => {
              const recommendedVendors = getRecommendedVendors(item.name)
              const selectedVendorId = selectedVendors.get(item.id)
              
              return (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.qty}{item.unit} × ¥{item.price.toLocaleString()}
                      </p>
                    </div>
                    {showPriceHints && item.cost && (
                      <Badge variant="outline" className="text-xs">
                        原価: ¥{item.cost.toLocaleString()}
                      </Badge>
                    )}
                  </div>

                  {/* 推奨協力会社 */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">推奨協力会社:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {recommendedVendors.slice(0, 4).map(vendor => {
                        const history = vendorHistory.find(h => h.vendorId === vendor.id)
                        const isSelected = selectedVendorId === vendor.id
                        
                        return (
                          <button
                            key={vendor.id}
                            onClick={() => handleVendorSelect(item.id, vendor.id)}
                            className={`p-2 border rounded text-left transition-all ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-xs font-medium">{vendor.name}</p>
                                {history && (
                                  <p className="text-xs text-gray-500">
                                    実績: {history.usageCount}回
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getScoreColor(vendor.score)}`}
                                >
                                  {vendor.score}%
                                </Badge>
                                {showPriceHints && vendor.unitPriceHint && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    ¥{vendor.unitPriceHint.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* その他の協力会社 */}
                    {searchTerm && (
                      <div className="mt-2">
                        <select
                          value={selectedVendorId || ''}
                          onChange={(e) => handleVendorSelect(item.id, e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">協力会社を選択...</option>
                          {filteredVendors.map(vendor => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name} ({vendor.score}%)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 履歴サマリー */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">最近の利用履歴</p>
            <div className="space-y-1">
              {vendorHistory.slice(0, 3).map(history => {
                const vendor = vendors.find(v => v.id === history.vendorId)
                return (
                  <div key={history.vendorId} className="flex justify-between text-xs">
                    <span>{vendor?.name}</span>
                    <span className="text-gray-500">
                      {history.usageCount}回 / 満足度 {history.satisfaction}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}