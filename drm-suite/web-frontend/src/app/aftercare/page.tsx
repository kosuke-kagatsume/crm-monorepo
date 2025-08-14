'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface AftercareService {
  id: string
  serviceNo: string
  title: string
  description: string
  customerId: string
  customerName: string
  projectId?: string
  contractId?: string
  serviceType: 'warranty' | 'maintenance' | 'inspection' | 'repair' | 'consultation' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold'
  requestDate: string
  scheduledDate: string
  completedDate?: string
  assignedTo: string[]
  estimatedDuration: number // minutes
  actualDuration?: number
  location: string
  workDetails: WorkDetail[]
  parts: PartUsed[]
  costs: ServiceCost[]
  customerFeedback?: CustomerFeedback
  warrantyInfo?: WarrantyInfo
  followUpRequired: boolean
  followUpDate?: string
  images: ServiceImage[]
  notes: string[]
  createdBy: string
  createdAt: string
  lastModified: string
}

interface WorkDetail {
  id: string
  description: string
  category: string
  startTime?: string
  endTime?: string
  technician: string
  status: 'pending' | 'in-progress' | 'completed'
  notes?: string
}

interface PartUsed {
  id: string
  partName: string
  partCode: string
  quantity: number
  unitPrice: number
  totalPrice: number
  supplier: string
  warrantyPeriod?: number
}

interface ServiceCost {
  id: string
  category: 'labor' | 'parts' | 'transportation' | 'other'
  description: string
  amount: number
  billable: boolean
}

interface CustomerFeedback {
  rating: number
  comment: string
  satisfactionLevel: 'very-satisfied' | 'satisfied' | 'neutral' | 'unsatisfied' | 'very-unsatisfied'
  submittedAt: string
}

interface WarrantyInfo {
  warrantyType: 'material' | 'workmanship' | 'both'
  startDate: string
  endDate: string
  termsAndConditions: string
  coverageDetails: string
}

interface ServiceImage {
  id: string
  url: string
  description: string
  category: 'before' | 'during' | 'after' | 'issue' | 'solution'
  uploadedAt: string
  uploadedBy: string
}

