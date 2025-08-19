'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Hammer,
  FileText,
  Bell,
  Shield,
  Camera,
  ClipboardCheck,
  TrendingUp,
  Star,
  Home,
  Wrench,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

// モックデータ
const mockInspections = [
  {
    id: 1,
    customerName: '山田 太郎 様',
    address: '東京都世田谷区○○1-2-3',
    type: '1ヶ月点検',
    scheduledDate: '2024-08-20',
    status: 'scheduled',
    completionDate: '2023-07-20',
    priority: 'normal',
    phoneNumber: '090-1234-5678',
    contractAmount: 35000000,
    constructionType: '新築',
  },
  {
    id: 2,
    customerName: '鈴木 一郎 様',
    address: '東京都渋谷区△△2-3-4',
    type: '3ヶ月点検',
    scheduledDate: '2024-08-18',
    status: 'overdue',
    completionDate: '2023-05-18',
    priority: 'high',
    phoneNumber: '090-2345-6789',
    contractAmount: 12000000,
    constructionType: 'リフォーム',
  },
  {
    id: 3,
    customerName: '佐藤 次郎 様',
    address: '東京都新宿区××3-4-5',
    type: '1年点検',
    scheduledDate: '2024-08-25',
    status: 'scheduled',
    completionDate: '2022-08-25',
    priority: 'normal',
    phoneNumber: '090-3456-7890',
    contractAmount: 8500000,
    constructionType: '外壁塗装',
  },
];

const mockDefects = [
  {
    id: 1,
    customerName: '木村 様',
    issue: '外壁クラック',
    reportDate: '2024-08-10',
    status: 'estimate_created',
    estimateAmount: 150000,
    progress: 'draft',
    severity: 'medium',
    warranty: true,
  },
  {
    id: 2,
    customerName: '渡辺 様',
    issue: '屋根瓦ずれ',
    reportDate: '2024-08-12',
    status: 'accepted',
    estimateAmount: 280000,
    progress: 'construction',
    severity: 'high',
    warranty: false,
  },
  {
    id: 3,
    customerName: '伊藤 様',
    issue: '給湯器不調',
    reportDate: '2024-08-15',
    status: 'pending',
    estimateAmount: 95000,
    progress: 'waiting',
    severity: 'low',
    warranty: true,
  },
];

const mockCSScores = {
  nps: 72,
  satisfaction: 4.3,
  reviews: 156,
  thisMonth: {
    nps: 75,
    satisfaction: 4.5,
    count: 12,
    completed: 9,
  },
};

