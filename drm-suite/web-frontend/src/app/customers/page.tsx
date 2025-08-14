'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomers } from '@/hooks/useCustomers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CustomersPage() {
  const router = useRouter()
  const { customers, loading, error, fetchCustomers, deleteCustomer } = useCustomers()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
    }
  }, [router])

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'corporate': return 'bg-blue-100 text-blue-800'
      case 'individual': return 'bg-green-100 text-green-800'
      case 'government': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'prospect': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCustomerRankIcon = (rank: string) => {
    switch (rank) {
      case 'S': return '💎'
      case 'A': return '⭐'
      case 'B': return '🥈'
      case 'C': return '🥉'
      default: return '📋'
    }
  }

  const filteredCustomers = customers
    .filter(customer => {
      if (searchTerm && !customer.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !customer.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !customer.phone.includes(searchTerm)) return false
      if (filterType !== 'all' && customer.type !== filterType) return false
      if (filterStatus !== 'all' && customer.status !== filterStatus) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'name': return a.name.localeCompare(b.name)
        case 'value': return b.totalSales - a.totalSales
        case 'rank': return (a.rank || 'Z').localeCompare(b.rank || 'Z')
        default: return 0
      }
    })

  const handleBulkAction = (action: string) => {
    if (selectedCustomers.length === 0) {
      alert('顧客を選択してください')
      return
    }
    
    switch (action) {
      case 'export':
        console.log('Exporting customers:', selectedCustomers)
        break
      case 'email':
        console.log('Sending email to:', selectedCustomers)
        break
      case 'delete':
        if (confirm(`${selectedCustomers.length}件の顧客を削除しますか？`)) {
          selectedCustomers.forEach(id => deleteCustomer(id))
          setSelectedCustomers([])
        }
        break
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

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
              <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/customers/import')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📥 インポート
              </button>
              <button
                onClick={() => router.push('/customers/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規顧客登録
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
              <CardTitle className="text-sm font-medium text-gray-600">総顧客数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-gray-500 mt-1">今月 +15件</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">アクティブ顧客</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.status === 'active').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(customers.filter(c => c.status === 'active').length / customers.length * 100)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総売上高</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                ¥{customers.reduce((sum, c) => sum + c.totalSales, 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">前月比 +22%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">平均LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                ¥{Math.round(customers.reduce((sum, c) => sum + c.totalSales, 0) / customers.length).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">+8% 向上</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">NPS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">72</div>
              <p className="text-xs text-gray-500 mt-1">優秀レベル</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-600 hover:text-gray-900"
              >
                {showFilters ? '▼' : '▶'} フィルター
              </button>
              {selectedCustomers.length > 0 && (
                <span className="text-sm text-blue-600">
                  {selectedCustomers.length}件選択中
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 hover:bg-gray-100 rounded"
              >
                {viewMode === 'list' ? '📋' : '📱'}
              </button>
              <button
                onClick={() => fetchCustomers()}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
              >
                🔄 更新
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="名前・メール・電話番号で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべてのタイプ</option>
                  <option value="corporate">法人</option>
                  <option value="individual">個人</option>
                  <option value="government">官公庁</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべてのステータス</option>
                  <option value="active">アクティブ</option>
                  <option value="inactive">非アクティブ</option>
                  <option value="prospect">見込み客</option>
                  <option value="suspended">停止中</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">登録日順</option>
                  <option value="name">名前順</option>
                  <option value="value">売上順</option>
                  <option value="rank">ランク順</option>
                </select>
              </div>

              {selectedCustomers.length > 0 && (
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    📤 エクスポート
                  </button>
                  <button
                    onClick={() => handleBulkAction('email')}
                    className="px-3 py-1 bg-blue-100 rounded hover:bg-blue-200"
                  >
                    📧 一括メール
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ 削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 顧客一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">顧客が見つかりません</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length}
                      onChange={selectAllCustomers}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ランク
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    総売上
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終取引
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-lg">{customer.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-xs text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCustomerTypeColor(customer.type)}`}>
                        {customer.type === 'corporate' ? '法人' : customer.type === 'individual' ? '個人' : '官公庁'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCustomerStatusColor(customer.status)}`}>
                        {customer.status === 'active' ? 'アクティブ' : 
                         customer.status === 'inactive' ? '非アクティブ' :
                         customer.status === 'prospect' ? '見込み客' : '停止中'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{getCustomerRankIcon(customer.rank)}</span>
                      <span className="ml-1 text-sm font-medium">{customer.rank}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{customer.totalSales.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.orderCount}件
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.lastOrderDate ? 
                        new Date(customer.lastOrderDate).toLocaleDateString('ja-JP') : 
                        '取引なし'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/customers/${customer.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('この顧客を削除しますか？')) {
                              deleteCustomer(customer.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold">{customer.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <p className="text-xs text-gray-500">{customer.code}</p>
                      </div>
                    </div>
                    <span className="text-2xl">{getCustomerRankIcon(customer.rank)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCustomerTypeColor(customer.type)}`}>
                      {customer.type === 'corporate' ? '法人' : customer.type === 'individual' ? '個人' : '官公庁'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCustomerStatusColor(customer.status)}`}>
                      {customer.status === 'active' ? 'アクティブ' : 
                       customer.status === 'inactive' ? '非アクティブ' :
                       customer.status === 'prospect' ? '見込み客' : '停止中'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">📧 {customer.email}</p>
                    <p className="text-sm text-gray-600">📞 {customer.phone}</p>
                    {customer.address && (
                      <p className="text-sm text-gray-600">📍 {customer.address}</p>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">総売上</span>
                      <span className="font-semibold">¥{customer.totalSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">取引回数</span>
                      <span className="font-semibold">{customer.orderCount}件</span>
                    </div>
                  </div>

                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {customer.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-3">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細を見る →
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}