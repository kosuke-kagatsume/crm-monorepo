'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface InventoryItem {
  id: string
  code: string
  name: string
  category: string
  description: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitPrice: number
  location: string
  supplier: string
  lastUpdated: string
  expiryDate?: string
  batchNumber?: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired' | 'reserved'
  reservedQuantity: number
  availableQuantity: number
  movements: InventoryMovement[]
}

interface InventoryMovement {
  id: string
  type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reason: string
  date: string
  user: string
  referenceId?: string
}

export default function InventoryPage() {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'low-stock'>('list')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustmentItem, setAdjustmentItem] = useState<InventoryItem | null>(null)
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    type: 'adjustment' as const,
    reason: ''
  })

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchInventory()
  }, [router])

  const fetchInventory = async () => {
    setLoading(true)
    // モックデータ
    const mockInventory: InventoryItem[] = [
      {
        id: 'INV-001',
        code: 'MAT-001',
        name: 'シリコン塗料（白）',
        category: '塗料',
        description: '高品質シリコン系外壁塗料 15kg缶',
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        unit: '缶',
        unitPrice: 12000,
        location: '倉庫A-01',
        supplier: '塗料メーカーA',
        lastUpdated: '2024-08-10',
        status: 'in-stock',
        reservedQuantity: 5,
        availableQuantity: 20,
        movements: [
          { id: '1', type: 'in', quantity: 30, reason: '定期発注', date: '2024-08-01', user: '田中太郎', referenceId: 'PO-001' },
          { id: '2', type: 'out', quantity: 5, reason: '田中様邸工事', date: '2024-08-05', user: '山田次郎', referenceId: 'PRJ-001' }
        ]
      },
      {
        id: 'INV-002',
        code: 'MAT-002',
        name: 'ウレタン塗料（グレー）',
        category: '塗料',
        description: 'ウレタン系屋根塗料 18kg缶',
        currentStock: 3,
        minStock: 5,
        maxStock: 50,
        unit: '缶',
        unitPrice: 15000,
        location: '倉庫A-02',
        supplier: '塗料メーカーB',
        lastUpdated: '2024-08-08',
        status: 'low-stock',
        reservedQuantity: 2,
        availableQuantity: 1,
        movements: [
          { id: '3', type: 'in', quantity: 10, reason: '定期発注', date: '2024-07-15', user: '田中太郎' },
          { id: '4', type: 'out', quantity: 7, reason: '佐藤邸屋根工事', date: '2024-08-03', user: '鈴木太郎', referenceId: 'PRJ-003' }
        ]
      },
      {
        id: 'INV-003',
        code: 'TOOL-001',
        name: 'ローラーブラシ（中毛）',
        category: '工具',
        description: '外壁塗装用ローラーブラシ 9インチ',
        currentStock: 45,
        minStock: 20,
        maxStock: 200,
        unit: '本',
        unitPrice: 800,
        location: '倉庫B-01',
        supplier: '工具商社C',
        lastUpdated: '2024-08-12',
        status: 'in-stock',
        reservedQuantity: 10,
        availableQuantity: 35,
        movements: [
          { id: '5', type: 'in', quantity: 50, reason: '工具補充', date: '2024-08-10', user: '佐藤花子' },
          { id: '6', type: 'out', quantity: 5, reason: '現場消耗', date: '2024-08-12', user: '山田次郎' }
        ]
      },
      {
        id: 'INV-004',
        code: 'MAT-003',
        name: '防水シート',
        category: '建材',
        description: '屋根防水用シート 1m×50m巻',
        currentStock: 0,
        minStock: 5,
        maxStock: 30,
        unit: '巻',
        unitPrice: 8500,
        location: '倉庫C-01',
        supplier: '建材商社D',
        lastUpdated: '2024-08-05',
        status: 'out-of-stock',
        reservedQuantity: 0,
        availableQuantity: 0,
        movements: [
          { id: '7', type: 'out', quantity: 8, reason: '新築住宅A工事', date: '2024-08-05', user: '渡辺健二', referenceId: 'PRJ-004' }
        ]
      },
      {
        id: 'INV-005',
        code: 'CHEM-001',
        name: 'シーラー剤',
        category: '化学材料',
        description: '下地処理用シーラー 20kg缶',
        currentStock: 12,
        minStock: 8,
        maxStock: 40,
        unit: '缶',
        unitPrice: 6500,
        location: '倉庫A-03',
        supplier: '化学メーカーE',
        lastUpdated: '2024-08-09',
        expiryDate: '2025-02-28',
        status: 'in-stock',
        reservedQuantity: 3,
        availableQuantity: 9,
        movements: [
          { id: '8', type: 'in', quantity: 15, reason: '定期発注', date: '2024-07-20', user: '田中太郎' },
          { id: '9', type: 'out', quantity: 3, reason: '山田ビル工事', date: '2024-08-08', user: '佐藤花子', referenceId: 'PRJ-002' }
        ]
      }
    ]
    setInventory(mockInventory)
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-purple-100 text-purple-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return '在庫あり'
      case 'low-stock': return '在庫少'
      case 'out-of-stock': return '在庫切れ'
      case 'expired': return '期限切れ'
      case 'reserved': return '予約済み'
      default: return status
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '塗料': return '🎨'
      case '工具': return '🔧'
      case '建材': return '🧱'
      case '化学材料': return '⚗️'
      case '安全用品': return '🦺'
      default: return '📦'
    }
  }

  const getStockLevel = (item: InventoryItem) => {
    if (item.currentStock === 0) return 0
    if (item.currentStock <= item.minStock) return 25
    if (item.currentStock >= item.maxStock) return 100
    return (item.currentStock / item.maxStock) * 100
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const filteredInventory = inventory
    .filter(item => {
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !item.code.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterCategory !== 'all' && item.category !== filterCategory) return false
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      if (filterLocation !== 'all' && item.location !== filterLocation) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'code': return a.code.localeCompare(b.code)
        case 'stock': return b.currentStock - a.currentStock
        case 'category': return a.category.localeCompare(b.category)
        case 'location': return a.location.localeCompare(b.location)
        case 'updated': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        default: return 0
      }
    })

  const lowStockItems = inventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock')
  const expiringSoonItems = inventory.filter(item => isExpiringSoon(item.expiryDate))

  const handleAdjustStock = (item: InventoryItem) => {
    setAdjustmentItem(item)
    setAdjustmentData({
      quantity: 0,
      type: 'adjustment',
      reason: ''
    })
    setShowAdjustModal(true)
  }

  const submitAdjustment = async () => {
    if (!adjustmentItem || adjustmentData.quantity === 0 || !adjustmentData.reason) {
      alert('数量と理由を入力してください')
      return
    }

    // 在庫調整処理をここに実装
    console.log('Stock adjustment:', {
      item: adjustmentItem.id,
      ...adjustmentData
    })

    setShowAdjustModal(false)
    setAdjustmentItem(null)
    fetchInventory()
  }

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) {
      alert('アイテムを選択してください')
      return
    }

    switch (action) {
      case 'export':
        console.log('Exporting items:', selectedItems)
        break
      case 'order':
        console.log('Creating order for:', selectedItems)
        break
      case 'move':
        console.log('Moving items:', selectedItems)
        break
    }
  }

  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)
  const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
                ← ダッシュボード
              </button>
              <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/inventory/movements')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📊 入出庫履歴
              </button>
              <button
                onClick={() => router.push('/inventory/order')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📋 発注管理
              </button>
              <button
                onClick={() => router.push('/inventory/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規アイテム
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総アイテム数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-gray-500 mt-1">総在庫: {totalItems.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">在庫価値</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">¥{totalValue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">前月比 +5%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">在庫少アイテム</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-xs text-gray-500 mt-1">要発注確認</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">期限切れ間近</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoonItems.length}</div>
              <p className="text-xs text-gray-500 mt-1">30日以内</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">在庫切れ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {inventory.filter(i => i.status === 'out-of-stock').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">緊急発注要</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="アイテム名・コードで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのカテゴリ</option>
              <option value="塗料">塗料</option>
              <option value="工具">工具</option>
              <option value="建材">建材</option>
              <option value="化学材料">化学材料</option>
              <option value="安全用品">安全用品</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="in-stock">在庫あり</option>
              <option value="low-stock">在庫少</option>
              <option value="out-of-stock">在庫切れ</option>
              <option value="expired">期限切れ</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">名前順</option>
              <option value="code">コード順</option>
              <option value="stock">在庫数順</option>
              <option value="category">カテゴリ順</option>
              <option value="location">保管場所順</option>
              <option value="updated">更新日順</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                📋 リスト
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                🔲 カード
              </button>
              <button
                onClick={() => setViewMode('low-stock')}
                className={`px-3 py-2 rounded-lg ${viewMode === 'low-stock' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                ⚠️ 要注意
              </button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex gap-2 pt-4 border-t mt-4">
              <span className="text-sm text-blue-600">{selectedItems.length}件選択中</span>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                📤 エクスポート
              </button>
              <button
                onClick={() => handleBulkAction('order')}
                className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200"
              >
                📋 一括発注
              </button>
              <button
                onClick={() => handleBulkAction('move')}
                className="px-3 py-1 bg-green-100 rounded hover:bg-green-200"
              >
                📦 移動
              </button>
            </div>
          )}
        </div>

        {/* 在庫一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : viewMode === 'low-stock' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">⚠️ 在庫切れ・在庫少アイテム</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.code} - {item.location}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-bold text-red-600">{item.currentStock} {item.unit}</div>
                          <div className="text-xs text-gray-500">最小: {item.minStock}</div>
                        </div>
                        <button
                          onClick={() => router.push('/inventory/order')}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          発注
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {expiringSoonItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">⏰ 期限切れ間近</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expiringSoonItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">期限: {item.expiryDate}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{item.currentStock} {item.unit}</div>
                          <div className="text-xs text-orange-600">要確認</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getCategoryIcon(item.category)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.code}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id])
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id))
                        }
                      }}
                      className="rounded"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                    <span className="text-sm text-gray-600">{item.category}</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">在庫レベル</span>
                      <span className="text-sm font-medium">
                        {item.currentStock} / {item.maxStock} {item.unit}
                      </span>
                    </div>
                    <Progress value={getStockLevel(item)} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>最小: {item.minStock}</span>
                      <span>利用可能: {item.availableQuantity}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">単価:</span>
                      <span className="font-medium">¥{item.unitPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">保管場所:</span>
                      <span>{item.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">仕入先:</span>
                      <span>{item.supplier}</span>
                    </div>
                    {item.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">期限:</span>
                        <span className={isExpiringSoon(item.expiryDate) ? 'text-orange-600' : ''}>
                          {item.expiryDate}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <button
                      onClick={() => router.push(`/inventory/${item.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細を見る →
                    </button>
                    <button
                      onClick={() => handleAdjustStock(item)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      在庫調整
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredInventory.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredInventory.map(item => item.id))
                        } else {
                          setSelectedItems([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アイテム
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    在庫数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    利用可能
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    単価
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    保管場所
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id])
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id))
                          }
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.code}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <Progress value={getStockLevel(item)} className="h-2" />
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{item.currentStock} {item.unit}</div>
                          <div className="text-xs text-gray-500">
                            最小: {item.minStock}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.availableQuantity} {item.unit}
                      </div>
                      {item.reservedQuantity > 0 && (
                        <div className="text-xs text-gray-500">
                          予約: {item.reservedQuantity}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{item.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                      </Badge>
                      {item.expiryDate && isExpiringSoon(item.expiryDate) && (
                        <div className="text-xs text-orange-600 mt-1">期限間近</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/inventory/${item.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => handleAdjustStock(item)}
                          className="text-green-600 hover:text-green-900"
                        >
                          調整
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 在庫調整モーダル */}
      {showAdjustModal && adjustmentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">在庫調整: {adjustmentItem.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在の在庫: {adjustmentItem.currentStock} {adjustmentItem.unit}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  調整タイプ
                </label>
                <select
                  value={adjustmentData.type}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="adjustment">在庫調整</option>
                  <option value="in">入庫</option>
                  <option value="out">出庫</option>
                  <option value="transfer">移動</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量 ({adjustmentData.type === 'out' ? '出庫' : '入庫'})
                </label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  理由 *
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">調整後在庫:</div>
                <div className="font-bold">
                  {adjustmentData.type === 'out' 
                    ? adjustmentItem.currentStock - adjustmentData.quantity
                    : adjustmentItem.currentStock + adjustmentData.quantity
                  } {adjustmentItem.unit}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => setShowAdjustModal(false)}
                variant="outline"
              >
                キャンセル
              </Button>
              <Button onClick={submitAdjustment}>
                調整実行
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}