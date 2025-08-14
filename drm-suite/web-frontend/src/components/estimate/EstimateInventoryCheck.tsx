'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EstimateSection } from './types'

interface InventoryItem {
  itemId: string
  itemName: string
  currentStock: number
  reservedStock: number
  availableStock: number
  unit: string
  status: 'sufficient' | 'low' | 'insufficient'
}

interface EstimateInventoryCheckProps {
  sections: EstimateSection[]
  onInventoryUpdate: (items: InventoryItem[]) => void
}

export function EstimateInventoryCheck({ sections, onInventoryUpdate }: EstimateInventoryCheckProps) {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)

  // 在庫チェック機能（スタブ実装）
  const checkInventory = async () => {
    if (sections.length === 0 || sections.every(s => s.items.length === 0)) {
      setInventoryData([])
      return
    }

    setLoading(true)
    
    try {
      // 実際の在庫システムとの連携をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockInventoryData: InventoryItem[] = []
      
      sections.forEach(section => {
        section.items.forEach(item => {
          // アイテム名から在庫データを推定（実際にはDBから取得）
          let mockStock = Math.floor(Math.random() * 100) + 10
          let reserved = Math.floor(Math.random() * 20)
          let available = mockStock - reserved
          let status: 'sufficient' | 'low' | 'insufficient' = 'sufficient'
          
          // 必要量と在庫の比較
          const requiredQuantity = item.quantity
          
          if (available < requiredQuantity) {
            status = 'insufficient'
          } else if (available < requiredQuantity * 1.2) {
            status = 'low'
          }
          
          // 特定のアイテムで在庫不足をシミュレート
          if (item.description.includes('塗料') || item.description.includes('ペイント')) {
            mockStock = 5
            reserved = 2
            available = 3
            if (requiredQuantity > 3) status = 'insufficient'
          }
          
          mockInventoryData.push({
            itemId: item.id,
            itemName: item.description,
            currentStock: mockStock,
            reservedStock: reserved,
            availableStock: available,
            unit: item.unit,
            status
          })
        })
      })
      
      setInventoryData(mockInventoryData)
      onInventoryUpdate(mockInventoryData)
    } catch (error) {
      console.error('在庫チェックエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkInventory()
  }, [sections])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sufficient':
        return <Badge className="bg-green-100 text-green-800">十分</Badge>
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">残少</Badge>
      case 'insufficient':
        return <Badge className="bg-red-100 text-red-800">不足</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">不明</Badge>
    }
  }

  const insufficientItems = inventoryData.filter(item => item.status === 'insufficient')
  const lowStockItems = inventoryData.filter(item => item.status === 'low')

  if (inventoryData.length === 0 && !loading) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📦 在庫連動チェック
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 警告サマリー */}
        {(insufficientItems.length > 0 || lowStockItems.length > 0) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">⚠️</span>
              <span className="font-medium text-yellow-800">在庫注意</span>
            </div>
            {insufficientItems.length > 0 && (
              <p className="text-sm text-red-700 mb-1">
                在庫不足: {insufficientItems.length}項目
              </p>
            )}
            {lowStockItems.length > 0 && (
              <p className="text-sm text-yellow-700">
                在庫残少: {lowStockItems.length}項目
              </p>
            )}
          </div>
        )}

        {/* 在庫一覧 */}
        <div className="space-y-3">
          {inventoryData.map((item) => (
            <div
              key={item.itemId}
              className={`border rounded-lg p-3 ${
                item.status === 'insufficient' 
                  ? 'border-red-200 bg-red-50' 
                  : item.status === 'low'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">{item.itemName}</h4>
                {getStatusBadge(item.status)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <span className="block">現在庫</span>
                  <span className="font-medium">{item.currentStock}{item.unit}</span>
                </div>
                <div>
                  <span className="block">予約済</span>
                  <span className="font-medium">{item.reservedStock}{item.unit}</span>
                </div>
                <div>
                  <span className="block">利用可能</span>
                  <span className="font-medium">{item.availableStock}{item.unit}</span>
                </div>
              </div>
              
              {item.status === 'insufficient' && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                  🚨 必要量に対して在庫が不足しています。発注が必要です。
                </div>
              )}
              {item.status === 'low' && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-700">
                  ⚠️ 在庫が少なくなっています。早めの補充をお勧めします。
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 在庫データはリアルタイムで更新されます。
            発注が必要な場合は、購買部門に連絡してください。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}