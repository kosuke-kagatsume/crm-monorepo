'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AccountingEntry {
  id: string
  entryNo: string
  date: string
  description: string
  category: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity'
  subCategory: string
  debitAccount: string
  creditAccount: string
  debitAmount: number
  creditAmount: number
  taxRate?: number
  taxAmount?: number
  projectId?: string
  customerId?: string
  invoiceId?: string
  receiptUrl?: string
  notes: string
  status: 'draft' | 'approved' | 'posted' | 'cancelled'
  approvedBy?: string
  approvedAt?: string
  createdBy: string
  createdAt: string
  lastModified: string
}

interface AccountBalance {
  accountCode: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  balance: number
  previousBalance: number
  movements: AccountMovement[]
}

interface AccountMovement {
  date: string
  description: string
  debitAmount: number
  creditAmount: number
  balance: number
  entryId: string
}

interface TaxSummary {
  period: string
  salesTax: number
  purchaseTax: number
  netTax: number
  status: 'calculating' | 'ready' | 'submitted' | 'paid'
  dueDate: string
}

interface FinancialStatement {
  type: 'balance-sheet' | 'income-statement' | 'cash-flow'
  period: string
  data: {
    assets?: AccountBalance[]
    liabilities?: AccountBalance[]
    equity?: AccountBalance[]
    revenue?: AccountBalance[]
    expenses?: AccountBalance[]
    netIncome?: number
    totalAssets?: number
    totalLiabilities?: number
    totalEquity?: number
  }
}

