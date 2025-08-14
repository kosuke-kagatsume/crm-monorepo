'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Contract {
  id: string
  contractNo: string
  title: string
  customerName: string
  customerId: string
  projectId?: string
  type: 'construction' | 'maintenance' | 'consulting' | 'supply' | 'other'
  status: 'draft' | 'pending-review' | 'pending-signature' | 'active' | 'completed' | 'terminated' | 'expired'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  contractValue: number
  currency: string
  startDate: string
  endDate: string
  signedDate?: string
  description: string
  terms: ContractTerm[]
  milestones: ContractMilestone[]
  payments: PaymentSchedule[]
  documents: ContractDocument[]
  assignedTo: string
  createdBy: string
  createdAt: string
  lastModified: string
  renewalOptions?: {
    autoRenewal: boolean
    renewalPeriod: number
    noticePeriod: number
  }
  penalties?: {
    lateDelivery: number
    qualityIssues: number
    terminationFee: number
  }
  tags: string[]
  notes: string[]
}

interface ContractTerm {
  id: string
  category: string
  title: string
  description: string
  mandatory: boolean
  completed: boolean
}

interface ContractMilestone {
  id: string
  title: string
  description: string
  dueDate: string
  amount: number
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  completedDate?: string
}

interface PaymentSchedule {
  id: string
  description: string
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: string
  paidAmount?: number
}