export default function AftercareDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('inspections');
  const [reminderSettings, setReminderSettings] = useState({
    oneMonth: true,
    oneWeek: true,
    oneDay: false,
  });
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCSModal, setShowCSModal] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'アフター担当') {
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

  const getDaysUntil = (date: string) => {
    const today = new Date();
    const scheduled = new Date(date);
    const diff = Math.ceil(
      (scheduled.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff < 0) return `${Math.abs(diff)}日超過`;
    if (diff === 0) return '本日';
    if (diff === 1) return '明日';
    return `${diff}日後`;
  };

  const totalInspections = mockInspections.length;
  const overdueInspections = mockInspections.filter(
    (i) => i.status === 'overdue',
  ).length;
  const completionRate = Math.round(
    (mockCSScores.thisMonth.completed / mockCSScores.thisMonth.count) * 100,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーは親コンポーネントで管理するため削除 */}

      <div className="container mx-auto px-4 py-6">
        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">NPSスコア</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCSScores.nps}
                </p>
                <p className="text-xs text-green-600 mt-1">前月比 +3</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">顧客満足度</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCSScores.satisfaction}/5.0
                </p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.floor(mockCSScores.satisfaction)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今月の点検</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCSScores.thisMonth.count}件
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  完了率 {completionRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">是正受注額</p>
                <p className="text-2xl font-bold text-gray-900">¥525K</p>
                <p className="text-xs text-green-600 mt-1">前月比 +12%</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('inspections')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'inspections'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                点検予定
              </button>
              <button
                onClick={() => setActiveTab('defects')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'defects'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wrench className="inline h-4 w-4 mr-2" />
                是正案件
              </button>
              <button
                onClick={() => setActiveTab('warranty')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'warranty'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="inline h-4 w-4 mr-2" />
                保証管理
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'text-cyan-600 border-b-2 border-cyan-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                分析
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 点検予定タブ */}
            {activeTab === 'inspections' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">今月の点検予定</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition">
                      今週
                    </button>
                    <button className="px-3 py-1 bg-cyan-500 text-white rounded">
                      今月
                    </button>
                    <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition">
                      来月
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockInspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedInspection(inspection)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-lg">
                              {inspection.customerName}
                            </h4>
                            <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">
                              {inspection.type}
                            </span>
                            {inspection.status === 'overdue' && (
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                                期限超過
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Home className="h-4 w-4" />
                              {inspection.address}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {inspection.scheduledDate} (
                              {getDaysUntil(inspection.scheduledDate)})
                            </div>
                            <div className="flex items-center gap-1">
                              <Hammer className="h-4 w-4" />
                              {inspection.constructionType}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {inspection.phoneNumber}
                            </div>
                          </div>

                          <div className="mt-2 text-xs text-gray-500">
                            完工日: {inspection.completionDate} | 契約金額: ¥
                            {(inspection.contractAmount / 1000000).toFixed(1)}M
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowInspectionModal(true);
                          }}
                          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition"
                        >
                          点検開始
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 是正案件タブ */}
            {activeTab === 'defects' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">是正案件一覧</h3>
                  <button
                    onClick={() => setShowEstimateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition"
                  >
                    <FileText className="inline h-4 w-4 mr-2" />
                    見積作成
                  </button>
                </div>

                <div className="space-y-3">
                  {mockDefects.map((defect) => (
                    <div
                      key={defect.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold">{defect.customerName}</h4>
                            {defect.warranty && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                保証対象
                              </span>
                            )}
                            {defect.severity === 'high' && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                重要度: 高
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            {defect.issue}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              報告日: {defect.reportDate}
                            </span>
                            <span className="font-bold text-cyan-600">
                              ¥{defect.estimateAmount.toLocaleString()}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                defect.progress === 'construction'
                                  ? 'bg-green-100 text-green-600'
                                  : defect.progress === 'draft'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-yellow-100 text-yellow-600'
                              }`}
                            >
                              {defect.progress === 'construction'
                                ? '工事中'
                                : defect.progress === 'draft'
                                  ? '見積作成済'
                                  : '承認待ち'}
                            </span>
                          </div>
                        </div>

                        <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition">
                          詳細
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 保証管理タブ */}
            {activeTab === 'warranty' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold mb-4">保証区分</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">構造保証</h4>
                        <span className="text-sm font-bold text-cyan-600">
                          10年
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        対象: 基礎、柱、梁、屋根
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">雨漏り保証</h4>
                        <span className="text-sm font-bold text-cyan-600">
                          10年
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        対象: 屋根、外壁、サッシ周り
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">設備保証</h4>
                        <span className="text-sm font-bold text-cyan-600">
                          1-5年
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        対象: 給湯器、エアコン、換気扇等
                      </div>
                      <div className="mt-2 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: '60%' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-4">リマインド設定</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderSettings.oneMonth}
                          onChange={(e) =>
                            setReminderSettings({
                              ...reminderSettings,
                              oneMonth: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-cyan-500"
                        />
                        <span>1ヶ月前に通知</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderSettings.oneWeek}
                          onChange={(e) =>
                            setReminderSettings({
                              ...reminderSettings,
                              oneWeek: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-cyan-500"
                        />
                        <span>1週間前に通知</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reminderSettings.oneDay}
                          onChange={(e) =>
                            setReminderSettings({
                              ...reminderSettings,
                              oneDay: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-cyan-500"
                        />
                        <span>前日に通知</span>
                      </label>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">通知方法</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-4 h-4"
                          />
                          <Mail className="h-4 w-4" />
                          メール
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" className="w-4 h-4" />
                          <MessageSquare className="h-4 w-4" />
                          SMS
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-400">
                          <input type="checkbox" disabled className="w-4 h-4" />
                          <MessageSquare className="h-4 w-4" />
                          LINE（準備中）
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 分析タブ */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">月次点検実績</h3>
                  <div className="h-48 flex items-end justify-between px-4">
                    {[85, 92, 78, 95, 88, 75, 90].map((value, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className="w-8 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t"
                          style={{ height: `${value * 1.5}px` }}
                        />
                        <span className="text-xs text-gray-500 mt-1">
                          {idx + 1}月
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4">是正案件分析</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">外壁関連</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-3 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: '45%' }}
                          />
                        </div>
                        <span className="text-sm font-bold">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">設備関連</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-3 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: '30%' }}
                          />
                        </div>
                        <span className="text-sm font-bold">30%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">屋根関連</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-3 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: '25%' }}
                          />
                        </div>
                        <span className="text-sm font-bold">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowChecklistModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="h-5 w-5 text-gray-600" />
            <span>チェックリスト</span>
          </button>
          <button
            onClick={() => setShowPhotoModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Camera className="h-5 w-5 text-gray-600" />
            <span>写真アップ</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span>報告書作成</span>
          </button>
          <button
            onClick={() => setShowCSModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Star className="h-5 w-5 text-gray-600" />
            <span>CS調査</span>
          </button>
        </div>
      </div>

      {/* 点検実施モーダル */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">点検実施</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  点検種別
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>1ヶ月点検</option>
                  <option>3ヶ月点検</option>
                  <option>6ヶ月点検</option>
                  <option>1年点検</option>
                  <option>3年点検</option>
                  <option>5年点検</option>
                  <option>10年点検</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  不具合の有無
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="defect"
                      value="none"
                      className="text-cyan-500"
                    />
                    <span>なし</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="defect"
                      value="exists"
                      className="text-cyan-500"
                    />
                    <span>あり</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  チェック項目
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                  {['外壁', '屋根', '基礎', '設備', '内装'].map((item) => (
                    <label key={item} className="flex items-center gap-2">
                      <input type="checkbox" className="text-cyan-500" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">備考</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                  placeholder="点検内容や気づいた点を記入"
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  点検完了
                </button>
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 即時見積モーダル */}
      {showEstimateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">即時見積作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  お客様名
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  工事内容
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>外壁補修</option>
                  <option>屋根補修</option>
                  <option>設備交換</option>
                  <option>内装補修</option>
                  <option>その他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  見積金額
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="150000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">工期</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="3日間"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  保証適用
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="warranty"
                      value="yes"
                      className="text-cyan-500"
                    />
                    <span>あり（無償）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="warranty"
                      value="no"
                      className="text-cyan-500"
                    />
                    <span>なし（有償）</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">詳細</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                  placeholder="工事内容の詳細を記入"
                ></textarea>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">契約方法</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contract"
                      value="now"
                      className="text-cyan-500"
                    />
                    <span className="text-sm">その場で契約</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="contract"
                      value="later"
                      className="text-cyan-500"
                    />
                    <span className="text-sm">後日提出</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  見積作成
                </button>
                <button
                  onClick={() => setShowEstimateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 点検詳細モーダル */}
      {selectedInspection && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInspection(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">
              {selectedInspection.customerName} - {selectedInspection.type}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">住所</p>
                  <p className="font-medium">{selectedInspection.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">電話番号</p>
                  <p className="font-medium">
                    {selectedInspection.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">点検予定日</p>
                  <p className="font-medium">
                    {selectedInspection.scheduledDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">完工日</p>
                  <p className="font-medium">
                    {selectedInspection.completionDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">工事種別</p>
                  <p className="font-medium">
                    {selectedInspection.constructionType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">契約金額</p>
                  <p className="font-medium">
                    ¥{selectedInspection.contractAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-cyan-50 rounded-lg p-4">
                <h4 className="font-bold mb-2">点検履歴</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>前回点検日</span>
                    <span className="font-medium">2024-05-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>前回結果</span>
                    <span className="font-medium text-green-600">異常なし</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInspectionModal(true);
                    setSelectedInspection(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition"
                >
                  点検開始
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition">
                  電話連絡
                </button>
                <button
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* チェックリストモーダル */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">点検チェックリスト</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">外部点検</h4>
                <div className="space-y-2">
                  {[
                    '外壁のひび割れ',
                    '屋根の破損・ずれ',
                    '雨樋の詰まり',
                    '基礎のクラック',
                    'シーリングの劣化',
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <input type="checkbox" className="text-cyan-500" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">内部点検</h4>
                <div className="space-y-2">
                  {[
                    '建具の動作確認',
                    '床の傾き・きしみ',
                    '壁・天井のクラック',
                    '水回りの漏水',
                    '換気設備の動作',
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <input type="checkbox" className="text-cyan-500" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">設備点検</h4>
                <div className="space-y-2">
                  {[
                    '給湯器の動作',
                    'エアコンの動作',
                    '電気設備の確認',
                    'ガス設備の確認',
                    '防災設備の確認',
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                    >
                      <input type="checkbox" className="text-cyan-500" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  保存
                </button>
                <button
                  onClick={() => setShowChecklistModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 写真アップロードモーダル */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">写真アップロード</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  案件選択
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>山田様 - 1ヶ月点検</option>
                  <option>鈴木様 - 3ヶ月点検</option>
                  <option>佐藤様 - 1年点検</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  カテゴリ
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>点検前</option>
                  <option>点検中</option>
                  <option>不具合箇所</option>
                  <option>補修完了</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">写真</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition cursor-pointer">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    クリックまたはドラッグ&ドロップ
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF (最大10MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">メモ</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  rows={2}
                  placeholder="撮影箇所や状況について"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  アップロード
                </button>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 報告書作成モーダル */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">点検報告書作成</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  報告書タイプ
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>定期点検報告書</option>
                  <option>不具合報告書</option>
                  <option>補修完了報告書</option>
                  <option>保証期間終了報告書</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    点検日
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  点検結果
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="result"
                      value="good"
                      className="text-cyan-500"
                    />
                    <span>異常なし</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="result"
                      value="defect"
                      className="text-cyan-500"
                    />
                    <span>要補修</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="result"
                      value="monitor"
                      className="text-cyan-500"
                    />
                    <span>要観察</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  点検内容
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  rows={4}
                  placeholder="点検した箇所と結果を記載"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  今後の対応
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                  placeholder="次回点検予定や推奨事項"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  添付写真
                </label>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                    写真を選択
                  </button>
                  <span className="text-sm text-gray-500">選択済み: 5枚</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  報告書作成
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CS調査モーダル */}
      {showCSModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">CS（顧客満足度）調査</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  お客様選択
                </label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                  <option>山田 太郎 様（最近の点検実施）</option>
                  <option>鈴木 一郎 様（補修工事完了）</option>
                  <option>佐藤 次郎 様（1年点検予定）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  調査方法
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 border rounded-lg hover:bg-cyan-50 hover:border-cyan-500 transition">
                    <Phone className="h-6 w-6 text-cyan-500 mx-auto mb-1" />
                    <span className="text-sm">電話</span>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-cyan-50 hover:border-cyan-500 transition">
                    <Mail className="h-6 w-6 text-cyan-500 mx-auto mb-1" />
                    <span className="text-sm">メール</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  調査項目
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-cyan-500"
                    />
                    <span className="text-sm">サービス満足度</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-cyan-500"
                    />
                    <span className="text-sm">対応品質</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-cyan-500"
                    />
                    <span className="text-sm">推奨意向（NPS）</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="text-cyan-500" />
                    <span className="text-sm">改善要望</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  送信タイミング
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="timing"
                      value="now"
                      defaultChecked
                      className="text-cyan-500"
                    />
                    <span className="text-sm">今すぐ</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="timing"
                      value="schedule"
                      className="text-cyan-500"
                    />
                    <span className="text-sm">予約送信</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  調査開始
                </button>
                <button
                  onClick={() => setShowCSModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
