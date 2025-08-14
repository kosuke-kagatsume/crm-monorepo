'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimates } from '@/hooks/useEstimates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function EstimatesPage() {
  const router = useRouter()
  const { estimates, loading, error, fetchEstimates, deleteEstimate, submitForApproval, approveEstimate, generatePDF } = useEstimates()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'sent': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '下書き'
      case 'submitted': return '承認待ち'
      case 'approved': return '承認済み'
      case 'rejected': return '却下'
      case 'sent': return '送信済み'
      default: return status
    }
  }

  const handleDownloadPDF = async (id: string, estimateNo: string) => {
    try {
      const blob = await generatePDF(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `見積書_${estimateNo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF生成エラー:', err)
    }
  }

  const filteredEstimates = estimates
    .filter(est => {
      if (filterStatus !== 'all' && est.status !== filterStatus) return false
      if (searchTerm && !est.customerName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !est.estimateNo.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'amount': return b.totalAmount - a.totalAmount
        case 'customer': return a.customerName.localeCompare(b.customerName)
        default: return 0
      }
    })

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
              <h1 className="text-2xl font-bold text-gray-900">見積管理</h1>
            </div>
            <button
              onClick={() => router.push('/estimates/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + 新規見積作成
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総見積件数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimates.length}</div>
              <p className="text-xs text-gray-500 mt-1">今月 +12件</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">承認待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estimates.filter(e => e.status === 'submitted').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">要対応</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今月の見積総額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{estimates.reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">前月比 +18%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">成約率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">68%</div>
              <p className="text-xs text-gray-500 mt-1">前月比 +5%</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="顧客名・見積番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="draft">下書き</option>
              <option value="submitted">承認待ち</option>
              <option value="approved">承認済み</option>
              <option value="rejected">却下</option>
              <option value="sent">送信済み</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">作成日順</option>
              <option value="amount">金額順</option>
              <option value="customer">顧客名順</option>
            </select>
            <button
              onClick={() => fetchEstimates()}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              🔄 更新
            </button>
          </div>
        </div>

        {/* 見積一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredEstimates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">見積が見つかりません</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    見積番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEstimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {estimate.estimateNo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{estimate.customerName}</div>
                      <div className="text-xs text-gray-500">{estimate.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{estimate.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{estimate.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        税込: ¥{(estimate.totalAmount * 1.1).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                        {getStatusText(estimate.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(estimate.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/estimates/${estimate.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        {estimate.status === 'draft' && (
                          <button
                            onClick={() => submitForApproval(estimate.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            承認申請
                          </button>
                        )}
                        {estimate.status === 'approved' && (
                          <button
                            onClick={() => handleDownloadPDF(estimate.id, estimate.estimateNo)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            PDF
                          </button>
                        )}
                        {estimate.status === 'draft' && (
                          <button
                            onClick={() => deleteEstimate(estimate.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}