'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ScheduleEvent {
  id: string
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  type: 'project' | 'meeting' | 'task' | 'maintenance' | 'training' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  location?: string
  assignedTo: string[]
  projectId?: string
  customerId?: string
  reminders: number[] // minutes before event
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: string
  }
  color: string
  createdBy: string
  createdAt: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: ScheduleEvent[]
}

export default function SchedulePage() {
  const router = useRouter()
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterType, setFilterType] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endDate: new Date().toISOString().split('T')[0],
    endTime: '10:00',
    type: 'task',
    priority: 'medium',
    status: 'scheduled',
    assignedTo: [],
    reminders: [15],
    color: '#3B82F6'
  })

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
      return
    }
    fetchEvents()
  }, [router])

  const fetchEvents = async () => {
    setLoading(true)
    // モックデータ
    const mockEvents: ScheduleEvent[] = [
      {
        id: 'EVT-001',
        title: '田中様邸 現場確認',
        description: '外壁塗装工事の進捗確認と品質チェック',
        startDate: '2024-08-15',
        startTime: '09:00',
        endDate: '2024-08-15',
        endTime: '11:00',
        type: 'project',
        priority: 'high',
        status: 'scheduled',
        location: '東京都渋谷区田中様邸',
        assignedTo: ['山田次郎', '佐藤一郎'],
        projectId: 'PRJ-001',
        customerId: 'CUS-001',
        reminders: [30, 15],
        color: '#10B981',
        createdBy: '山田次郎',
        createdAt: '2024-08-10'
      },
      {
        id: 'EVT-002',
        title: '週次ミーティング',
        description: 'プロジェクト進捗報告と今週の予定確認',
        startDate: '2024-08-16',
        startTime: '14:00',
        endDate: '2024-08-16',
        endTime: '15:00',
        type: 'meeting',
        priority: 'medium',
        status: 'scheduled',
        location: '会議室A',
        assignedTo: ['山田次郎', '佐藤花子', '田中太郎'],
        reminders: [15],
        recurring: {
          frequency: 'weekly',
          interval: 1
        },
        color: '#3B82F6',
        createdBy: '田中太郎',
        createdAt: '2024-08-01'
      },
      {
        id: 'EVT-003',
        title: '安全講習会',
        description: '現場作業員向け安全教育研修',
        startDate: '2024-08-17',
        startTime: '13:00',
        endDate: '2024-08-17',
        endTime: '17:00',
        type: 'training',
        priority: 'high',
        status: 'scheduled',
        location: '研修センター',
        assignedTo: ['佐藤一郎', '鈴木三郎', '高橋四郎'],
        reminders: [60, 30],
        color: '#F59E0B',
        createdBy: '佐藤花子',
        createdAt: '2024-08-05'
      },
      {
        id: 'EVT-004',
        title: '山田ビル 見積もり打ち合わせ',
        description: 'リフォーム工事の詳細見積もり説明',
        startDate: '2024-08-18',
        startTime: '10:30',
        endDate: '2024-08-18',
        endTime: '12:00',
        type: 'meeting',
        priority: 'high',
        status: 'scheduled',
        location: '山田ビル',
        assignedTo: ['佐藤花子'],
        projectId: 'PRJ-002',
        customerId: 'CUS-002',
        reminders: [15],
        color: '#8B5CF6',
        createdBy: '佐藤花子',
        createdAt: '2024-08-12'
      },
      {
        id: 'EVT-005',
        title: '機材メンテナンス',
        description: '塗装機械の定期点検と清掃',
        startDate: '2024-08-19',
        startTime: '08:00',
        endDate: '2024-08-19',
        endTime: '10:00',
        type: 'maintenance',
        priority: 'medium',
        status: 'scheduled',
        location: '倉庫A',
        assignedTo: ['鈴木太郎'],
        reminders: [30],
        color: '#EF4444',
        createdBy: '鈴木太郎',
        createdAt: '2024-08-13'
      },
      {
        id: 'EVT-006',
        title: '新築住宅A 基礎工事完了検査',
        description: '基礎工事の品質検査と次工程確認',
        startDate: '2024-08-20',
        startTime: '14:00',
        endDate: '2024-08-20',
        endTime: '16:00',
        type: 'project',
        priority: 'urgent',
        status: 'scheduled',
        location: '建設現場A',
        assignedTo: ['渡辺健二', '伊藤一郎'],
        projectId: 'PRJ-004',
        reminders: [60, 15],
        color: '#10B981',
        createdBy: '渡辺健二',
        createdAt: '2024-08-14'
      }
    ]
    setEvents(mockEvents)
    setLoading(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project': return '🏗️'
      case 'meeting': return '👥'
      case 'task': return '📋'
      case 'maintenance': return '🔧'
      case 'training': return '📚'
      case 'other': return '📅'
      default: return '📅'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'project': return 'プロジェクト'
      case 'meeting': return '会議'
      case 'task': return 'タスク'
      case 'maintenance': return 'メンテナンス'
      case 'training': return '研修'
      case 'other': return 'その他'
      default: return type
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '予定'
      case 'in-progress': return '進行中'
      case 'completed': return '完了'
      case 'cancelled': return 'キャンセル'
      default: return status
    }
  }

  // カレンダーの日付計算
  const getCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate.toDateString() === currentDate.toDateString() &&
               (filterType === 'all' || event.type === filterType) &&
               (filterAssignee === 'all' || event.assignedTo.includes(filterAssignee))
      })
      
      days.push({
        date: currentDate,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        events: dayEvents
      })
    }
    
    return days
  }

  const filteredEvents = events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false
    if (filterAssignee !== 'all' && !event.assignedTo.includes(filterAssignee)) return false
    return true
  })

  const todayEvents = events.filter(event => {
    const today = new Date().toDateString()
    const eventDate = new Date(event.startDate).toDateString()
    return eventDate === today && event.status !== 'completed' && event.status !== 'cancelled'
  })

  const upcomingEvents = events.filter(event => {
    const today = new Date()
    const eventDate = new Date(event.startDate)
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7 && event.status !== 'completed' && event.status !== 'cancelled'
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleNewEvent = () => {
    setSelectedEvent(null)
    setNewEvent({
      title: '',
      description: '',
      startDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      endTime: '10:00',
      type: 'task',
      priority: 'medium',
      status: 'scheduled',
      assignedTo: [],
      reminders: [15],
      color: '#3B82F6'
    })
    setShowEventModal(true)
  }

  const saveEvent = async () => {
    // イベント保存処理をここに実装
    console.log('Saving event:', selectedEvent || newEvent)
    setShowEventModal(false)
    fetchEvents()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const calendarDays = getCalendarDays(currentDate)
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/schedule/calendar-sync')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                📱 カレンダー同期
              </button>
              <button
                onClick={handleNewEvent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + 新規予定
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計・今日の予定 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今日の予定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayEvents.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {todayEvents.filter(e => e.priority === 'urgent' || e.priority === 'high').length}件が重要
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">今週の予定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <p className="text-xs text-gray-500 mt-1">7日以内</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">進行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.status === 'in-progress').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">アクティブ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">完了率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(events.filter(e => e.status === 'completed').length / events.length * 100)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">今月</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* メインカレンダー */}
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      ←
                    </button>
                    <h2 className="text-xl font-semibold">
                      {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                    </h2>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      →
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-3 py-1 border rounded text-sm"
                    >
                      <option value="all">すべてのタイプ</option>
                      <option value="project">プロジェクト</option>
                      <option value="meeting">会議</option>
                      <option value="task">タスク</option>
                      <option value="maintenance">メンテナンス</option>
                      <option value="training">研修</option>
                    </select>
                    
                    <div className="flex gap-1">
                      {['month', 'week', 'day', 'agenda'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode as any)}
                          className={`px-3 py-1 rounded text-sm ${
                            viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-100'
                          }`}
                        >
                          {mode === 'month' ? '月' : mode === 'week' ? '週' : mode === 'day' ? '日' : 'リスト'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {viewMode === 'month' ? (
                  <div className="grid grid-cols-7 gap-1">
                    {/* 曜日ヘッダー */}
                    {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    
                    {/* カレンダー日付 */}
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(day.date)}
                        className={`min-h-24 p-1 border cursor-pointer hover:bg-gray-50 ${
                          day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${day.isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
                      >
                        <div className={`text-sm ${
                          day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${day.isToday ? 'font-bold text-blue-600' : ''}`}>
                          {day.date.getDate()}
                        </div>
                        
                        <div className="space-y-1">
                          {day.events.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEventClick(event)
                              }}
                              className="text-xs p-1 rounded truncate cursor-pointer"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              {event.startTime} {event.title}
                            </div>
                          ))}
                          {day.events.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{day.events.length - 3}件
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'agenda' ? (
                  <div className="space-y-3">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getTypeIcon(event.type)}</span>
                            <div>
                              <h3 className="font-medium">{event.title}</h3>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>📅 {new Date(event.startDate).toLocaleDateString('ja-JP')}</span>
                                <span>🕐 {event.startTime} - {event.endTime}</span>
                                {event.location && <span>📍 {event.location}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(event.priority)}>
                              {getPriorityText(event.priority)}
                            </Badge>
                            <Badge className={getStatusColor(event.status)}>
                              {getStatusText(event.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        {event.assignedTo.length > 0 && (
                          <div className="mt-3 flex items-center space-x-2">
                            <span className="text-xs text-gray-500">担当:</span>
                            <div className="flex space-x-1">
                              {event.assignedTo.map((person, index) => (
                                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {person}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">週表示・日表示は準備中です</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 今日の予定 */}
            <Card>
              <CardHeader>
                <CardTitle>今日の予定</CardTitle>
              </CardHeader>
              <CardContent>
                {todayEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">予定はありません</p>
                ) : (
                  <div className="space-y-3">
                    {todayEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                        className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{getTypeIcon(event.type)}</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{event.title}</div>
                            <div className="text-xs text-gray-500">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                          <Badge className={getPriorityColor(event.priority)}>
                            {getPriorityText(event.priority)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 今週の予定 */}
            <Card>
              <CardHeader>
                <CardTitle>今週の予定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 8).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-2 text-sm border rounded cursor-pointer hover:bg-gray-50"
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleDateString('ja-JP')} {event.startTime}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* チームメンバー */}
            <Card>
              <CardHeader>
                <CardTitle>チームメンバー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['山田次郎', '佐藤花子', '田中太郎', '鈴木太郎', '渡辺健二'].map((member) => {
                    const memberEvents = todayEvents.filter(e => e.assignedTo.includes(member))
                    return (
                      <div key={member} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm">{member.charAt(0)}</span>
                          </div>
                          <span className="text-sm">{member}</span>
                        </div>
                        <span className="text-xs text-gray-500">{memberEvents.length}件</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* イベント詳細/編集モーダル */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {selectedEvent ? '予定の詳細' : '新規予定作成'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={selectedEvent?.title || newEvent.title}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({ ...selectedEvent, title: e.target.value })
                    : setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={selectedEvent?.description || newEvent.description}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({ ...selectedEvent, description: e.target.value })
                    : setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    type="date"
                    value={selectedEvent?.startDate || newEvent.startDate}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, startDate: e.target.value })
                      : setNewEvent({ ...newEvent, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時刻
                  </label>
                  <input
                    type="time"
                    value={selectedEvent?.startTime || newEvent.startTime}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, startTime: e.target.value })
                      : setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイプ
                  </label>
                  <select
                    value={selectedEvent?.type || newEvent.type}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, type: e.target.value as any })
                      : setNewEvent({ ...newEvent, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="project">プロジェクト</option>
                    <option value="meeting">会議</option>
                    <option value="task">タスク</option>
                    <option value="maintenance">メンテナンス</option>
                    <option value="training">研修</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    優先度
                  </label>
                  <select
                    value={selectedEvent?.priority || newEvent.priority}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, priority: e.target.value as any })
                      : setNewEvent({ ...newEvent, priority: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">緊急</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={selectedEvent?.status || newEvent.status}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, status: e.target.value as any })
                      : setNewEvent({ ...newEvent, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">予定</option>
                    <option value="in-progress">進行中</option>
                    <option value="completed">完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所
                </label>
                <input
                  type="text"
                  value={selectedEvent?.location || newEvent.location || ''}
                  onChange={(e) => selectedEvent 
                    ? setSelectedEvent({ ...selectedEvent, location: e.target.value })
                    : setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => setShowEventModal(false)}
                variant="outline"
              >
                キャンセル
              </Button>
              <Button onClick={saveEvent}>
                {selectedEvent ? '更新' : '作成'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}