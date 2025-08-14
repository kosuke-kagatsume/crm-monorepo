'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useExpenses } from '@/hooks/useExpenses'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ExpensesPage() {
  const router = useRouter()
  const { expenses, stats, loading, error, refetch, createExpense, updateExpenseStatus } = useExpenses({ autoFetch: true })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false)
  const [userRole, setUserRole] = useState('')

  // 新規経費フォーム
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'materials' as const,
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    notes: '',
    receipt: false
  })

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (!role) {
      router.push('/login')
      return
    }
    setUserRole(role)
    
    // 月初と月末を設定
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    })
  }, [router])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'materials': return '🔨'
      case 'labor': return '👷'
      case 'equipment': return '🏗️'
      case 'office': return '📎'
      case 'marketing': return '📢'
      case 'utilities': return '💡'
      default: return '📋'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'materials': return '材料費'
      case 'labor': return '人件費'
      case 'equipment': return '設備費'
      case 'office': return '事務費'
      case 'marketing': return '広告費'
      case 'utilities': return '光熱費'
      default: return 'その他'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '承認待ち'
      case 'approved': return '承認済み'
      case 'rejected': return '却下'
      default: return status
    }
  }

  const handleSubmitExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) {
      alert('必須項目を入力してください')
      return
    }

    const success = await createExpense({
      ...newExpense,
      submittedBy: localStorage.getItem('userEmail') || 'user@test.com'
    })

    if (success) {
      setShowNewExpenseModal(false)
      setNewExpense({
        description: '',
        amount: 0,
        category: 'materials',
        date: new Date().toISOString().split('T')[0],
        projectId: '',
        notes: '',
        receipt: false
      })
      refetch()
    }
  }

  const handleApprove = async (expenseId: string) => {
    if (confirm('この経費を承認しますか？')) {
      await updateExpenseStatus(expenseId, 'approved')
      refetch()
    }
  }

  const handleReject = async (expenseId: string) => {
    const reason = prompt('却下理由を入力してください：')
    if (reason) {
      await updateExpenseStatus(expenseId, 'rejected')
      refetch()
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterCategory !== 'all' && expense.category !== filterCategory) return false
    if (filterStatus !== 'all' && expense.status !== filterStatus) return false
    if (dateRange.start && new Date(expense.date) < new Date(dateRange.start)) return false
    if (dateRange.end && new Date(expense.date) > new Date(dateRange.end)) return false
    return true
  })

  const canApprove = userRole === '経営者' || userRole === '支店長' || userRole === '経理担当'

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
              <h1 className="text-2xl font-bold text-gray-900">経費管理</h1>
            </div>
            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + 経費申請
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今月の総経費</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{stats.totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">前月比 +12%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">承認待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ¥{stats.pendingApproval.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {expenses.filter(e => e.status === 'pending').length}件
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">承認済み</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{stats.approvedAmount.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {expenses.filter(e => e.status === 'approved').length}件
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">却下</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ¥{stats.rejectedAmount.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {expenses.filter(e => e.status === 'rejected').length}件
              </p>
            </CardContent>
          </Card>
        </div>

        {/* カテゴリ別内訳 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>カテゴリ別内訳</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.byCategory).map(([category, amount]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                  <div className="text-sm text-gray-600">{getCategoryText(category)}</div>
                  <div className="font-semibold">¥{amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="説明で検索..."
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
              <option value="materials">材料費</option>
              <option value="labor">人件費</option>
              <option value="equipment">設備費</option>
              <option value="office">事務費</option>
              <option value="marketing">広告費</option>
              <option value="utilities">光熱費</option>
              <option value="other">その他</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="pending">承認待ち</option>
              <option value="approved">承認済み</option>
              <option value="rejected">却下</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="self-center">〜</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={refetch}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄 更新
            </button>
          </div>
        </div>

        {/* 経費一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">経費データが見つかりません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    プロジェクト
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    領収書
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                      <span className="ml-2 text-sm text-gray-600">{getCategoryText(expense.category)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{expense.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.projectId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.submittedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.receipt ? '✅' : '❌'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {expense.status === 'pending' && canApprove && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            却下
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/expenses/${expense.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 月次推移グラフ */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>月次推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {stats.monthlyTrend.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(month.amount / Math.max(...stats.monthlyTrend.map(m => m.amount))) * 200}px` }}></div>
                  <div className="text-xs mt-2">{month.month}</div>
                  <div className="text-xs font-semibold">¥{(month.amount / 1000000).toFixed(1)}M</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 新規経費モーダル */}
      {showNewExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新規経費申請</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明 *
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金額 *
                </label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="materials">材料費</option>
                  <option value="labor">人件費</option>
                  <option value="equipment">設備費</option>
                  <option value="office">事務費</option>
                  <option value="marketing">広告費</option>
                  <option value="utilities">光熱費</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日付
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プロジェクトID
                </label>
                <input
                  type="text"
                  value={newExpense.projectId}
                  onChange={(e) => setNewExpense({ ...newExpense, projectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="関連プロジェクトがある場合"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newExpense.receipt}
                  onChange={(e) => setNewExpense({ ...newExpense, receipt: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  領収書あり
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => setShowNewExpenseModal(false)}
                variant="outline"
              >
                キャンセル
              </Button>
              <Button onClick={handleSubmitExpense}>
                申請
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}