'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Phone,
  Globe,
  Mail,
  Building,
  Car,
  UserPlus,
  Calendar,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  XCircle,
  User,
  DoorOpen,
  PhoneCall,
  FileText,
  TrendingUp,
} from 'lucide-react';

// モックデータ
const mockVisitors = [
  {
    id: 1,
    name: '新規のお客様',
    purpose: '見積相談',
    arrivalTime: '10:00',
    status: 'waiting',
    waitingTime: 15,
    phoneNumber: '090-1234-5678',
  },
  {
    id: 2,
    name: '山田 太郎 様',
    purpose: '契約手続き',
    arrivalTime: '10:30',
    status: 'in_meeting',
    room: '契約室',
    assignee: '佐藤 次郎',
    startTime: '10:35',
  },
  {
    id: 3,
    name: '鈴木 花子 様',
    purpose: 'アフターサービス',
    arrivalTime: '11:00',
    status: 'scheduled',
    appointmentTime: '11:00',
    assignee: '中村 次郎',
  },
];

const mockInquiries = [
  {
    id: 1,
    type: 'phone',
    name: '田中 様',
    content: 'リフォームの見積もりについて',
    time: '09:15',
    status: 'unassigned',
    priority: 'normal',
    phoneNumber: '03-1234-5678',
  },
  {
    id: 2,
    type: 'web',
    name: '鈴木 様',
    content: '【クレーム】工事の騒音について',
    time: '09:45',
    status: 'unassigned',
    priority: 'urgent',
    detail: '朝8時前から作業音が聞こえる。約束と違う。',
  },
  {
    id: 3,
    type: 'email',
    name: '佐藤 様',
    content: '保証内容の確認',
    time: '10:20',
    status: 'assigned',
    assignee: '中村 次郎',
    priority: 'normal',
    email: 'sato@example.com',
  },
];

const mockRooms = [
  {
    id: 1,
    name: '会議室A',
    status: 'available',
    capacity: 6,
    equipment: ['TV', 'ホワイトボード'],
    nextReservation: '14:00',
  },
  {
    id: 2,
    name: '会議室B',
    status: 'occupied',
    capacity: 4,
    currentUser: '営業会議',
    until: '11:30',
  },
  {
    id: 3,
    name: '会議室C',
    status: 'available',
    capacity: 8,
    equipment: ['プロジェクター'],
    nextReservation: '15:00',
  },
  {
    id: 4,
    name: '契約室',
    status: 'occupied',
    capacity: 4,
    currentUser: '山田様契約',
    until: '11:00',
    isPrivate: true,
  },
];

const mockVehicles = [
  {
    id: 1,
    name: '普通車A',
    number: '品川300あ1234',
    status: 'available',
    fuel: 80,
    mileage: 45320,
  },
  {
    id: 2,
    name: '普通車B',
    number: '品川300い5678',
    status: 'in_use',
    user: '佐藤',
    returnTime: '12:00',
    destination: '世田谷区',
  },
  {
    id: 3,
    name: '普通車C',
    number: '品川300う9012',
    status: 'available',
    fuel: 60,
    mileage: 38900,
  },
  {
    id: 4,
    name: 'トラック',
    number: '品川100か3456',
    status: 'in_use',
    user: '田中',
    returnTime: '17:00',
    destination: '横浜市',
  },
];

