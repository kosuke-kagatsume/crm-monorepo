'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EstimateItem } from '@/types/estimate-v2'

interface StockBookingProps {
  estimateId: string
  items: EstimateItem[]
  onBookingComplete?: (bookingId: string) => void
  onBookingCancel?: (bookingId: string) => void
}

interface StockStatus {
  skuId: string
  itemName: string
  required: number
  available: number
  reserved: number
  leadTime?: number
  alternativeSku?: string
  alternativeName?: string
  status: 'available' | 'partial' | 'shortage' | 'reserved'
}

interface BookingResult {
  bookingId: string
  items: Array<{
    skuId: string
    quantity: number
    status: 'reserved' | 'backorder' | 'alternative'
  }>
  expiresAt: string
}

interface Warehouse {
  id: string
  name: string
  location: string
  distance: number
}

export function StockBooking({ 
  estimateId, 
  items, 
  onBookingComplete,
  onBookingCancel
}: StockBookingProps) {
  const [stockStatuses, setStockStatuses] = useState<StockStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('WH-001')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [autoReserve, setAutoReserve] = useState(true)

  useEffect(() => {
    fetchWarehouses()
    checkStock()
  }, [items, selectedWarehouse])

  const fetchWarehouses = async () => {
    // 倉庫リスト取得（モック）
    const mockWarehouses: Warehouse[] = [
      { id: 'WH-001', name: '東京中央倉庫', location: '東京都江東区', distance: 5 },
      { id: 'WH-002', name: '千葉物流センター', location: '千葉県市川市', distance: 15 },
      { id: 'WH-003', name: '埼玉配送センター', location: '埼玉県川口市', distance: 20 },
      { id: 'WH-004', name: '横浜港倉庫', location: '神奈川県横浜市', distance: 30 }
    ]
    setWarehouses(mockWarehouses)
  }

  const checkStock = async () => {
    setLoading(true)
    try {
      // 在庫確認API（モック）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const statuses: StockStatus[] = items
        .filter(item => item.skuId)
        .map(item => {
          // SKU-KIT-001は不足をシミュレート
          if (item.skuId === 'SKU-KIT-001') {
            return {
              skuId: item.skuId,
              itemName: item.name,
              required: item.qty,
              available: Math.floor(item.qty * 0.6),
              reserved: 0,
              leadTime: 7,
              alternativeSku: 'SKU-KIT-001-ALT',
              alternativeName: 'システムキッチン（代替品）',
              status: 'shortage' as const
            }
          }
          
          // その他はランダムに在庫状況を生成
          const available = Math.floor(Math.random() * 200) + 50
          const isAvailable = available >= item.qty
          
          return {
            skuId: item.skuId!,
            itemName: item.name,
            required: item.qty,
            available,
            reserved: 0,
            leadTime: isAvailable ? 0 : Math.floor(Math.random() * 14) + 3,
            status: isAvailable ? 'available' as const : 'partial' as const
          }
        })
      
      setStockStatuses(statuses)
    } catch (error) {
      console.error('Failed to check stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReserveStock = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/book-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: stockStatuses.map(s => ({
            skuId: s.skuId,
            quantity: s.required
          })),
          warehouseId: selectedWarehouse,
          autoReserve
        })
      })
      
      if (!response.ok) throw new Error('Failed to book stock')
      
      const result = await response.json()
      setBookingResult(result)
      
      // 在庫ステータスを更新
      setStockStatuses(prev => prev.map(status => ({
        ...status,
        reserved: status.required,
        status: 'reserved'
      })))
      
      if (onBookingComplete) {
        onBookingComplete(result.bookingId)
      }
      
      alert(`在庫予約が完了しました。予約番号: ${result.bookingId}`)
    } catch (error) {
      console.error('Failed to reserve stock:', error)
      alert('在庫予約に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!bookingResult || !confirm('在庫予約をキャンセルしますか？')) return
    
    setLoading(true)
    try {
      // キャンセルAPI（モック）
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookingResult(null)
      setStockStatuses(prev => prev.map(status => ({
        ...status,
        reserved: 0,
        status: status.available >= status.required ? 'available' : 'partial'
      })))
      
      if (onBookingCancel) {
        onBookingCancel(bookingResult.bookingId)
      }
      
      alert('在庫予約をキャンセルしました')
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
      alert('キャンセルに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: StockStatus) => {
    switch (status.status) {
      case 'reserved':
        return <Badge className="bg-green-100 text-green-800">予約済</Badge>
      case 'available':
        return <Badge className="bg-green-100 text-green-800">在庫あり</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">一部不足</Badge>
      case 'shortage':
        return <Badge className="bg-red-100 text-red-800">在庫不足</Badge>
      default:
        return <Badge>確認中</Badge>
    }
  }

  const getTotalStatus = () => {
    const hasShortage = stockStatuses.some(s => s.status === 'shortage')
    const hasPartial = stockStatuses.some(s => s.status === 'partial')
    const allReserved = stockStatuses.every(s => s.status === 'reserved')
    
    if (allReserved) return { text: '全品予約済', color: 'text-green-600' }
    if (hasShortage) return { text: '在庫不足あり', color: 'text-red-600' }
    if (hasPartial) return { text: '一部不足', color: 'text-yellow-600' }
    return { text: '在庫確認済', color: 'text-green-600' }
  }

  const totalStatus = getTotalStatus()

  return (
    <div className="space-y-4">
      {/* 倉庫選択 */}
      <Card>
        <CardHeader>
          <CardTitle>配送元倉庫</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {warehouses.map(warehouse => (
              <button
                key={warehouse.id}
                onClick={() => setSelectedWarehouse(warehouse.id)}
                disabled={!!bookingResult}
                className={`p-3 border rounded-lg text-left transition-all ${
                  selectedWarehouse === warehouse.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${bookingResult ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <p className="font-medium text-sm">{warehouse.name}</p>
                <p className="text-xs text-gray-600">{warehouse.location}</p>
                <p className="text-xs text-gray-500">距離: {warehouse.distance}km</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 在庫状況 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>在庫確認結果</CardTitle>
            <span className={`font-medium ${totalStatus.color}`}>
              {totalStatus.text}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">在庫を確認中...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stockStatuses.map(status => (
                <div key={status.skuId} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{status.itemName}</p>
                      <p className="text-xs text-gray-600">SKU: {status.skuId}</p>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">必要数:</span>
                      <span className="ml-1 font-medium">{status.required}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">在庫数:</span>
                      <span className={`ml-1 font-medium ${
                        status.available >= status.required ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {status.available}
                      </span>
                    </div>
                    {status.reserved > 0 && (
                      <div>
                        <span className="text-gray-500">予約済:</span>
                        <span className="ml-1 font-medium text-blue-600">{status.reserved}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 不足時の情報 */}
                  {status.status === 'shortage' && (
                    <div className="mt-2 pt-2 border-t">
                      {status.leadTime && (
                        <p className="text-xs text-gray-600">
                          入荷予定: {status.leadTime}日後
                        </p>
                      )}
                      {status.alternativeSku && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded">
                          <p className="text-xs font-medium text-yellow-800">代替品の提案</p>
                          <p className="text-xs text-yellow-700">
                            {status.alternativeName} (SKU: {status.alternativeSku})
                          </p>
                          <button className="text-xs text-blue-600 hover:underline mt-1">
                            代替品の詳細を見る
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {stockStatuses.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  SKUが設定されている商品がありません
                </p>
              )}
            </div>
          )}
          
          {/* 予約オプション */}
          {!bookingResult && stockStatuses.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoReserve}
                  onChange={(e) => setAutoReserve(e.target.checked)}
                />
                <span className="text-sm">不足分は自動的に取り寄せ手配</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 予約情報 */}
      {bookingResult && (
        <Card>
          <CardHeader>
            <CardTitle>予約情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-green-800">予約完了</p>
                  <p className="text-sm text-green-700">予約番号: {bookingResult.bookingId}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">有効</Badge>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <p>有効期限: {new Date(bookingResult.expiresAt).toLocaleString('ja-JP')}</p>
                <p>予約点数: {bookingResult.items.length}品目</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ 契約締結後、48時間以内に正式発注してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      <div className="flex gap-2">
        {!bookingResult ? (
          <>
            <Button
              onClick={handleReserveStock}
              disabled={loading || stockStatuses.length === 0}
              className="flex-1"
            >
              {loading ? '予約中...' : '在庫を予約'}
            </Button>
            <Button
              onClick={checkStock}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              在庫を再確認
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReservation}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              予約をキャンセル
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex-1"
            >
              予約票を印刷
            </Button>
          </>
        )}
      </div>
    </div>
  )
}