'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'

interface AlertItem {
  title: string
  urgency: 'high' | 'medium' | 'low'
  description: string
}

interface LocationData {
  name: string
  sales: string
  profit: string
  efficiency: number
  status: 'excellent' | 'good' | 'attention'
}

interface CustomerData {
  totalCustomers: number
  totalValue: string
  newCustomers: number
  satisfactionScore: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem('userName')
    const role = localStorage.getItem('userRole')
    
    if (!name || !role) {
      router.push('/login')
      return
    }
    
    setUserName(name)
    setUserRole(role)
  }, [router])

  if (!mounted) return null

  // v1.0データ - スクリーンショットに基づく実際のデータ
  const companyPerformanceData = {
    sales: '¥125,000,000',
    profitRate: '84.5%',
    cashFlow: '¥45,000,000',
    projects: 45,
    efficiency: 92
  }

  const customerDatabaseData: CustomerData = {
    totalCustomers: 458,
    totalValue: '¥285,000,000',
    newCustomers: 12,
    satisfactionScore: 4.6
  }

  const criticalAlerts: AlertItem[] = [
    { title: '大型案件の最終判断期限', urgency: 'high', description: '明日までに¥25M案件の承認が必要' },
    { title: '資金調達の検討', urgency: 'medium', description: '来月の運転資金について議論要' },
    { title: '新規拠点開設の準備', urgency: 'medium', description: '大阪支店の開設準備を進める必要' }
  ]

  const locationPerformance: LocationData[] = [
    { name: '本社', sales: '¥75M', profit: '¥28M', efficiency: 94, status: 'excellent' },
    { name: '東京支店', sales: '¥42M', profit: '¥15M', efficiency: 89, status: 'good' },
    { name: '大阪支店', sales: '¥38M', profit: '¥12M', efficiency: 82, status: 'good' },
    { name: '福岡支店', sales: '¥25M', profit: '¥8M', efficiency: 76, status: 'attention' }
  ]

  const teamPerformance = [
    { team: '営業部', target: 100, actual: 118, efficiency: 94 },
    { team: '技術部', target: 100, actual: 105, efficiency: 89 },
    { team: '管理部', target: 100, actual: 112, efficiency: 92 }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'attention': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                DRM Suite v1.0 - 経営ダッシュボード
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.clear()
                  router.push('/login')
                }}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* v1.0 復元: 全社パフォーマンス - 大きなグラデーションカード */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">全社パフォーマンス</h2>
              <div className="text-right">
                <p className="text-sm opacity-80">最終更新: 2分前</p>
                <p className="text-xs opacity-60">リアルタイムデータ</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">今月売上</span>
                  <span className="text-green-300 text-sm">+22%</span>
                </div>
                <p className="text-3xl font-bold">{companyPerformanceData.sales}</p>
                <p className="text-xs opacity-70 mt-1">前月比 +¥23M</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">利益率</span>
                  <span className="text-green-300 text-sm">+2.1%</span>
                </div>
                <p className="text-3xl font-bold">{companyPerformanceData.profitRate}</p>
                <p className="text-xs opacity-70 mt-1">業界平均 68.2%</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">キャッシュフロー</span>
                  <span className="text-green-300 text-sm">健全</span>
                </div>
                <p className="text-3xl font-bold">{companyPerformanceData.cashFlow}</p>
                <p className="text-xs opacity-70 mt-1">運転資金 6ヶ月分</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">稼働率</span>
                  <span className="text-green-300 text-sm">最適</span>
                </div>
                <p className="text-3xl font-bold">{companyPerformanceData.efficiency}%</p>
                <Progress value={companyPerformanceData.efficiency} className="mt-2 h-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 経営判断が必要な事項 - オレンジアラート */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                ⚠️ 経営判断が必要な事項
              </h3>
              <div className="space-y-4">
                {criticalAlerts.map((alert, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        alert.urgency === 'high' ? 'bg-red-200 text-red-800' :
                        alert.urgency === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {alert.urgency === 'high' ? '緊急' : 
                         alert.urgency === 'medium' ? '重要' : '通常'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90">{alert.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 全社顧客データベース - 紫グラデーション */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                👥 全社顧客データベース
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{customerDatabaseData.totalCustomers}</p>
                  <p className="text-sm opacity-80">総顧客数</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{customerDatabaseData.totalValue}</p>
                  <p className="text-sm opacity-80">総顧客価値</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{customerDatabaseData.newCustomers}</p>
                  <p className="text-sm opacity-80">新規（今月）</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{customerDatabaseData.satisfactionScore}</p>
                  <p className="text-sm opacity-80">満足度</p>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">平均顧客単価</span>
                  <span className="font-bold">¥622,000</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">リピート率</span>
                  <span className="font-bold">89.5%</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">継続期間（平均）</span>
                  <span className="font-bold">3.2年</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 拠点別パフォーマンス */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🏢 拠点別パフォーマンス</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {locationPerformance.map((location, index) => (
                <div key={index} className="border rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{location.name}</h4>
                    <span className={`text-sm font-medium ${getStatusColor(location.status)}`}>
                      {location.status === 'excellent' ? '優秀' :
                       location.status === 'good' ? '良好' : '要注意'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">売上</span>
                      <span className="font-medium">{location.sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">利益</span>
                      <span className="font-medium">{location.profit}</span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">効率性</span>
                        <span className="text-sm font-medium">{location.efficiency}%</span>
                      </div>
                      <Progress value={location.efficiency} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 財務管理セクション */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">💰 財務管理</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">売上推移</h4>
                <p className="text-2xl font-bold text-green-700">¥125M</p>
                <p className="text-sm text-green-600">+22% 前月比</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">営業利益</h4>
                <p className="text-2xl font-bold text-blue-700">¥42.5M</p>
                <p className="text-sm text-blue-600">利益率 34.0%</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">純利益</h4>
                <p className="text-2xl font-bold text-purple-700">¥28.3M</p>
                <p className="text-sm text-purple-600">純利益率 22.6%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teamPerformance.map((team, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{team.team}</h4>
                    <span className="text-sm text-green-600">+{team.actual - team.target}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>目標達成率</span>
                      <span className="font-medium">{team.actual}%</span>
                    </div>
                    <Progress value={team.actual} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>効率性</span>
                      <span className="font-medium">{team.efficiency}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RAG Copilot セクション */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🤖 Multi-Agent RAG v2.0</h3>
              <p className="text-sm opacity-90">
                AIアシスタントが業務をサポートします。経営分析や予測をお手伝いします。
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition">
              RAGを起動
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}