export default function OfficeDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('reception');
  const [showRoomReservationModal, setShowRoomReservationModal] =
    useState(false);
  const [showVehicleReservationModal, setShowVehicleReservationModal] =
    useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== '事務員') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dandori-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const getInquiryIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'web':
        return <Globe className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const totalInquiries = mockInquiries.length;
  const urgentInquiries = mockInquiries.filter(
    (i) => i.priority === 'urgent',
  ).length;
  const averageResponseTime = 3; // minutes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーは親コンポーネントで管理するため削除 */}

      <div className="container mx-auto px-4 py-6">
        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">本日の来客数</p>
                <p className="text-2xl font-bold text-gray-900">8名</p>
                <p className="text-xs text-green-600 mt-1">前日比 +2</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均応答時間</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageResponseTime}分
                </p>
                <p className="text-xs text-green-600 mt-1">目標達成中</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未対応</p>
                <p className="text-2xl font-bold text-red-600">
                  {urgentInquiries}件
                </p>
                <p className="text-xs text-gray-500 mt-1">クレーム優先</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">顧客満足度</p>
                <p className="text-2xl font-bold text-gray-900">4.5</p>
                <p className="text-xs text-gray-500 mt-1">★★★★☆</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('reception')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'reception'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DoorOpen className="inline h-4 w-4 mr-2" />
                来店受付
              </button>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'inquiries'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PhoneCall className="inline h-4 w-4 mr-2" />
                問い合わせ対応
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'resources'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building className="inline h-4 w-4 mr-2" />
                リソース管理
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 来店受付タブ */}
            {activeTab === 'reception' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">来店中のお客様</h3>
                  <button
                    onClick={() => setShowReceptionModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    <UserPlus className="inline h-4 w-4 mr-2" />
                    新規受付
                  </button>
                </div>

                <div className="space-y-3">
                  {mockVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-lg">
                              {visitor.name}
                            </h4>
                            {visitor.status === 'waiting' && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                                待機中 {visitor.waitingTime}分
                              </span>
                            )}
                            {visitor.status === 'in_meeting' && (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                対応中
                              </span>
                            )}
                            {visitor.status === 'scheduled' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                                予約
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              目的: {visitor.purpose}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              到着: {visitor.arrivalTime}
                            </div>
                            {visitor.room && (
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {visitor.room}使用中
                              </div>
                            )}
                            {visitor.assignee && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                担当: {visitor.assignee}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          {visitor.status === 'waiting' && (
                            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                              担当呼出
                            </button>
                          )}
                          {visitor.status === 'in_meeting' && (
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                              詳細確認
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 問い合わせ対応タブ */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2">問い合わせキュー</h3>
                  <p className="text-sm text-gray-600">
                    クレームを優先的に表示しています
                  </p>
                </div>

                <div className="space-y-3">
                  {mockInquiries
                    .sort((a, b) => {
                      if (a.priority === 'urgent') return -1;
                      if (b.priority === 'urgent') return 1;
                      return 0;
                    })
                    .map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition ${
                          inquiry.priority === 'urgent'
                            ? 'border-red-300 bg-red-50'
                            : ''
                        }`}
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getInquiryIcon(inquiry.type)}
                              <h4 className="font-bold">{inquiry.name}</h4>
                              {inquiry.priority === 'urgent' && (
                                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                  クレーム
                                </span>
                              )}
                              {inquiry.status === 'assigned' && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                  対応中
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-700 mb-1">
                              {inquiry.content}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>受付: {inquiry.time}</span>
                              {inquiry.assignee && (
                                <span>担当: {inquiry.assignee}</span>
                              )}
                            </div>
                          </div>

                          <div className="ml-4">
                            {inquiry.status === 'unassigned' && (
                              <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition">
                                割当
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* リソース管理タブ */}
            {activeTab === 'resources' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-4">会議室・商談室</h3>
                  <div className="space-y-2">
                    {mockRooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:shadow-sm transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{room.name}</h4>
                            {room.isPrivate && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                個室
                              </span>
                            )}
                          </div>
                          {room.status === 'available' ? (
                            <p className="text-xs text-green-600">
                              空き（次: {room.nextReservation}）
                            </p>
                          ) : (
                            <p className="text-xs text-red-600">
                              {room.currentUser}（～{room.until}）
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            定員: {room.capacity}名
                          </p>
                        </div>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            room.status === 'available'
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4">車両管理</h3>
                  <div className="space-y-2">
                    {mockVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex justify-between items-center p-3 border rounded-lg hover:shadow-sm transition"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{vehicle.name}</h4>
                          <p className="text-xs text-gray-500">
                            {vehicle.number}
                          </p>
                          {vehicle.status === 'in_use' ? (
                            <p className="text-xs text-orange-600">
                              {vehicle.user}使用中（{vehicle.destination}）～
                              {vehicle.returnTime}
                            </p>
                          ) : (
                            <p className="text-xs text-green-600">
                              利用可能 | 燃料: {vehicle.fuel}%
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Car
                            className={`h-5 w-5 ${vehicle.status === 'available' ? 'text-green-500' : 'text-orange-500'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowCustomerModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <UserPlus className="h-5 w-5 text-gray-600" />
            <span>顧客登録</span>
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>予約管理</span>
          </button>
          <button
            onClick={() => setShowDocumentModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span>書類作成</span>
          </button>
          <button className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2">
            <Phone className="h-5 w-5 text-gray-600" />
            <span>電話記録</span>
          </button>
        </div>
      </div>

      {/* 来店受付モーダル */}
      {showReceptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">来店受付</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  お客様名
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="090-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  来店目的
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>見積相談</option>
                  <option>契約手続き</option>
                  <option>アフターサービス</option>
                  <option>クレーム</option>
                  <option>その他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">担当者</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>指名なし（空いている人）</option>
                  <option>佐藤 次郎（営業）</option>
                  <option>田中 三郎（施工管理）</option>
                  <option>中村 次郎（アフター）</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition">
                  受付完了
                </button>
                <button
                  onClick={() => setShowReceptionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新規顧客登録モーダル */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">新規顧客登録</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="090-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="yamada@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">住所</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="東京都世田谷区..."
                />
              </div>
              <p className="text-xs text-gray-500">
                ※ 現場住所は見積/契約時に追加されます
              </p>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition">
                  登録
                </button>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 問い合わせ詳細モーダル */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">問い合わせ詳細</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">お客様名</p>
                <p className="font-medium">{selectedInquiry.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">内容</p>
                <p className="font-medium">{selectedInquiry.content}</p>
                {selectedInquiry.detail && (
                  <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded">
                    {selectedInquiry.detail}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">受付時間</p>
                  <p className="font-medium">{selectedInquiry.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">優先度</p>
                  <p className="font-medium">
                    {selectedInquiry.priority === 'urgent' ? '緊急' : '通常'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition">
                  担当者を割り当て
                </button>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 予約管理モーダル */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">予約管理</h3>

            <div className="space-y-6">
              {/* 新規予約 */}
              <div className="border-b pb-4">
                <h4 className="font-medium mb-3">新規予約登録</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      日付
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      時間
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      お客様名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      種別
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg">
                      <option>見積相談</option>
                      <option>契約</option>
                      <option>アフターサービス</option>
                      <option>打ち合わせ</option>
                    </select>
                  </div>
                </div>
                <button className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                  予約登録
                </button>
              </div>

              {/* 予約一覧 */}
              <div>
                <h4 className="font-medium mb-3">本日の予約</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">10:00 - 山田様</p>
                      <p className="text-sm text-gray-600">
                        見積相談（担当：佐藤）
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      詳細
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">14:00 - 鈴木様</p>
                      <p className="text-sm text-gray-600">
                        契約手続き（担当：田中）
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      詳細
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">16:00 - 佐藤様</p>
                      <p className="text-sm text-gray-600">
                        アフターサービス（担当：中村）
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      詳細
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 書類作成モーダル */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">書類作成</h3>

            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-blue-500 mb-2" />
                <h4 className="font-medium">見積書</h4>
                <p className="text-sm text-gray-600">新規見積書を作成</p>
              </button>

              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-green-500 mb-2" />
                <h4 className="font-medium">契約書</h4>
                <p className="text-sm text-gray-600">契約書を準備</p>
              </button>

              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-purple-500 mb-2" />
                <h4 className="font-medium">請求書</h4>
                <p className="text-sm text-gray-600">請求書を発行</p>
              </button>

              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-orange-500 mb-2" />
                <h4 className="font-medium">領収書</h4>
                <p className="text-sm text-gray-600">領収書を発行</p>
              </button>

              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-red-500 mb-2" />
                <h4 className="font-medium">完了報告書</h4>
                <p className="text-sm text-gray-600">工事完了報告書</p>
              </button>

              <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                <FileText className="h-8 w-8 text-indigo-500 mb-2" />
                <h4 className="font-medium">その他</h4>
                <p className="text-sm text-gray-600">その他の書類</p>
              </button>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3">最近作成した書類</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">見積書 #2024-001 - 山田様</span>
                  <span className="text-xs text-gray-500">2時間前</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">契約書 #C-2024-015 - 鈴木様</span>
                  <span className="text-xs text-gray-500">昨日</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
