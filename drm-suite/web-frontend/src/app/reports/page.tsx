'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface ReportData {
  sales: {
    totalRevenue: number
    monthlyRevenue: number
    yearlyRevenue: number
    growthRate: number
    avgDealSize: number
    conversionRate: number
    monthlySales: Array<{ month: string; amount: number; deals: number }>
    topCustomers: Array<{ name: string; amount: number; deals: number }>
    salesByRegion: Array<{ region: string; amount: number; percentage: number }>
    salesByCategory: Array<{ category: string; amount: number; percentage: number }>
  }
  projects: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    onTimeDelivery: number
    avgProjectDuration: number
    totalBudget: number
    utilizationRate: number
    projectsByStatus: Array<{ status: string; count: number; percentage: number }>
    projectsByType: Array<{ type: string; count: number; budget: number }>
    monthlyProgress: Array<{ month: string; started: number; completed: number }>
  }
  financial: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    cashFlow: number
    accountsReceivable: number
    accountsPayable: number
    monthlyFinancials: Array<{ month: string; revenue: number; expenses: number; profit: number }>
    expensesByCategory: Array<{ category: string; amount: number; percentage: number }>
    profitByProject: Array<{ project: string; revenue: number; cost: number; profit: number }>
  }
  operations: {
    totalEmployees: number
    utilization: number
    productivity: number
    customerSatisfaction: number
    teamPerformance: Array<{ member: string; projects: number; hours: number; efficiency: number }>
    resourceUtilization: Array<{ resource: string; usage: number; capacity: number }>
    qualityMetrics: Array<{ metric: string; score: number; target: number }>
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedReport, setSelectedReport] = useState('overview')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [exportFormat, setExportFormat] = useState('pdf')

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchReportData()
  }, [router, selectedPeriod, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    // モックデータ
    const mockData: ReportData = {
      sales: {
        totalRevenue: 45650000,
        monthlyRevenue: 8920000,
        yearlyRevenue: 89200000,
        growthRate: 22.5,
        avgDealSize: 2480000,
        conversionRate: 68.5,
        monthlySales: [
          { month: '1月', amount: 7200000, deals: 3 },
          { month: '2月', amount: 8100000, deals: 4 },
          { month: '3月', amount: 9500000, deals: 5 },
          { month: '4月', amount: 7800000, deals: 3 },
          { month: '5月', amount: 8600000, deals: 4 },
          { month: '6月', amount: 9200000, deals: 4 },
          { month: '7月', amount: 8920000, deals: 4 },
          { month: '8月', amount: 9100000, deals: 5 }
        ],
        topCustomers: [
          { name: '山田商事', amount: 8500000, deals: 2 },
          { name: '田中建設', amount: 6200000, deals: 3 },
          { name: 'サクラ不動産', amount: 4800000, deals: 2 },
          { name: '青空工業', amount: 3900000, deals: 1 },
          { name: 'みどり住宅', amount: 3200000, deals: 2 }
        ],
        salesByRegion: [
          { region: '東京都', amount: 18600000, percentage: 40.7 },
          { region: '神奈川県', amount: 12400000, percentage: 27.2 },
          { region: '埼玉県', amount: 8900000, percentage: 19.5 },
          { region: '千葉県', amount: 5750000, percentage: 12.6 }
        ],
        salesByCategory: [
          { category: '外壁塗装', amount: 19800000, percentage: 43.4 },
          { category: 'リフォーム', amount: 12600000, percentage: 27.6 },
          { category: '新築工事', amount: 8900000, percentage: 19.5 },
          { category: '屋根工事', amount: 4350000, percentage: 9.5 }
        ]
      },
      projects: {
        totalProjects: 28,
        activeProjects: 12,
        completedProjects: 14,
        onTimeDelivery: 89.3,
        avgProjectDuration: 45,
        totalBudget: 124500000,
        utilizationRate: 78.5,
        projectsByStatus: [
          { status: '計画中', count: 5, percentage: 17.9 },
          { status: '進行中', count: 12, percentage: 42.9 },
          { status: '完了', count: 9, percentage: 32.1 },
          { status: '保留', count: 2, percentage: 7.1 }
        ],
        projectsByType: [
          { type: '塗装工事', count: 12, budget: 48600000 },
          { type: 'リフォーム', count: 8, budget: 35200000 },
          { type: '新築工事', count: 4, budget: 28400000 },
          { type: '修理工事', count: 4, budget: 12300000 }
        ],
        monthlyProgress: [
          { month: '1月', started: 3, completed: 2 },
          { month: '2月', started: 4, completed: 3 },
          { month: '3月', started: 5, completed: 4 },
          { month: '4月', started: 3, completed: 2 },
          { month: '5月', started: 4, completed: 3 },
          { month: '6月', started: 3, completed: 4 },
          { month: '7月', started: 4, completed: 2 },
          { month: '8月', started: 2, completed: 3 }
        ]
      },
      financial: {
        totalRevenue: 45650000,
        totalExpenses: 32180000,
        netProfit: 13470000,
        profitMargin: 29.5,
        cashFlow: 8920000,
        accountsReceivable: 12400000,
        accountsPayable: 4650000,
        monthlyFinancials: [
          { month: '1月', revenue: 7200000, expenses: 5040000, profit: 2160000 },
          { month: '2月', revenue: 8100000, expenses: 5670000, profit: 2430000 },
          { month: '3月', revenue: 9500000, expenses: 6650000, profit: 2850000 },
          { month: '4月', revenue: 7800000, expenses: 5460000, profit: 2340000 },
          { month: '5月', revenue: 8600000, expenses: 6020000, profit: 2580000 },
          { month: '6月', revenue: 9200000, expenses: 6440000, profit: 2760000 },
          { month: '7月', revenue: 8920000, expenses: 6244000, profit: 2676000 },
          { month: '8月', revenue: 9100000, expenses: 6370000, profit: 2730000 }
        ],
        expensesByCategory: [
          { category: '材料費', amount: 14560000, percentage: 45.2 },
          { category: '人件費', amount: 9650000, percentage: 30.0 },
          { category: '機械・設備費', amount: 3540000, percentage: 11.0 },
          { category: '交通費', amount: 2210000, percentage: 6.9 },
          { category: 'その他', amount: 2220000, percentage: 6.9 }
        ],
        profitByProject: [
          { project: '田中様邸 外壁塗装', revenue: 2500000, cost: 1750000, profit: 750000 },
          { project: '山田ビル リフォーム', revenue: 8500000, cost: 5950000, profit: 2550000 },
          { project: '新築住宅A', revenue: 35000000, cost: 24500000, profit: 10500000 },
          { project: '佐藤邸 屋根修理', revenue: 1200000, cost: 840000, profit: 360000 }
        ]
      },
      operations: {
        totalEmployees: 24,
        utilization: 78.5,
        productivity: 92.3,
        customerSatisfaction: 4.6,
        teamPerformance: [
          { member: '山田次郎', projects: 5, hours: 156, efficiency: 94.2 },
          { member: '佐藤花子', projects: 3, hours: 128, efficiency: 91.8 },
          { member: '田中太郎', projects: 4, hours: 144, efficiency: 88.5 },
          { member: '鈴木太郎', projects: 6, hours: 172, efficiency: 96.1 },
          { member: '渡辺健二', projects: 2, hours: 98, efficiency: 87.3 }
        ],
        resourceUtilization: [
          { resource: '塗装機械A', usage: 85, capacity: 100 },
          { resource: '足場材', usage: 92, capacity: 100 },
          { resource: '運搬車両', usage: 78, capacity: 100 },
          { resource: '作業員', usage: 82, capacity: 100 }
        ],
        qualityMetrics: [
          { metric: '顧客満足度', score: 4.6, target: 4.5 },
          { metric: '再工事率', score: 2.1, target: 3.0 },
          { metric: '納期遵守率', score: 89.3, target: 90.0 },
          { metric: '安全事故率', score: 0.8, target: 1.0 }
        ]
      }
    }
    setReportData(mockData)
    setLoading(false)
  }

  const handleExport = (format: string) => {
    console.log(`Exporting report in ${format} format`)
    // エクスポート処理をここに実装
  }

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* KPI サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">総売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData?.sales.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+{reportData?.sales.growthRate}% 前年比</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">純利益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{reportData?.financial.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">利益率 {reportData?.financial.profitMargin}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">進行中プロジェクト</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportData?.projects.activeProjects}</div>
            <p className="text-xs text-gray-500 mt-1">総数 {reportData?.projects.totalProjects}件</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">稼働率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{reportData?.operations.utilization}%</div>
            <p className="text-xs text-gray-500 mt-1">生産性 {reportData?.operations.productivity}%</p>
          </CardContent>
        </Card>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>月次売上推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {reportData?.sales.monthlySales.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t" 
                    style={{ 
                      height: `${(month.amount / Math.max(...reportData.sales.monthlySales.map(m => m.amount))) * 200}px` 
                    }}
                  ></div>
                  <div className="text-xs mt-2">{month.month}</div>
                  <div className="text-xs font-semibold">¥{(month.amount / 1000000).toFixed(1)}M</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>売上構成比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.sales.salesByCategory.map((category) => (
                <div key={category.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">{category.category}</span>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    ¥{category.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 詳細テーブル */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>トップ顧客</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.sales.topCustomers.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.deals}件の取引</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">¥{customer.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>チーム成果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.operations.teamPerformance.map((member) => (
                <div key={member.member} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">{member.member.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{member.member}</div>
                      <div className="text-sm text-gray-600">{member.projects}プロジェクト</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{member.efficiency}%</div>
                    <div className="text-sm text-gray-600">{member.hours}h</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">今月の売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData?.sales.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">成約率 {reportData?.sales.conversionRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">平均案件規模</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData?.sales.avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">前月比 +8%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">年間売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData?.sales.yearlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">目標達成率 112%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>地域別売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.sales.salesByRegion.map((region) => (
                <div key={region.region}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{region.region}</span>
                    <span className="text-sm text-gray-600">{region.percentage}%</span>
                  </div>
                  <Progress value={region.percentage} className="h-3" />
                  <div className="text-xs text-gray-500 mt-1">
                    ¥{region.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>月次売上詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">月</th>
                    <th className="text-right py-2">売上</th>
                    <th className="text-right py-2">案件数</th>
                    <th className="text-right py-2">平均単価</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.sales.monthlySales.map((month) => (
                    <tr key={month.month} className="border-b">
                      <td className="py-2">{month.month}</td>
                      <td className="text-right py-2">¥{month.amount.toLocaleString()}</td>
                      <td className="text-right py-2">{month.deals}</td>
                      <td className="text-right py-2">¥{Math.round(month.amount / month.deals).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">総収益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{reportData?.financial.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">総支出</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{reportData?.financial.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">純利益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{reportData?.financial.netProfit.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">利益率 {reportData?.financial.profitMargin}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">キャッシュフロー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">¥{reportData?.financial.cashFlow.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>月次損益推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-1">
              {reportData?.financial.monthlyFinancials.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="flex flex-col w-full space-y-1">
                    <div 
                      className="w-full bg-blue-500 rounded-t" 
                      style={{ 
                        height: `${(month.revenue / Math.max(...reportData.financial.monthlyFinancials.map(m => m.revenue))) * 120}px` 
                      }}
                    ></div>
                    <div 
                      className="w-full bg-red-400" 
                      style={{ 
                        height: `${(month.expenses / Math.max(...reportData.financial.monthlyFinancials.map(m => m.revenue))) * 120}px` 
                      }}
                    ></div>
                    <div 
                      className="w-full bg-green-500 rounded-b" 
                      style={{ 
                        height: `${(month.profit / Math.max(...reportData.financial.monthlyFinancials.map(m => m.revenue))) * 120}px` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs mt-2">{month.month}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center space-x-4 mt-4 text-xs">
              <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 mr-1"></div>収益</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-red-400 mr-1"></div>支出</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-green-500 mr-1"></div>利益</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>支出構成比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.financial.expensesByCategory.map((expense) => (
                <div key={expense.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">{expense.category}</span>
                    <span className="text-sm font-medium">{expense.percentage}%</span>
                  </div>
                  <Progress value={expense.percentage} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    ¥{expense.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>プロジェクト別収益性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">プロジェクト</th>
                  <th className="text-right py-2">売上</th>
                  <th className="text-right py-2">コスト</th>
                  <th className="text-right py-2">利益</th>
                  <th className="text-right py-2">利益率</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.financial.profitByProject.map((project) => (
                  <tr key={project.project} className="border-b">
                    <td className="py-2">{project.project}</td>
                    <td className="text-right py-2">¥{project.revenue.toLocaleString()}</td>
                    <td className="text-right py-2">¥{project.cost.toLocaleString()}</td>
                    <td className="text-right py-2 font-medium text-green-600">¥{project.profit.toLocaleString()}</td>
                    <td className="text-right py-2">{Math.round(project.profit / project.revenue * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderOperationsReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">稼働率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.operations.utilization}%</div>
            <Progress value={reportData?.operations.utilization || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">生産性</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData?.operations.productivity}%</div>
            <p className="text-xs text-gray-500 mt-1">目標 90%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">顧客満足度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{reportData?.operations.customerSatisfaction}</div>
            <p className="text-xs text-gray-500 mt-1">5点満点</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">従業員数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.operations.totalEmployees}</div>
            <p className="text-xs text-gray-500 mt-1">前月 +2名</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>リソース稼働状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.operations.resourceUtilization.map((resource) => (
                <div key={resource.resource}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{resource.resource}</span>
                    <span className="text-sm text-gray-600">{resource.usage}%</span>
                  </div>
                  <Progress value={(resource.usage / resource.capacity) * 100} className="h-3" />
                  <div className="text-xs text-gray-500 mt-1">
                    {resource.usage} / {resource.capacity}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>品質指標</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData?.operations.qualityMetrics.map((metric) => (
                <div key={metric.metric}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{metric.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{metric.score}</span>
                      <span className="text-xs text-gray-500">/ {metric.target}</span>
                    </div>
                  </div>
                  <Progress 
                    value={(metric.score / metric.target) * 100} 
                    className={`h-3 ${metric.score >= metric.target ? 'text-green-600' : 'text-orange-600'}`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">レポートを生成中...</p>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-gray-900">レポート・分析</h1>
            </div>
            <div className="flex space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={() => handleExport(exportFormat)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📊 エクスポート
              </button>
              <button
                onClick={() => router.push('/reports/custom')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                カスタムレポート
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              {[
                { id: 'overview', label: '概要' },
                { id: 'sales', label: '売上' },
                { id: 'financial', label: '財務' },
                { id: 'operations', label: '運営' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedReport === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="week">今週</option>
              <option value="month">今月</option>
              <option value="quarter">今四半期</option>
              <option value="year">今年</option>
              <option value="custom">カスタム期間</option>
            </select>
            
            {selectedPeriod === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <span>〜</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
            )}
            
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              🔄 更新
            </button>
          </div>
        </div>

        {/* レポート内容 */}
        {selectedReport === 'overview' && renderOverviewReport()}
        {selectedReport === 'sales' && renderSalesReport()}
        {selectedReport === 'financial' && renderFinancialReport()}
        {selectedReport === 'operations' && renderOperationsReport()}
      </main>
    </div>
  )
}