interface ContractDocument {
  id: string
  name: string
  type: 'contract' | 'amendment' | 'attachment' | 'specification' | 'other'
  url: string
  uploadedAt: string
  uploadedBy: string
  size: number
  version: string
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline'>('list')
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [showContractModal, setShowContractModal] = useState(false)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchContracts()
  }, [router])

  const fetchContracts = async () => {
    setLoading(true)
    // モックデータ
    const mockContracts: Contract[] = [
      {
        id: 'CTR-001',
        contractNo: 'CTR-2024-001',
        title: '田中様邸 外壁塗装工事契約',
        customerName: '田中太郎',
        customerId: 'CUS-001',
        projectId: 'PRJ-001',
        type: 'construction',
        status: 'active',
        priority: 'medium',
        contractValue: 2500000,
        currency: 'JPY',
        startDate: '2024-08-01',
        endDate: '2024-08-31',
        signedDate: '2024-07-28',
        description: '外壁の全面塗装工事。シリコン塗料使用、3年保証付き。',
        terms: [
          { id: '1', category: '品質', title: '3年保証', description: '塗装後3年間の品質保証を提供', mandatory: true, completed: false },
          { id: '2', category: '支払い', title: '分割払い', description: '着手金50%、完了時50%の2回払い', mandatory: true, completed: true },
          { id: '3', category: '工期', title: '30日以内完成', description: '契約日から30日以内の完成', mandatory: true, completed: false }
        ],
        milestones: [
          { id: '1', title: '着手金受領', description: '契約金額の50%', dueDate: '2024-08-01', amount: 1250000, status: 'completed', completedDate: '2024-08-01' },
          { id: '2', title: '下地処理完了', description: '外壁の洗浄・補修完了', dueDate: '2024-08-10', amount: 0, status: 'completed', completedDate: '2024-08-09' },
          { id: '3', title: '塗装完了', description: '全工程完了・最終検査', dueDate: '2024-08-31', amount: 1250000, status: 'in-progress' }
        ],
        payments: [
          { id: '1', description: '着手金', amount: 1250000, dueDate: '2024-08-01', status: 'paid', paidDate: '2024-08-01', paidAmount: 1250000 },
          { id: '2', description: '完成時支払い', amount: 1250000, dueDate: '2024-08-31', status: 'pending' }
        ],
        documents: [
          { id: '1', name: '工事契約書.pdf', type: 'contract', url: '/docs/ctr-001.pdf', uploadedAt: '2024-07-28', uploadedBy: '山田次郎', size: 2048000, version: '1.0' },
          { id: '2', name: '設計図面.pdf', type: 'specification', url: '/docs/ctr-001-spec.pdf', uploadedAt: '2024-07-28', uploadedBy: '山田次郎', size: 5120000, version: '1.0' }
        ],
        assignedTo: '山田次郎',
        createdBy: '山田次郎',
        createdAt: '2024-07-25',
        lastModified: '2024-08-10',
        tags: ['外壁塗装', '住宅', '個人'],
        notes: ['顧客は品質重視', '近隣への配慮必要']
      },
      {
        id: 'CTR-002',
        contractNo: 'CTR-2024-002',
        title: '山田ビル リフォーム工事契約',
        customerName: '山田商事株式会社',
        customerId: 'CUS-002',
        projectId: 'PRJ-002',
        type: 'construction',
        status: 'pending-signature',
        priority: 'high',
        contractValue: 8500000,
        currency: 'JPY',
        startDate: '2024-09-01',
        endDate: '2024-10-31',
        description: 'オフィスビル3階の全面リフォーム工事。内装・電気・空調工事を含む。',
        terms: [
          { id: '1', category: '品質', title: '2年保証', description: 'リフォーム後2年間の品質保証', mandatory: true, completed: false },
          { id: '2', category: '支払い', title: '3回分割', description: '着手金30%、中間40%、完了時30%', mandatory: true, completed: false },
          { id: '3', category: '工期', title: '60日以内完成', description: '契約日から60日以内の完成', mandatory: true, completed: false }
        ],
        milestones: [
          { id: '1', title: '着手金受領', description: '契約金額の30%', dueDate: '2024-09-01', amount: 2550000, status: 'pending' },
          { id: '2', title: '解体工事完了', description: '既存内装の解体完了', dueDate: '2024-09-15', amount: 0, status: 'pending' },
          { id: '3', title: '電気・配管工事完了', description: 'インフラ工事完了', dueDate: '2024-10-01', amount: 3400000, status: 'pending' },
          { id: '4', title: '内装工事完了', description: '全工程完了・引渡し', dueDate: '2024-10-31', amount: 2550000, status: 'pending' }
        ],
        payments: [
          { id: '1', description: '着手金', amount: 2550000, dueDate: '2024-09-01', status: 'pending' },
          { id: '2', description: '中間金', amount: 3400000, dueDate: '2024-10-01', status: 'pending' },
          { id: '3', description: '完成時支払い', amount: 2550000, dueDate: '2024-10-31', status: 'pending' }
        ],
        documents: [
          { id: '1', name: 'リフォーム契約書_draft.pdf', type: 'contract', url: '/docs/ctr-002-draft.pdf', uploadedAt: '2024-08-12', uploadedBy: '佐藤花子', size: 3072000, version: '1.2' },
          { id: '2', name: '設計図面_v2.pdf', type: 'specification', url: '/docs/ctr-002-spec-v2.pdf', uploadedAt: '2024-08-13', uploadedBy: '佐藤花子', size: 7680000, version: '2.0' }
        ],
        assignedTo: '佐藤花子',
        createdBy: '佐藤花子',
        createdAt: '2024-08-10',
        lastModified: '2024-08-13',
        renewalOptions: {
          autoRenewal: false,
          renewalPeriod: 0,
          noticePeriod: 30
        },
        penalties: {
          lateDelivery: 50000,
          qualityIssues: 100000,
          terminationFee: 500000
        },
        tags: ['リフォーム', 'オフィス', '法人'],
        notes: ['大型案件', '品質管理重要', '工期厳守']
      },
      {
        id: 'CTR-003',
        contractNo: 'CTR-2024-003',
        title: '新築住宅A 建設工事契約',
        customerName: '高橋建設',
        customerId: 'CUS-003',
        projectId: 'PRJ-004',
        type: 'construction',
        status: 'active',
        priority: 'urgent',
        contractValue: 35000000,
        currency: 'JPY',
        startDate: '2024-06-01',
        endDate: '2024-12-31',
        signedDate: '2024-05-28',
        description: '2階建て住宅の新築工事。基礎から完成まで全工程を担当。',
        terms: [
          { id: '1', category: '品質', title: '10年保証', description: '構造部分10年保証', mandatory: true, completed: false },
          { id: '2', category: '支払い', title: '6回分割', description: '工程に応じた6回分割払い', mandatory: true, completed: true },
          { id: '3', category: '工期', title: '7ヶ月以内完成', description: '契約日から7ヶ月以内の完成', mandatory: true, completed: false }
        ],
        milestones: [
          { id: '1', title: '基礎工事完了', description: '基礎コンクリート打設完了', dueDate: '2024-07-31', amount: 7000000, status: 'completed', completedDate: '2024-07-29' },
          { id: '2', title: '上棟式', description: '棟上げ完了', dueDate: '2024-09-30', amount: 10500000, status: 'completed', completedDate: '2024-09-25' },
          { id: '3', title: '内装工事完了', description: '内装・設備工事完了', dueDate: '2024-11-30', amount: 10500000, status: 'in-progress' },
          { id: '4', title: '完成・引渡し', description: '最終検査・鍵渡し', dueDate: '2024-12-31', amount: 7000000, status: 'pending' }
        ],
        payments: [
          { id: '1', description: '着手金', amount: 7000000, dueDate: '2024-06-01', status: 'paid', paidDate: '2024-06-01', paidAmount: 7000000 },
          { id: '2', description: '基礎完了時', amount: 7000000, dueDate: '2024-07-31', status: 'paid', paidDate: '2024-07-31', paidAmount: 7000000 },
          { id: '3', description: '上棟時', amount: 7000000, dueDate: '2024-09-30', status: 'paid', paidDate: '2024-09-30', paidAmount: 7000000 },
          { id: '4', description: '内装完了時', amount: 7000000, dueDate: '2024-11-30', status: 'pending' },
          { id: '5', description: '完成時', amount: 7000000, dueDate: '2024-12-31', status: 'pending' }
        ],
        documents: [
          { id: '1', name: '建設工事請負契約書.pdf', type: 'contract', url: '/docs/ctr-003.pdf', uploadedAt: '2024-05-28', uploadedBy: '渡辺健二', size: 4096000, version: '1.0' },
          { id: '2', name: '設計図面一式.pdf', type: 'specification', url: '/docs/ctr-003-drawings.pdf', uploadedAt: '2024-05-28', uploadedBy: '渡辺健二', size: 15360000, version: '1.0' },
          { id: '3', name: '仕様書.pdf', type: 'specification', url: '/docs/ctr-003-spec.pdf', uploadedAt: '2024-05-28', uploadedBy: '渡辺健二', size: 2048000, version: '1.0' }
        ],
        assignedTo: '渡辺健二',
        createdBy: '渡辺健二',
        createdAt: '2024-05-20',
        lastModified: '2024-08-14',
        penalties: {
          lateDelivery: 100000,
          qualityIssues: 200000,
          terminationFee: 1000000
        },
        tags: ['新築', '住宅', '大型案件'],
        notes: ['最重要案件', '品質・工期ともに要注意']
      },
      {
        id: 'CTR-004',
        contractNo: 'CTR-2024-004',
        title: '年間メンテナンス契約',
        customerName: 'グリーンパークマンション管理組合',
        customerId: 'CUS-004',
        type: 'maintenance',
        status: 'active',
        priority: 'low',
        contractValue: 1200000,
        currency: 'JPY',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
        signedDate: '2024-03-25',
        description: 'マンション共用部の年間メンテナンス契約。定期点検・軽微な修理を含む。',
        terms: [
          { id: '1', category: '保守', title: '月1回点検', description: '共用部の月次点検', mandatory: true, completed: false },
          { id: '2', category: '支払い', title: '月額払い', description: '毎月末日支払い', mandatory: true, completed: true },
          { id: '3', category: '対応', title: '緊急時24時間対応', description: '緊急時の24時間対応', mandatory: true, completed: false }
        ],
        milestones: [
          { id: '1', title: '契約開始', description: '年間契約開始', dueDate: '2024-04-01', amount: 0, status: 'completed', completedDate: '2024-04-01' },
          { id: '2', title: '中間評価', description: '半年経過時評価', dueDate: '2024-10-01', amount: 0, status: 'pending' },
          { id: '3', title: '契約更新判定', description: '契約更新の判定', dueDate: '2025-02-01', amount: 0, status: 'pending' }
        ],
        payments: [
          { id: '1', description: '4月分', amount: 100000, dueDate: '2024-04-30', status: 'paid', paidDate: '2024-04-30', paidAmount: 100000 },
          { id: '2', description: '5月分', amount: 100000, dueDate: '2024-05-31', status: 'paid', paidDate: '2024-05-31', paidAmount: 100000 },
          { id: '3', description: '6月分', amount: 100000, dueDate: '2024-06-30', status: 'paid', paidDate: '2024-06-30', paidAmount: 100000 },
          { id: '4', description: '7月分', amount: 100000, dueDate: '2024-07-31', status: 'paid', paidDate: '2024-07-31', paidAmount: 100000 },
          { id: '5', description: '8月分', amount: 100000, dueDate: '2024-08-31', status: 'pending' }
        ],
        documents: [
          { id: '1', name: 'メンテナンス契約書.pdf', type: 'contract', url: '/docs/ctr-004.pdf', uploadedAt: '2024-03-25', uploadedBy: '小林美咲', size: 1536000, version: '1.0' }
        ],
        assignedTo: '小林美咲',
        createdBy: '小林美咲',
        createdAt: '2024-03-20',
        lastModified: '2024-08-01',
        renewalOptions: {
          autoRenewal: true,
          renewalPeriod: 12,
          noticePeriod: 60
        },
        tags: ['メンテナンス', 'マンション', '継続契約'],
        notes: ['安定収入源', '更新可能性高い']
      }
    ]
    setContracts(mockContracts)
    setLoading(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'construction': return '🏗️'
      case 'maintenance': return '🔧'
      case 'consulting': return '💼'
      case 'supply': return '📦'
      case 'other': return '📄'
      default: return '📄'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'construction': return '建設工事'
      case 'maintenance': return 'メンテナンス'
      case 'consulting': return 'コンサルティング'
      case 'supply': return '供給契約'
      case 'other': return 'その他'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'pending-review': return 'bg-yellow-100 text-yellow-800'
      case 'pending-signature': return 'bg-orange-100 text-orange-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'terminated': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '下書き'
      case 'pending-review': return 'レビュー待ち'
      case 'pending-signature': return '署名待ち'
      case 'active': return '有効'
      case 'completed': return '完了'
      case 'terminated': return '終了'
      case 'expired': return '期限切れ'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '緊急'
      case 'high': return '高'
      case 'medium': return '中'
      case 'low': return '低'
      default: return priority
    }
  }

  const getProgressPercentage = (contract: Contract) => {
    const completedMilestones = contract.milestones.filter(m => m.status === 'completed').length
    return contract.milestones.length > 0 ? (completedMilestones / contract.milestones.length) * 100 : 0
  }

  const getPaymentStatus = (contract: Contract) => {
    const totalAmount = contract.payments.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = contract.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount || 0), 0)
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  }

  const filteredContracts = contracts
    .filter(contract => {
      if (searchTerm && !contract.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !contract.contractNo.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterType !== 'all' && contract.type !== filterType) return false
      if (filterStatus !== 'all' && contract.status !== filterStatus) return false
      if (filterAssignee !== 'all' && contract.assignedTo !== filterAssignee) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        case 'value': return b.contractValue - a.contractValue
        case 'deadline': return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        default: return 0
      }
    })

  const activeContracts = contracts.filter(c => c.status === 'active')
  const pendingContracts = contracts.filter(c => c.status === 'pending-signature' || c.status === 'pending-review')
  const totalValue = contracts.reduce((sum, c) => sum + c.contractValue, 0)
  const completedValue = contracts.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.contractValue, 0)

  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract)
    setShowContractModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
              <h1 className="text-2xl font-bold text-gray-900">契約管理</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/contracts/templates')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📋 テンプレート
              </button>
              <button
                onClick={() => router.push('/contracts/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規契約
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
              <CardTitle className="text-sm font-medium text-gray-600">総契約数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
              <p className="text-xs text-gray-500 mt-1">アクティブ: {activeContracts.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">総契約額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">¥{totalValue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">完了: ¥{completedValue.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">署名待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingContracts.length}</div>
              <p className="text-xs text-gray-500 mt-1">要対応</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今月期限</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">2</div>
              <p className="text-xs text-gray-500 mt-1">要更新確認</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">完了率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((contracts.filter(c => c.status === 'completed').length / contracts.length) * 100)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">今年</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-900"
            >
              {showFilters ? '▼' : '▶'} フィルター
            </button>
            <div className="flex items-center space-x-2">
              <div className="flex gap-1">
                {['list', 'grid', 'timeline'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 rounded text-sm ${
                      viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {mode === 'list' ? 'リスト' : mode === 'grid' ? 'カード' : 'タイムライン'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="契約名・顧客名・契約番号で検索..."
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
                <option value="construction">建設工事</option>
                <option value="maintenance">メンテナンス</option>
                <option value="consulting">コンサルティング</option>
                <option value="supply">供給契約</option>
                <option value="other">その他</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべてのステータス</option>
                <option value="draft">下書き</option>
                <option value="pending-review">レビュー待ち</option>
                <option value="pending-signature">署名待ち</option>
                <option value="active">有効</option>
                <option value="completed">完了</option>
                <option value="terminated">終了</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">更新日順</option>
                <option value="value">契約額順</option>
                <option value="deadline">期限順</option>
                <option value="priority">優先度順</option>
              </select>
            </div>
          )}
        </div>

        {/* 契約一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition cursor-pointer" onClick={() => handleContractClick(contract)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTypeIcon(contract.type)}</span>
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">{contract.title}</h3>
                        <p className="text-sm text-gray-600">{contract.contractNo}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusText(contract.status)}
                      </Badge>
                      <Badge className={getPriorityColor(contract.priority)}>
                        {getPriorityText(contract.priority)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">顧客: {contract.customerName}</p>
                    <p className="text-sm text-gray-600">担当: {contract.assignedTo}</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">契約額</span>
                      <span className="font-bold">¥{contract.contractValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">進捗</span>
                      <span className="text-sm font-medium">{Math.round(getProgressPercentage(contract))}%</span>
                    </div>
                    <Progress value={getProgressPercentage(contract)} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">支払い状況</span>
                      <span className="text-sm font-medium">{Math.round(getPaymentStatus(contract))}%</span>
                    </div>
                    <Progress value={getPaymentStatus(contract)} className="h-2" />
                  </div>

                  <div className="text-sm text-gray-600">
                    📅 {new Date(contract.startDate).toLocaleDateString('ja-JP')} 〜 
                    {new Date(contract.endDate).toLocaleDateString('ja-JP')}
                  </div>

                  {contract.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contract.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {contract.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{contract.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">タイムライン表示は準備中です</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    契約
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    契約額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    進捗
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getTypeIcon(contract.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                          <div className="text-xs text-gray-500">{contract.contractNo}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge className={getPriorityColor(contract.priority)}>
                              {getPriorityText(contract.priority)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeText(contract.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{contract.contractValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        支払い: {Math.round(getPaymentStatus(contract))}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(contract.startDate).toLocaleDateString('ja-JP')}</div>
                      <div className="text-xs text-gray-500">
                        〜 {new Date(contract.endDate).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-3">
                          <Progress value={getProgressPercentage(contract)} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600">{Math.round(getProgressPercentage(contract))}%</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {contract.milestones.filter(m => m.status === 'completed').length} / {contract.milestones.length} マイルストーン
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusText(contract.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contract.assignedTo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleContractClick(contract)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/contracts/${contract.id}/edit`)}
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

      {/* 契約詳細モーダル */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedContract.title}</h2>
                <p className="text-gray-600">{selectedContract.contractNo}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedContract.status)}>
                  {getStatusText(selectedContract.status)}
                </Badge>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">顧客:</span>
                      <div className="font-medium">{selectedContract.customerName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">担当者:</span>
                      <div className="font-medium">{selectedContract.assignedTo}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">契約額:</span>
                      <div className="font-medium">¥{selectedContract.contractValue.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">タイプ:</span>
                      <div className="font-medium">{getTypeText(selectedContract.type)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">開始日:</span>
                      <div className="font-medium">{new Date(selectedContract.startDate).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">終了日:</span>
                      <div className="font-medium">{new Date(selectedContract.endDate).toLocaleDateString('ja-JP')}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">説明:</span>
                    <p className="mt-1">{selectedContract.description}</p>
                  </div>
                  {selectedContract.tags.length > 0 && (
                    <div>
                      <span className="text-gray-600">タグ:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedContract.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* マイルストーン */}
              <Card>
                <CardHeader>
                  <CardTitle>マイルストーン</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedContract.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{milestone.title}</div>
                          <div className="text-sm text-gray-600">{milestone.description}</div>
                          <div className="text-xs text-gray-500">期限: {new Date(milestone.dueDate).toLocaleDateString('ja-JP')}</div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status === 'completed' ? '完了' : 
                             milestone.status === 'in-progress' ? '進行中' : 
                             milestone.status === 'overdue' ? '遅延' : '予定'}
                          </Badge>
                          {milestone.amount > 0 && (
                            <div className="text-sm font-medium mt-1">¥{milestone.amount.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 支払いスケジュール */}
              <Card>
                <CardHeader>
                  <CardTitle>支払いスケジュール</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedContract.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{payment.description}</div>
                          <div className="text-xs text-gray-500">期限: {new Date(payment.dueDate).toLocaleDateString('ja-JP')}</div>
                          {payment.paidDate && (
                            <div className="text-xs text-green-600">支払済: {new Date(payment.paidDate).toLocaleDateString('ja-JP')}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">¥{payment.amount.toLocaleString()}</div>
                          <Badge className={
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {payment.status === 'paid' ? '支払済' : 
                             payment.status === 'overdue' ? '遅延' : '未払い'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ドキュメント */}
              <Card>
                <CardHeader>
                  <CardTitle>関連ドキュメント</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedContract.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(doc.size)} • v{doc.version} • {new Date(doc.uploadedAt).toLocaleDateString('ja-JP')}
                            </div>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          ダウンロード
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => router.push(`/contracts/${selectedContract.id}/edit`)}
                variant="outline"
              >
                編集
              </Button>
              <Button onClick={() => setShowContractModal(false)}>
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}