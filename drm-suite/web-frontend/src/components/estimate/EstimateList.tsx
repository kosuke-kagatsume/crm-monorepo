'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EstimateData, EstimateFilters } from './types'

interface EstimateListProps {
  estimates: EstimateData[]
  filters: EstimateFilters
  onFiltersChange: (filters: EstimateFilters) => void
  onViewDetail: (id: string) => void
  onSubmitForApproval: (id: string) => void
  onDownloadPDF: (id: string, estimateNo: string) => void
  onDelete: (id: string) => void
  loading?: boolean
  error?: string
}

export function EstimateList({
  estimates,
  filters,
  onFiltersChange,
  onViewDetail,
  onSubmitForApproval,
  onDownloadPDF,
  onDelete,
  loading,
  error
}: EstimateListProps) {
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

  const filteredEstimates = estimates
    .filter(est => {
      if (filters.filterStatus !== 'all' && est.status !== filters.filterStatus) return false
      if (filters.searchTerm && !est.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
          !est.estimateNo.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'date': return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        case 'amount': return b.totalAmount - a.totalAmount
        case 'customer': return a.customerName.localeCompare(b.customerName)
        default: return 0
      }
    })

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="顧客名・見積番号で検索..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.filterStatus}
            onChange={(e) => onFiltersChange({ ...filters, filterStatus: e.target.value })}
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
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">作成日順</option>
            <option value="amount">金額順</option>
            <option value="customer">顧客名順</option>
          </select>
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(estimate.status)}>
                      {getStatusText(estimate.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(estimate.createdAt || '').toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewDetail(estimate.id!)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                      {estimate.status === 'draft' && (
                        <button
                          onClick={() => onSubmitForApproval(estimate.id!)}
                          className="text-green-600 hover:text-green-900"
                        >
                          承認申請
                        </button>
                      )}
                      {estimate.status === 'approved' && (
                        <button
                          onClick={() => onDownloadPDF(estimate.id!, estimate.estimateNo)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          PDF
                        </button>
                      )}
                      {estimate.status === 'draft' && (
                        <button
                          onClick={() => onDelete(estimate.id!)}
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
    </div>
  )
}