export default function AftercarePage() {
  const router = useRouter()
  const [services, setServices] = useState<AftercareService[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'status'>('list')
  const [selectedService, setSelectedService] = useState<AftercareService | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchServices()
  }, [router])

  const fetchServices = async () => {
    setLoading(true)
    // モックデータ
    const mockServices: AftercareService[] = [
      {
        id: 'AC-001',
        serviceNo: 'AC-2024-001',
        title: '田中様邸 外壁塗装 1年点検',
        description: '外壁塗装工事後の1年定期点検。塗膜状態の確認と軽微な補修。',
        customerId: 'CUS-001',
        customerName: '田中太郎',
        projectId: 'PRJ-001',
        contractId: 'CTR-001',
        serviceType: 'inspection',
        priority: 'medium',
        status: 'completed',
        requestDate: '2024-08-01',
        scheduledDate: '2024-08-15',
        completedDate: '2024-08-15',
        assignedTo: ['山田次郎', '佐藤一郎'],
        estimatedDuration: 120,
        actualDuration: 105,
        location: '東京都渋谷区田中様邸',
        workDetails: [
          {
            id: '1',
            description: '外壁全面の目視検査',
            category: '点検',
            startTime: '09:00',
            endTime: '10:30',
            technician: '山田次郎',
            status: 'completed',
            notes: '北面に軽微なひび割れを発見'
          },
          {
            id: '2',
            description: 'ひび割れ部分の補修',
            category: '補修',
            startTime: '10:30',
            endTime: '11:45',
            technician: '佐藤一郎',
            status: 'completed',
            notes: 'シーリング材で補修完了'
          }
        ],
        parts: [
          {
            id: '1',
            partName: 'シーリング材',
            partCode: 'SEAL-001',
            quantity: 1,
            unitPrice: 800,
            totalPrice: 800,
            supplier: '材料商社A',
            warrantyPeriod: 12
          }
        ],
        costs: [
          {
            id: '1',
            category: 'labor',
            description: '技術者2名 × 1.75時間',
            amount: 8750,
            billable: false
          },
          {
            id: '2',
            category: 'parts',
            description: 'シーリング材',
            amount: 800,
            billable: false
          },
          {
            id: '3',
            category: 'transportation',
            description: '交通費',
            amount: 1000,
            billable: false
          }
        ],
        customerFeedback: {
          rating: 5,
          comment: '迅速な対応で安心しました。今後もお願いしたいです。',
          satisfactionLevel: 'very-satisfied',
          submittedAt: '2024-08-16'
        },
        warrantyInfo: {
          warrantyType: 'workmanship',
          startDate: '2024-08-01',
          endDate: '2025-08-01',
          termsAndConditions: '工事品質に関する1年間の保証',
          coverageDetails: '塗装の剥がれ、色褪せ、施工不良による問題'
        },
        followUpRequired: false,
        images: [
          {
            id: '1',
            url: '/images/aftercare/ac-001-before.jpg',
            description: '点検前の状態',
            category: 'before',
            uploadedAt: '2024-08-15',
            uploadedBy: '山田次郎'
          },
          {
            id: '2',
            url: '/images/aftercare/ac-001-after.jpg',
            description: '補修後の状態',
            category: 'after',
            uploadedAt: '2024-08-15',
            uploadedBy: '佐藤一郎'
          }
        ],
        notes: ['保証期間内の無料点検', '顧客満足度高い'],
        createdBy: '山田次郎',
        createdAt: '2024-08-01',
        lastModified: '2024-08-16'
      },
      {
        id: 'AC-002',
        serviceNo: 'AC-2024-002',
        title: '山田ビル エアコン緊急修理',
        description: '3階オフィスのエアコン故障による緊急修理対応。',
        customerId: 'CUS-002',
        customerName: '山田商事株式会社',
        serviceType: 'emergency',
        priority: 'urgent',
        status: 'in-progress',
        requestDate: '2024-08-14',
        scheduledDate: '2024-08-14',
        assignedTo: ['鈴木太郎'],
        estimatedDuration: 180,
        location: '山田ビル 3階',
        workDetails: [
          {
            id: '1',
            description: '故障診断',
            category: '診断',
            startTime: '14:00',
            endTime: '14:30',
            technician: '鈴木太郎',
            status: 'completed',
            notes: 'コンプレッサーの故障を確認'
          },
          {
            id: '2',
            description: 'コンプレッサー交換',
            category: '修理',
            technician: '鈴木太郎',
            status: 'in-progress',
            notes: '部品調達中'
          }
        ],
        parts: [
          {
            id: '1',
            partName: 'エアコンコンプレッサー',
            partCode: 'AC-COMP-001',
            quantity: 1,
            unitPrice: 85000,
            totalPrice: 85000,
            supplier: '空調機器商社',
            warrantyPeriod: 24
          }
        ],
        costs: [
          {
            id: '1',
            category: 'labor',
            description: '緊急対応費',
            amount: 15000,
            billable: true
          },
          {
            id: '2',
            category: 'parts',
            description: 'コンプレッサー',
            amount: 85000,
            billable: true
          }
        ],
        followUpRequired: true,
        followUpDate: '2024-08-21',
        images: [
          {
            id: '1',
            url: '/images/aftercare/ac-002-issue.jpg',
            description: '故障したコンプレッサー',
            category: 'issue',
            uploadedAt: '2024-08-14',
            uploadedBy: '鈴木太郎'
          }
        ],
        notes: ['緊急対応案件', '顧客業務への影響大'],
        createdBy: '受付センター',
        createdAt: '2024-08-14',
        lastModified: '2024-08-14'
      },
      {
        id: 'AC-003',
        serviceNo: 'AC-2024-003',
        title: '新築住宅A 3ヶ月点検',
        description: '新築工事完了後の3ヶ月定期点検。全体的な状態確認。',
        customerId: 'CUS-003',
        customerName: '高橋建設',
        projectId: 'PRJ-004',
        serviceType: 'inspection',
        priority: 'medium',
        status: 'scheduled',
        requestDate: '2024-08-10',
        scheduledDate: '2024-08-20',
        assignedTo: ['渡辺健二', '伊藤一郎'],
        estimatedDuration: 240,
        location: '建設現場A（新築住宅）',
        workDetails: [
          {
            id: '1',
            description: '構造部分の点検',
            category: '点検',
            technician: '渡辺健二',
            status: 'pending'
          },
          {
            id: '2',
            description: '設備機器の点検',
            category: '点検',
            technician: '伊藤一郎',
            status: 'pending'
          },
          {
            id: '3',
            description: '外装・内装の確認',
            category: '点検',
            technician: '渡辺健二',
            status: 'pending'
          }
        ],
        parts: [],
        costs: [
          {
            id: '1',
            category: 'labor',
            description: '定期点検費用',
            amount: 20000,
            billable: false
          }
        ],
        warrantyInfo: {
          warrantyType: 'both',
          startDate: '2024-05-01',
          endDate: '2034-04-30',
          termsAndConditions: '構造部分10年、設備2年の保証',
          coverageDetails: '構造欠陥、設備故障、施工不良'
        },
        followUpRequired: true,
        followUpDate: '2024-11-20',
        images: [],
        notes: ['大型案件の定期点検', '保証期間内点検'],
        createdBy: '渡辺健二',
        createdAt: '2024-08-10',
        lastModified: '2024-08-12'
      },
      {
        id: 'AC-004',
        serviceNo: 'AC-2024-004',
        title: 'グリーンパークマンション 月次巡回',
        description: 'マンション共用部の月次巡回点検とメンテナンス。',
        customerId: 'CUS-004',
        customerName: 'グリーンパークマンション管理組合',
        serviceType: 'maintenance',
        priority: 'low',
        status: 'completed',
        requestDate: '2024-08-01',
        scheduledDate: '2024-08-05',
        completedDate: '2024-08-05',
        assignedTo: ['小林美咲'],
        estimatedDuration: 90,
        actualDuration: 85,
        location: 'グリーンパークマンション',
        workDetails: [
          {
            id: '1',
            description: 'エントランス清掃',
            category: 'メンテナンス',
            startTime: '10:00',
            endTime: '10:30',
            technician: '小林美咲',
            status: 'completed'
          },
          {
            id: '2',
            description: '共用部照明点検',
            category: '点検',
            startTime: '10:30',
            endTime: '11:00',
            technician: '小林美咲',
            status: 'completed',
            notes: '2階廊下の電球1個交換'
          },
          {
            id: '3',
            description: '外構植栽確認',
            category: '点検',
            startTime: '11:00',
            endTime: '11:25',
            technician: '小林美咲',
            status: 'completed'
          }
        ],
        parts: [
          {
            id: '1',
            partName: 'LED電球',
            partCode: 'LED-001',
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
            supplier: '電材商社',
            warrantyPeriod: 36
          }
        ],
        costs: [
          {
            id: '1',
            category: 'labor',
            description: '月次メンテナンス',
            amount: 8500,
            billable: true
          },
          {
            id: '2',
            category: 'parts',
            description: 'LED電球交換',
            amount: 1200,
            billable: true
          }
        ],
        customerFeedback: {
          rating: 4,
          comment: '毎月丁寧に対応いただき感謝しています。',
          satisfactionLevel: 'satisfied',
          submittedAt: '2024-08-06'
        },
        followUpRequired: false,
        images: [
          {
            id: '1',
            url: '/images/aftercare/ac-004-maintenance.jpg',
            description: '清掃後のエントランス',
            category: 'after',
            uploadedAt: '2024-08-05',
            uploadedBy: '小林美咲'
          }
        ],
        notes: ['継続契約', '安定した業務'],
        createdBy: '小林美咲',
        createdAt: '2024-08-01',
        lastModified: '2024-08-06'
      }
    ]
    setServices(mockServices)
    setLoading(false)
  }

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'warranty': return '🛡️'
      case 'maintenance': return '🔧'
      case 'inspection': return '🔍'
      case 'repair': return '🛠️'
      case 'consultation': return '💬'
      case 'emergency': return '🚨'
      default: return '🔧'
    }
  }

  const getServiceTypeText = (type: string) => {
    switch (type) {
      case 'warranty': return '保証対応'
      case 'maintenance': return 'メンテナンス'
      case 'inspection': return '点検'
      case 'repair': return '修理'
      case 'consultation': return '相談'
      case 'emergency': return '緊急対応'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'on-hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '予定'
      case 'in-progress': return '対応中'
      case 'completed': return '完了'
      case 'cancelled': return 'キャンセル'
      case 'on-hold': return '保留'
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

  const getSatisfactionIcon = (level: string) => {
    switch (level) {
      case 'very-satisfied': return '😊'
      case 'satisfied': return '🙂'
      case 'neutral': return '😐'
      case 'unsatisfied': return '🙁'
      case 'very-unsatisfied': return '😞'
      default: return '😐'
    }
  }

  const filteredServices = services
    .filter(service => {
      if (searchTerm && !service.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !service.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !service.serviceNo.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterType !== 'all' && service.serviceType !== filterType) return false
      if (filterStatus !== 'all' && service.status !== filterStatus) return false
      if (filterPriority !== 'all' && service.priority !== filterPriority) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        case 'scheduled': return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'customer': return a.customerName.localeCompare(b.customerName)
        default: return 0
      }
    })

  const upcomingServices = services.filter(s => {
    const scheduleDate = new Date(s.scheduledDate)
    const today = new Date()
    const diffDays = Math.ceil((scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7 && s.status === 'scheduled'
  })

  const emergencyServices = services.filter(s => s.serviceType === 'emergency' && s.status !== 'completed')
  const warrantyServices = services.filter(s => s.serviceType === 'warranty')
  const avgSatisfaction = services
    .filter(s => s.customerFeedback)
    .reduce((sum, s) => sum + (s.customerFeedback?.rating || 0), 0) / 
    services.filter(s => s.customerFeedback).length || 0

  const handleServiceClick = (service: AftercareService) => {
    setSelectedService(service)
    setShowServiceModal(true)
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
              <h1 className="text-2xl font-bold text-gray-900">アフターケア</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/aftercare/schedule')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📅 点検スケジュール
              </button>
              <button
                onClick={() => router.push('/aftercare/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規依頼
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
              <CardTitle className="text-sm font-medium text-gray-600">総サービス数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-gray-500 mt-1">今月: +{services.filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth()).length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今週予定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{upcomingServices.length}</div>
              <p className="text-xs text-gray-500 mt-1">7日以内</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">緊急対応</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{emergencyServices.length}</div>
              <p className="text-xs text-gray-500 mt-1">対応中</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">保証対応</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{warrantyServices.length}</div>
              <p className="text-xs text-gray-500 mt-1">保証期間内</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">顧客満足度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{avgSatisfaction.toFixed(1)}</div>
              <p className="text-xs text-gray-500 mt-1">5点満点</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルターバー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="サービス名・顧客名・番号で検索..."
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
              <option value="warranty">保証対応</option>
              <option value="maintenance">メンテナンス</option>
              <option value="inspection">点検</option>
              <option value="repair">修理</option>
              <option value="consultation">相談</option>
              <option value="emergency">緊急対応</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべてのステータス</option>
              <option value="scheduled">予定</option>
              <option value="in-progress">対応中</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
              <option value="on-hold">保留</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべての優先度</option>
              <option value="urgent">緊急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">更新日順</option>
              <option value="scheduled">予定日順</option>
              <option value="priority">優先度順</option>
              <option value="customer">顧客名順</option>
            </select>
            <div className="flex gap-1">
              {['list', 'calendar', 'status'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100'
                  }`}
                >
                  {mode === 'list' ? 'リスト' : mode === 'calendar' ? 'カレンダー' : 'ステータス'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* サービス表示 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : viewMode === 'status' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 緊急・高優先度 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">🚨 緊急・高優先度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredServices.filter(s => s.priority === 'urgent' || s.priority === 'high').map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className="p-3 border rounded-lg hover:shadow-md cursor-pointer bg-red-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getServiceTypeIcon(service.serviceType)}</span>
                          <div>
                            <div className="font-medium text-sm">{service.title}</div>
                            <div className="text-xs text-gray-600">{service.customerName}</div>
                          </div>
                        </div>
                        <Badge className={getPriorityColor(service.priority)}>
                          {getPriorityText(service.priority)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        予定: {new Date(service.scheduledDate).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 今週予定 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">📅 今週予定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className="p-3 border rounded-lg hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getServiceTypeIcon(service.serviceType)}</span>
                        <div>
                          <div className="font-medium text-sm">{service.title}</div>
                          <div className="text-xs text-gray-600">{service.customerName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(service.scheduledDate).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 最近完了 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">✅ 最近完了</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredServices.filter(s => s.status === 'completed').slice(0, 5).map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className="p-3 border rounded-lg hover:shadow-md cursor-pointer bg-green-50"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getServiceTypeIcon(service.serviceType)}</span>
                        <div>
                          <div className="font-medium text-sm">{service.title}</div>
                          <div className="text-xs text-gray-600">{service.customerName}</div>
                          <div className="text-xs text-gray-500">
                            完了: {service.completedDate && new Date(service.completedDate).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                      {service.customerFeedback && (
                        <div className="flex items-center space-x-1 mt-2">
                          <span>{getSatisfactionIcon(service.customerFeedback.satisfactionLevel)}</span>
                          <span className="text-xs">評価: {service.customerFeedback.rating}/5</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">カレンダー表示は準備中です</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サービス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    予定日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    満足度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getServiceTypeIcon(service.serviceType)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                          <div className="text-xs text-gray-500">{service.serviceNo}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Badge className={getPriorityColor(service.priority)}>
                              {getPriorityText(service.priority)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getServiceTypeText(service.serviceType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(service.scheduledDate).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(service.estimatedDuration / 60)}時間予定
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(service.status)}>
                        {getStatusText(service.status)}
                      </Badge>
                      {service.followUpRequired && (
                        <div className="text-xs text-orange-600 mt-1">フォローアップ要</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.assignedTo.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {service.customerFeedback ? (
                        <div className="flex items-center space-x-2">
                          <span>{getSatisfactionIcon(service.customerFeedback.satisfactionLevel)}</span>
                          <span className="text-sm">{service.customerFeedback.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">未評価</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleServiceClick(service)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => router.push(`/aftercare/${service.id}/edit`)}
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

      {/* サービス詳細モーダル */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedService.title}</h2>
                <p className="text-gray-600">{selectedService.serviceNo}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedService.status)}>
                  {getStatusText(selectedService.status)}
                </Badge>
                <Badge className={getPriorityColor(selectedService.priority)}>
                  {getPriorityText(selectedService.priority)}
                </Badge>
                <button
                  onClick={() => setShowServiceModal(false)}
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
                      <div className="font-medium">{selectedService.customerName}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">サービスタイプ:</span>
                      <div className="font-medium">{getServiceTypeText(selectedService.serviceType)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">依頼日:</span>
                      <div className="font-medium">{new Date(selectedService.requestDate).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">予定日:</span>
                      <div className="font-medium">{new Date(selectedService.scheduledDate).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">担当者:</span>
                      <div className="font-medium">{selectedService.assignedTo.join(', ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">場所:</span>
                      <div className="font-medium">{selectedService.location}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">説明:</span>
                    <p className="mt-1">{selectedService.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 作業詳細 */}
              <Card>
                <CardHeader>
                  <CardTitle>作業詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedService.workDetails.map((work) => (
                      <div key={work.id} className="p-3 border rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{work.description}</div>
                            <div className="text-sm text-gray-600">カテゴリ: {work.category}</div>
                            <div className="text-sm text-gray-600">担当: {work.technician}</div>
                            {work.startTime && work.endTime && (
                              <div className="text-xs text-gray-500">
                                {work.startTime} - {work.endTime}
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusColor(work.status)}>
                            {work.status === 'completed' ? '完了' : 
                             work.status === 'in-progress' ? '進行中' : '予定'}
                          </Badge>
                        </div>
                        {work.notes && (
                          <div className="text-sm text-gray-600 mt-2">備考: {work.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 使用部品 */}
              {selectedService.parts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>使用部品</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedService.parts.map((part) => (
                        <div key={part.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <div className="font-medium">{part.partName}</div>
                            <div className="text-sm text-gray-600">コード: {part.partCode}</div>
                            <div className="text-sm text-gray-600">数量: {part.quantity}</div>
                            {part.warrantyPeriod && (
                              <div className="text-xs text-blue-600">保証: {part.warrantyPeriod}ヶ月</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">¥{part.totalPrice.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">単価: ¥{part.unitPrice.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 顧客フィードバック */}
              {selectedService.customerFeedback && (
                <Card>
                  <CardHeader>
                    <CardTitle>顧客フィードバック</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{getSatisfactionIcon(selectedService.customerFeedback.satisfactionLevel)}</span>
                        <div>
                          <div className="font-bold text-lg">{selectedService.customerFeedback.rating}/5</div>
                          <div className="text-sm text-gray-600">
                            {new Date(selectedService.customerFeedback.submittedAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p>"{selectedService.customerFeedback.comment}"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => router.push(`/aftercare/${selectedService.id}/edit`)}
                variant="outline"
              >
                編集
              </Button>
              <Button onClick={() => setShowServiceModal(false)}>
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}