'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaigns } from '@/hooks/useCampaigns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function CampaignsPage() {
  const router = useRouter()
  const { campaigns, loading, error, fetchCampaigns, updateCampaign } = useCampaigns()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐'
      case 'social': return '📱'
      case 'email': return '📧'
      case 'print': return '📰'
      case 'event': return '🎪'
      case 'radio': return '📻'
      case 'tv': return '📺'
      default: return '📢'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'web': return 'Web広告'
      case 'social': return 'SNS'
      case 'email': return 'メール'
      case 'print': return '印刷物'
      case 'event': return 'イベント'
      case 'radio': return 'ラジオ'
      case 'tv': return 'TV'
      default: return type
    }
  }

  const calculateROI = (revenue: number, cost: number) => {
    if (cost === 0) return 0
    return ((revenue - cost) / cost) * 100
  }

  const calculateCPA = (cost: number, conversions: number) => {
    if (conversions === 0) return 0
    return cost / conversions
  }

  const filteredCampaigns = campaigns
    .filter(campaign => {
      if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterStatus !== 'all' && campaign.status !== filterStatus) return false
      if (filterType !== 'all' && campaign.type !== filterType) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        case 'budget': return b.budget - a.budget
        case 'roi': return calculateROI(b.metrics.revenue, b.budget) - calculateROI(a.metrics.revenue, a.budget)
        case 'cpa': return calculateCPA(a.budget, a.metrics.conversions) - calculateCPA(b.budget, b.metrics.conversions)
        default: return 0
      }
    })

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.metrics.revenue, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0)
  const averageROI = calculateROI(totalRevenue, totalSpent)

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
              <h1 className="text-2xl font-bold text-gray-900">マーケティングキャンペーン</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/campaigns/analytics')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📊 分析
              </button>
              <button
                onClick={() => router.push('/campaigns/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規キャンペーン
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総予算</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalBudget.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                使用済: ¥{totalSpent.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総売上</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">広告経由</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総コンバージョン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalConversions}</div>
              <p className="text-xs text-gray-500 mt-1">成約件数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">平均ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${averageROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageROI.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">投資収益率</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">平均CPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                ¥{calculateCPA(totalSpent, totalConversions).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">獲得単価</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="キャンペーン名で検索..."
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
              <option value="active">実行中</option>
              <option value="paused">一時停止</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのタイプ</option>
              <option value="web">Web広告</option>
              <option value="social">SNS</option>
              <option value="email">メール</option>
              <option value="print">印刷物</option>
              <option value="event">イベント</option>
              <option value="radio">ラジオ</option>
              <option value="tv">TV</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">開始日順</option>
              <option value="budget">予算順</option>
              <option value="roi">ROI順</option>
              <option value="cpa">CPA順</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                🔲 カード
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
              >
                📋 リスト
              </button>
            </div>
            <button
              onClick={fetchCampaigns}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄 更新
            </button>
          </div>
        </div>

        {/* キャンペーン表示 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">キャンペーンが見つかりません</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <p className="text-sm text-gray-600">{campaign.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getTypeIcon(campaign.type)}</span>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status === 'active' ? '実行中' : 
                         campaign.status === 'paused' ? '一時停止' :
                         campaign.status === 'completed' ? '完了' :
                         campaign.status === 'cancelled' ? 'キャンセル' : '下書き'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 期間 */}
                  <div className="text-sm text-gray-600">
                    📅 {new Date(campaign.startDate).toLocaleDateString('ja-JP')} 〜 
                    {new Date(campaign.endDate).toLocaleDateString('ja-JP')}
                  </div>

                  {/* 予算と使用額 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">予算使用率</span>
                      <span className="text-sm font-medium">
                        {campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>¥{campaign.spent.toLocaleString()}</span>
                      <span>¥{campaign.budget.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* メトリクス */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {campaign.metrics.conversions}
                      </div>
                      <div className="text-xs text-gray-500">コンバージョン</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {campaign.metrics.clicks.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">クリック</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${calculateROI(campaign.metrics.revenue, campaign.spent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculateROI(campaign.metrics.revenue, campaign.spent).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">ROI</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        ¥{calculateCPA(campaign.spent, campaign.metrics.conversions).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">CPA</div>
                    </div>
                  </div>

                  {/* プラットフォーム */}
                  <div className="flex flex-wrap gap-1">
                    {campaign.platforms.map((platform, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {platform}
                      </span>
                    ))}
                  </div>

                  {/* アクション */}
                  <div className="flex justify-between pt-3 border-t">
                    <button
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      詳細を見る →
                    </button>
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => updateCampaign(campaign.id, { status: 'paused' })}
                        className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                      >
                        一時停止
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => updateCampaign(campaign.id, { status: 'active' })}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        再開
                      </button>
                    )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キャンペーン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    予算
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コンバージョン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPA
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
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                        <div className="text-xs text-gray-500">{campaign.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getTypeIcon(campaign.type)}</span>
                        <span className="text-sm text-gray-600">{getTypeText(campaign.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(campaign.startDate).toLocaleDateString('ja-JP')}</div>
                      <div className="text-xs text-gray-500">
                        〜 {new Date(campaign.endDate).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{campaign.budget.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        使用: ¥{campaign.spent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">
                        {campaign.metrics.conversions}
                      </div>
                      <div className="text-xs text-gray-500">
                        CTR: {campaign.metrics.impressions > 0 ? 
                          ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(2) : 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${
                        calculateROI(campaign.metrics.revenue, campaign.spent) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {calculateROI(campaign.metrics.revenue, campaign.spent).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{calculateCPA(campaign.spent, campaign.metrics.conversions).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status === 'active' ? '実行中' : 
                         campaign.status === 'paused' ? '一時停止' :
                         campaign.status === 'completed' ? '完了' :
                         campaign.status === 'cancelled' ? 'キャンセル' : '下書き'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                        >
                          編集
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
    </div>
  )
}