export default function AccountingPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [taxSummary, setTaxSummary] = useState<TaxSummary[]>([])
  const [statements, setStatements] = useState<FinancialStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'entries' | 'accounts' | 'statements' | 'tax'>('entries')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [selectedEntry, setSelectedEntry] = useState<AccountingEntry | null>(null)
  const [showEntryModal, setShowEntryModal] = useState(false)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchAccountingData()
  }, [router])

  const fetchAccountingData = async () => {
    setLoading(true)
    
    // モックデータ - 会計仕訳
    const mockEntries: AccountingEntry[] = [
      {
        id: 'ACC-001',
        entryNo: 'JE-2024-001',
        date: '2024-08-15',
        description: '田中様邸 外壁塗装工事 売上計上',
        category: 'revenue',
        subCategory: '工事売上',
        debitAccount: '売掛金',
        creditAccount: '売上高',
        debitAmount: 2750000,
        creditAmount: 2750000,
        taxRate: 10,
        taxAmount: 250000,
        projectId: 'PRJ-001',
        customerId: 'CUS-001',
        invoiceId: 'INV-001',
        notes: '外壁塗装工事完成による売上計上',
        status: 'posted',
        approvedBy: '経理部長',
        approvedAt: '2024-08-15',
        createdBy: '経理担当',
        createdAt: '2024-08-15',
        lastModified: '2024-08-15'
      },
      {
        id: 'ACC-002',
        entryNo: 'JE-2024-002',
        date: '2024-08-16',
        description: 'シリコン塗料購入',
        category: 'expense',
        subCategory: '材料費',
        debitAccount: '材料費',
        creditAccount: '買掛金',
        debitAmount: 360000,
        creditAmount: 360000,
        taxRate: 10,
        taxAmount: 32727,
        notes: '田中様邸工事用塗料購入',
        status: 'posted',
        approvedBy: '経理部長',
        approvedAt: '2024-08-16',
        createdBy: '経理担当',
        createdAt: '2024-08-16',
        lastModified: '2024-08-16'
      },
      {
        id: 'ACC-003',
        entryNo: 'JE-2024-003',
        date: '2024-08-17',
        description: '従業員給与支払い',
        category: 'expense',
        subCategory: '人件費',
        debitAccount: '給与手当',
        creditAccount: '普通預金',
        debitAmount: 2400000,
        creditAmount: 2400000,
        notes: '8月分給与支払い',
        status: 'posted',
        approvedBy: '経理部長',
        approvedAt: '2024-08-17',
        createdBy: '経理担当',
        createdAt: '2024-08-17',
        lastModified: '2024-08-17'
      },
      {
        id: 'ACC-004',
        entryNo: 'JE-2024-004',
        date: '2024-08-18',
        description: '事務所家賃支払い',
        category: 'expense',
        subCategory: '管理費',
        debitAccount: '地代家賃',
        creditAccount: '普通預金',
        debitAmount: 180000,
        creditAmount: 180000,
        taxRate: 10,
        taxAmount: 16364,
        notes: '8月分事務所家賃',
        status: 'approved',
        approvedBy: '経理部長',
        approvedAt: '2024-08-18',
        createdBy: '経理担当',
        createdAt: '2024-08-18',
        lastModified: '2024-08-18'
      },
      {
        id: 'ACC-005',
        entryNo: 'JE-2024-005',
        date: '2024-08-19',
        description: '山田ビル リフォーム工事 前受金',
        category: 'liability',
        subCategory: '前受金',
        debitAccount: '普通預金',
        creditAccount: '前受金',
        debitAmount: 2550000,
        creditAmount: 2550000,
        projectId: 'PRJ-002',
        customerId: 'CUS-002',
        notes: 'リフォーム工事着手金受領',
        status: 'draft',
        createdBy: '経理担当',
        createdAt: '2024-08-19',
        lastModified: '2024-08-19'
      }
    ]

    // モックデータ - 勘定残高
    const mockAccounts: AccountBalance[] = [
      {
        accountCode: '1110',
        accountName: '普通預金',
        accountType: 'asset',
        balance: 12850000,
        previousBalance: 10300000,
        movements: [
          { date: '2024-08-01', description: '期首残高', debitAmount: 10300000, creditAmount: 0, balance: 10300000, entryId: '' },
          { date: '2024-08-17', description: '給与支払い', debitAmount: 0, creditAmount: 2400000, balance: 7900000, entryId: 'ACC-003' },
          { date: '2024-08-18', description: '家賃支払い', debitAmount: 0, creditAmount: 180000, balance: 7720000, entryId: 'ACC-004' },
          { date: '2024-08-19', description: '前受金受領', debitAmount: 2550000, creditAmount: 0, balance: 10270000, entryId: 'ACC-005' }
        ]
      },
      {
        accountCode: '1210',
        accountName: '売掛金',
        accountType: 'asset',
        balance: 8950000,
        previousBalance: 6200000,
        movements: [
          { date: '2024-08-01', description: '期首残高', debitAmount: 6200000, creditAmount: 0, balance: 6200000, entryId: '' },
          { date: '2024-08-15', description: '売上計上', debitAmount: 2750000, creditAmount: 0, balance: 8950000, entryId: 'ACC-001' }
        ]
      },
      {
        accountCode: '2110',
        accountName: '買掛金',
        accountType: 'liability',
        balance: 1840000,
        previousBalance: 1480000,
        movements: [
          { date: '2024-08-01', description: '期首残高', debitAmount: 0, creditAmount: 1480000, balance: 1480000, entryId: '' },
          { date: '2024-08-16', description: '材料購入', debitAmount: 0, creditAmount: 360000, balance: 1840000, entryId: 'ACC-002' }
        ]
      },
      {
        accountCode: '2150',
        accountName: '前受金',
        accountType: 'liability',
        balance: 2550000,
        previousBalance: 0,
        movements: [
          { date: '2024-08-19', description: '工事前受金', debitAmount: 0, creditAmount: 2550000, balance: 2550000, entryId: 'ACC-005' }
        ]
      },
      {
        accountCode: '4110',
        accountName: '売上高',
        accountType: 'revenue',
        balance: 2750000,
        previousBalance: 0,
        movements: [
          { date: '2024-08-15', description: '工事売上', debitAmount: 0, creditAmount: 2750000, balance: 2750000, entryId: 'ACC-001' }
        ]
      },
      {
        accountCode: '5110',
        accountName: '材料費',
        accountType: 'expense',
        balance: 360000,
        previousBalance: 0,
        movements: [
          { date: '2024-08-16', description: '塗料購入', debitAmount: 360000, creditAmount: 0, balance: 360000, entryId: 'ACC-002' }
        ]
      },
      {
        accountCode: '5210',
        accountName: '給与手当',
        accountType: 'expense',
        balance: 2400000,
        previousBalance: 0,
        movements: [
          { date: '2024-08-17', description: '月次給与', debitAmount: 2400000, creditAmount: 0, balance: 2400000, entryId: 'ACC-003' }
        ]
      }
    ]

    // モックデータ - 税務サマリー
    const mockTaxSummary: TaxSummary[] = [
      {
        period: '2024年8月',
        salesTax: 250000,
        purchaseTax: 49091,
        netTax: 200909,
        status: 'calculating',
        dueDate: '2024-09-10'
      },
      {
        period: '2024年7月',
        salesTax: 890000,
        purchaseTax: 156000,
        netTax: 734000,
        status: 'submitted',
        dueDate: '2024-08-10'
      }
    ]

    // モックデータ - 財務諸表
    const mockStatements: FinancialStatement[] = [
      {
        type: 'income-statement',
        period: '2024年8月',
        data: {
          revenue: accounts.filter(a => a.accountType === 'revenue'),
          expenses: accounts.filter(a => a.accountType === 'expense'),
          netIncome: 2750000 - 2760000
        }
      },
      {
        type: 'balance-sheet',
        period: '2024年8月31日',
        data: {
          assets: accounts.filter(a => a.accountType === 'asset'),
          liabilities: accounts.filter(a => a.accountType === 'liability'),
          equity: accounts.filter(a => a.accountType === 'equity'),
          totalAssets: 21800000,
          totalLiabilities: 4390000,
          totalEquity: 17410000
        }
      }
    ]

    setEntries(mockEntries)
    setAccounts(mockAccounts)
    setTaxSummary(mockTaxSummary)
    setStatements(mockStatements)
    setLoading(false)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return '💰'
      case 'expense': return '💸'
      case 'asset': return '🏦'
      case 'liability': return '📋'
      case 'equity': return '📊'
      default: return '📝'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'revenue': return '売上'
      case 'expense': return '費用'
      case 'asset': return '資産'
      case 'liability': return '負債'
      case 'equity': return '純資産'
      default: return category
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'approved': return 'bg-yellow-100 text-yellow-800'
      case 'posted': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '下書き'
      case 'approved': return '承認済み'
      case 'posted': return '転記済み'
      case 'cancelled': return 'キャンセル'
      default: return status
    }
  }

  const getTaxStatusColor = (status: string) => {
    switch (status) {
      case 'calculating': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaxStatusText = (status: string) => {
    switch (status) {
      case 'calculating': return '計算中'
      case 'ready': return '申告準備完了'
      case 'submitted': return '申告済み'
      case 'paid': return '納付済み'
      default: return status
    }
  }

  const filteredEntries = entries
    .filter(entry => {
      if (searchTerm && !entry.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !entry.entryNo.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterCategory !== 'all' && entry.category !== filterCategory) return false
      if (filterStatus !== 'all' && entry.status !== filterStatus) return false
      if (dateRange.start && entry.date < dateRange.start) return false
      if (dateRange.end && entry.date > dateRange.end) return false
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalRevenue = accounts.filter(a => a.accountType === 'revenue').reduce((sum, a) => sum + a.balance, 0)
  const totalExpenses = accounts.filter(a => a.accountType === 'expense').reduce((sum, a) => sum + a.balance, 0)
  const totalAssets = accounts.filter(a => a.accountType === 'asset').reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.accountType === 'liability').reduce((sum, a) => sum + a.balance, 0)
  const netIncome = totalRevenue - totalExpenses

  const handleEntryClick = (entry: AccountingEntry) => {
    setSelectedEntry(entry)
    setShowEntryModal(true)
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
              <h1 className="text-2xl font-bold text-gray-900">帳簿・会計</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/accounting/import')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📥 データ取込
              </button>
              <button
                onClick={() => router.push('/accounting/export')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📤 エクスポート
              </button>
              <button
                onClick={() => router.push('/accounting/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規仕訳
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
              <CardTitle className="text-sm font-medium text-gray-600">今月売上</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">¥{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">前月比 +22%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今月費用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">¥{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">前月比 +8%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">当期純利益</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{netIncome.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">利益率 {totalRevenue > 0 ? Math.round((netIncome / totalRevenue) * 100) : 0}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総資産</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">¥{totalAssets.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">負債: ¥{totalLiabilities.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">消費税</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-orange-600">
                ¥{taxSummary[0]?.netTax.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">今月納税予定</p>
            </CardContent>
          </Card>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'entries', label: '仕訳帳', icon: '📝' },
                { id: 'accounts', label: '勘定科目', icon: '📊' },
                { id: 'statements', label: '財務諸表', icon: '📋' },
                { id: 'tax', label: '税務', icon: '🧾' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* フィルターバー（仕訳帳タブ用） */}
          {selectedTab === 'entries' && (
            <div className="p-4 border-b">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="摘要・仕訳番号で検索..."
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
                  <option value="revenue">売上</option>
                  <option value="expense">費用</option>
                  <option value="asset">資産</option>
                  <option value="liability">負債</option>
                  <option value="equity">純資産</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべてのステータス</option>
                  <option value="draft">下書き</option>
                  <option value="approved">承認済み</option>
                  <option value="posted">転記済み</option>
                  <option value="cancelled">キャンセル</option>
                </select>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>〜</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* タブコンテンツ */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : selectedTab === 'entries' ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    摘要
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    借方
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    貸方
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
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
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{getCategoryIcon(entry.category)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entry.description}</div>
                          <div className="text-xs text-gray-500">{entry.entryNo}</div>
                          {entry.notes && (
                            <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.debitAccount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.creditAccount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{entry.debitAmount.toLocaleString()}
                      </div>
                      {entry.taxAmount && (
                        <div className="text-xs text-gray-500">
                          税額: ¥{entry.taxAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(entry.status)}>
                        {getStatusText(entry.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEntryClick(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/accounting/${entry.id}/edit`)}
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
        ) : selectedTab === 'accounts' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => (
              <Card key={type}>
                <CardHeader>
                  <CardTitle>{getCategoryText(type)}科目</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accounts.filter(account => account.accountType === type).map((account) => (
                      <div key={account.accountCode} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <div className="font-medium">{account.accountName}</div>
                          <div className="text-sm text-gray-600">コード: {account.accountCode}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ¥{Math.abs(account.balance).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            前期: ¥{Math.abs(account.previousBalance).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedTab === 'statements' ? (
          <div className="space-y-6">
            {/* 損益計算書 */}
            <Card>
              <CardHeader>
                <CardTitle>損益計算書 - 2024年8月</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">売上</h4>
                    <div className="space-y-2">
                      {accounts.filter(a => a.accountType === 'revenue').map((account) => (
                        <div key={account.accountCode} className="flex justify-between">
                          <span>{account.accountName}</span>
                          <span>¥{account.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 font-semibold flex justify-between">
                        <span>売上合計</span>
                        <span>¥{totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">費用</h4>
                    <div className="space-y-2">
                      {accounts.filter(a => a.accountType === 'expense').map((account) => (
                        <div key={account.accountCode} className="flex justify-between">
                          <span>{account.accountName}</span>
                          <span>¥{account.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 font-semibold flex justify-between">
                        <span>費用合計</span>
                        <span>¥{totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <div className={`text-xl font-bold flex justify-between ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>当期純利益</span>
                    <span>¥{netIncome.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 貸借対照表 */}
            <Card>
              <CardHeader>
                <CardTitle>貸借対照表 - 2024年8月31日</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-blue-600">資産</h4>
                    <div className="space-y-2">
                      {accounts.filter(a => a.accountType === 'asset').map((account) => (
                        <div key={account.accountCode} className="flex justify-between">
                          <span>{account.accountName}</span>
                          <span>¥{account.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 font-semibold flex justify-between">
                        <span>資産合計</span>
                        <span>¥{totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-purple-600">負債・純資産</h4>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">負債</div>
                      {accounts.filter(a => a.accountType === 'liability').map((account) => (
                        <div key={account.accountCode} className="flex justify-between pl-4">
                          <span>{account.accountName}</span>
                          <span>¥{account.balance.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 pl-4 font-medium flex justify-between">
                        <span>負債合計</span>
                        <span>¥{totalLiabilities.toLocaleString()}</span>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-700 mb-2 mt-4">純資産</div>
                      <div className="flex justify-between pl-4">
                        <span>資本金</span>
                        <span>¥{(totalAssets - totalLiabilities).toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 font-semibold flex justify-between">
                        <span>負債・純資産合計</span>
                        <span>¥{totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 消費税サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxSummary.map((tax, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>消費税 - {tax.period}</CardTitle>
                      <Badge className={getTaxStatusColor(tax.status)}>
                        {getTaxStatusText(tax.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">売上に係る消費税</span>
                      <span className="font-medium">¥{tax.salesTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">仕入に係る消費税</span>
                      <span className="font-medium">¥{tax.purchaseTax.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>納付税額</span>
                        <span className="text-orange-600">¥{tax.netTax.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        納付期限: {new Date(tax.dueDate).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 税務申告アクション */}
            <Card>
              <CardHeader>
                <CardTitle>税務申告</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-lg font-semibold">📋 消費税申告書作成</div>
                    <div className="text-sm text-gray-600 mt-1">消費税申告書を自動生成</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-lg font-semibold">📊 決算書作成</div>
                    <div className="text-sm text-gray-600 mt-1">貸借対照表・損益計算書</div>
                  </button>
                  <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-lg font-semibold">📤 税務署データ送信</div>
                    <div className="text-sm text-gray-600 mt-1">e-Taxデータ出力</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* 仕訳詳細モーダル */}
      {showEntryModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">仕訳詳細</h2>
                <p className="text-gray-600">{selectedEntry.entryNo}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedEntry.status)}>
                  {getStatusText(selectedEntry.status)}
                </Badge>
                <button
                  onClick={() => setShowEntryModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">日付:</span>
                  <div className="font-medium">{new Date(selectedEntry.date).toLocaleDateString('ja-JP')}</div>
                </div>
                <div>
                  <span className="text-gray-600">カテゴリ:</span>
                  <div className="font-medium">{getCategoryText(selectedEntry.category)}</div>
                </div>
                <div>
                  <span className="text-gray-600">作成者:</span>
                  <div className="font-medium">{selectedEntry.createdBy}</div>
                </div>
                <div>
                  <span className="text-gray-600">承認者:</span>
                  <div className="font-medium">{selectedEntry.approvedBy || '未承認'}</div>
                </div>
              </div>

              <div>
                <span className="text-gray-600">摘要:</span>
                <p className="mt-1 font-medium">{selectedEntry.description}</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">勘定科目</th>
                      <th className="px-4 py-2 text-right">借方</th>
                      <th className="px-4 py-2 text-right">貸方</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2">{selectedEntry.debitAccount}</td>
                      <td className="px-4 py-2 text-right font-medium">¥{selectedEntry.debitAmount.toLocaleString()}</td>
                      <td className="px-4 py-2"></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">{selectedEntry.creditAccount}</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right font-medium">¥{selectedEntry.creditAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {selectedEntry.taxAmount && (
                <div className="p-3 bg-yellow-50 rounded">
                  <div className="flex justify-between">
                    <span>消費税額:</span>
                    <span className="font-medium">¥{selectedEntry.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>税率:</span>
                    <span>{selectedEntry.taxRate}%</span>
                  </div>
                </div>
              )}

              {selectedEntry.notes && (
                <div>
                  <span className="text-gray-600">備考:</span>
                  <p className="mt-1">{selectedEntry.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => router.push(`/accounting/${selectedEntry.id}/edit`)}
                variant="outline"
              >
                編集
              </Button>
              <Button onClick={() => setShowEntryModal(false)}>
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}