'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  Package,
  FileText,
  Camera,
  CheckSquare,
  Banknote,
  Calendar,
  MapPin,
  ChevronRight,
  Activity,
  BarChart3,
} from 'lucide-react';

// モックデータ
const mockSites = [
  {
    id: 1,
    name: '山田様邸新築工事',
    address: '東京都世田谷区○○1-2-3',
    startTime: '08:00',
    endTime: '17:00',
    manager: '田中 三郎',
    priority: 'high',
    status: 'in_progress',
    progress: 60,
    workers: 5,
    memo: '基礎工事完了、上棟準備中',
    customer: '山田 太郎',
    contractAmount: 35000000,
    earnedValue: 21000000,
  },
  {
    id: 2,
    name: '鈴木様邸リフォーム',
    address: '東京都渋谷区△△2-3-4',
    startTime: '09:00',
    endTime: '16:00',
    manager: '田中 三郎',
    priority: 'normal',
    status: 'in_progress',
    progress: 30,
    workers: 3,
    memo: '内装解体中',
    customer: '鈴木 一郎',
    contractAmount: 8500000,
    earnedValue: 2550000,
  },
  {
    id: 3,
    name: '佐藤様邸外壁塗装',
    address: '東京都新宿区××3-4-5',
    startTime: '10:00',
    endTime: '15:00',
    manager: '田中 三郎',
    priority: 'urgent',
    status: 'delayed',
    progress: 45,
    workers: 2,
    memo: '【緊急】クレーム対応必要',
    customer: '佐藤 次郎',
    contractAmount: 1800000,
    earnedValue: 810000,
  },
];

const mockMaterials = [
  {
    name: '断熱材',
    status: 'shortage',
    remaining: 2,
    required: 10,
    unit: '箱',
    supplier: '建材商事',
    leadTime: '3日',
  },
  {
    name: 'フローリング材',
    status: 'unordered',
    remaining: 0,
    required: 50,
    unit: '㎡',
    supplier: '木材センター',
    leadTime: '5日',
  },
];

export default function ConstructionDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sites');

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== '施工管理') {
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

  const totalEarnedValue = mockSites.reduce(
    (sum, site) => sum + site.earnedValue,
    0,
  );
  const totalContractAmount = mockSites.reduce(
    (sum, site) => sum + site.contractAmount,
    0,
  );
  const progressRate = Math.round(
    (totalEarnedValue / totalContractAmount) * 100,
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
                <p className="text-sm text-gray-600">本日の現場数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSites.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  稼働中:{' '}
                  {mockSites.filter((s) => s.status === 'in_progress').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">出来高合計</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{(totalEarnedValue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-green-600 mt-1">
                  進捗率: {progressRate}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">遅延案件</p>
                <p className="text-2xl font-bold text-red-600">
                  {mockSites.filter((s) => s.status === 'delayed').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">要対応</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">作業員合計</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSites.reduce((sum, s) => sum + s.workers, 0)}名
                </p>
                <p className="text-xs text-gray-500 mt-1">配置済み</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'sites'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="inline h-4 w-4 mr-2" />
                現場管理
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'progress'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                進捗・出来高
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'materials'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="inline h-4 w-4 mr-2" />
                資材管理
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* 現場管理タブ */}
            {activeTab === 'sites' && (
              <div className="space-y-4">
                {mockSites
                  .sort((a, b) => {
                    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
                    return (
                      priorityOrder[a.priority] - priorityOrder[b.priority]
                    );
                  })
                  .map((site) => (
                    <div
                      key={site.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedSite(site);
                        setShowSiteModal(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{site.name}</h3>
                            {site.priority === 'urgent' && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                緊急
                              </span>
                            )}
                            {site.priority === 'high' && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                                優先
                              </span>
                            )}
                            {site.status === 'delayed' && (
                              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                                遅延
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {site.address}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {site.startTime} - {site.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              作業員 {site.workers}名
                            </div>
                            <div className="flex items-center gap-1">
                              <Banknote className="h-4 w-4" />¥
                              {(site.earnedValue / 1000000).toFixed(1)}M / ¥
                              {(site.contractAmount / 1000000).toFixed(1)}M
                            </div>
                          </div>

                          {site.memo && (
                            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                              📝 {site.memo}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 text-center">
                          <div className="text-3xl font-bold text-orange-600">
                            {site.progress}%
                          </div>
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${site.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">進捗率</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 進捗・出来高タブ */}
            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4">現場別出来高</h3>
                    <div className="space-y-3">
                      {mockSites.map((site) => (
                        <div key={site.id}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">
                              {site.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              ¥{(site.earnedValue / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              style={{
                                width: `${(site.earnedValue / site.contractAmount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-4">月次推移</h3>
                    <div className="h-48 flex items-end justify-between px-4">
                      {[65, 72, 68, 85, 90, 78, 82].map((value, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className="w-8 bg-gradient-to-t from-orange-500 to-yellow-500 rounded-t"
                            style={{ height: `${value * 1.5}px` }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {idx + 1}月
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-bold text-yellow-800 mb-2">未承認請求</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>山田様邸 - 追加工事</span>
                      <span className="font-bold text-yellow-800">
                        ¥350,000
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>鈴木様邸 - 仕様変更</span>
                      <span className="font-bold text-yellow-800">
                        ¥180,000
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 資材管理タブ */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                {mockMaterials.map((material, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      material.status === 'shortage'
                        ? 'bg-red-50 border-red-200'
                        : material.status === 'unordered'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg">{material.name}</h4>
                        <p className="text-sm text-gray-600">
                          在庫: {material.remaining}
                          {material.unit} / 必要: {material.required}
                          {material.unit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          仕入先: {material.supplier} | 納期:{' '}
                          {material.leadTime}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        発注する
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setShowPhotoModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Camera className="h-5 w-5 text-gray-600" />
            <span>現場写真</span>
          </button>
          <button
            onClick={() => setShowSafetyModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <CheckSquare className="h-5 w-5 text-gray-600" />
            <span>チェックリスト</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <FileText className="h-5 w-5 text-gray-600" />
            <span>日報作成</span>
          </button>
          <button
            onClick={() => setShowMaterialModal(true)}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <Activity className="h-5 w-5 text-gray-600" />
            <span>原価管理</span>
          </button>
        </div>
      </div>

      {/* 現場詳細モーダル */}
      {showSiteModal && selectedSite && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setSelectedSite(null);
            setShowSiteModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">{selectedSite.name}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">顧客名</p>
                  <p className="font-medium">{selectedSite.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">契約金額</p>
                  <p className="font-medium">
                    ¥{selectedSite.contractAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">住所</p>
                  <p className="font-medium">{selectedSite.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">進捗状況</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1">
                      <div className="w-full h-4 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                          style={{ width: `${selectedSite.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {selectedSite.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {selectedSite.memo && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-sm">{selectedSite.memo}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition">
                  出来高登録
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition">
                  写真アップロード
                </button>
                <button
                  onClick={() => {
                    setSelectedSite(null);
                    setShowSiteModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 安全管理モーダル */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-orange-500" />
              安全管理
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KY活動記録 */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3">本日のKY活動</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="危険予知内容を入力"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <textarea
                    placeholder="対策内容"
                    className="w-full px-3 py-2 border rounded h-20"
                  />
                  <button className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
                    KY活動記録を保存
                  </button>
                </div>
              </div>

              {/* 安全パトロールチェック */}
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold mb-3">安全パトロールチェックリスト</h3>
                <div className="space-y-2">
                  {[
                    '足場の安全確認',
                    '保護具着用確認',
                    '整理整頓',
                    '火気管理',
                    '電気設備確認',
                  ].map((item) => (
                    <label key={item} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                  <button className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                    チェック結果を記録
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-3">ヒヤリハット報告</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="date" className="px-3 py-2 border rounded" />
                <input
                  type="text"
                  placeholder="発生場所"
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="内容"
                  className="px-3 py-2 border rounded"
                />
              </div>
              <textarea
                placeholder="詳細と対策"
                className="w-full mt-3 px-3 py-2 border rounded h-20"
              />
              <button className="mt-3 bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">
                ヒヤリハット報告を提出
              </button>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="mt-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 材料管理モーダル */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Package className="h-6 w-6 mr-2 text-blue-500" />
              材料管理
            </h2>

            {/* 材料発注 */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-3">材料発注</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className="px-3 py-2 border rounded">
                  <option>材料カテゴリ選択</option>
                  <option>木材</option>
                  <option>金物</option>
                  <option>塗料</option>
                  <option>電材</option>
                </select>
                <input
                  type="text"
                  placeholder="材料名"
                  className="px-3 py-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="数量"
                  className="px-3 py-2 border rounded"
                />
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  発注追加
                </button>
              </div>
            </div>

            {/* 在庫状況 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-3">現場在庫状況</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">材料名</th>
                      <th className="px-3 py-2 text-center">在庫数</th>
                      <th className="px-3 py-2 text-center">必要数</th>
                      <th className="px-3 py-2 text-center">状態</th>
                      <th className="px-3 py-2 text-center">アクション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockMaterials.map((material, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2">{material.name}</td>
                        <td className="px-3 py-2 text-center">
                          {material.remaining} {material.unit}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {material.required} {material.unit}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {material.status === 'shortage' && (
                            <span className="text-red-600 font-bold">不足</span>
                          )}
                          {material.status === 'unordered' && (
                            <span className="text-orange-600 font-bold">
                              未発注
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600">
                            発注
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setShowMaterialModal(false)}
              className="mt-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 写真管理モーダル */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Camera className="h-6 w-6 mr-2 text-green-500" />
              工事写真管理
            </h2>

            {/* 写真アップロード */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold mb-3">写真アップロード</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className="px-3 py-2 border rounded">
                  <option>工程選択</option>
                  <option>基礎工事</option>
                  <option>躯体工事</option>
                  <option>内装工事</option>
                  <option>外装工事</option>
                </select>
                <input type="date" className="px-3 py-2 border rounded" />
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="px-3 py-2 border rounded"
                />
              </div>
              <textarea
                placeholder="写真の説明"
                className="w-full mt-3 px-3 py-2 border rounded h-20"
              />
              <button className="mt-3 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
                写真をアップロード
              </button>
            </div>

            {/* 写真一覧 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-2">
                  <div className="aspect-square bg-gray-300 rounded mb-2 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-600">基礎工事 - 配筋</p>
                  <p className="text-xs text-gray-500">2024/01/15</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPhotoModal(false)}
              className="mt-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 日報作成モーダル */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-purple-500" />
              工事日報作成
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div>
                <h3 className="font-bold mb-3">基本情報</h3>
                <div className="space-y-3">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                  />
                  <select className="w-full px-3 py-2 border rounded">
                    <option>現場選択</option>
                    {mockSites.map((site) => (
                      <option key={site.id}>{site.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="天候"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>

              {/* 作業内容 */}
              <div>
                <h3 className="font-bold mb-3">作業内容</h3>
                <textarea
                  placeholder="本日の作業内容を記入"
                  className="w-full px-3 py-2 border rounded h-32"
                />
              </div>
            </div>

            {/* 作業員 */}
            <div className="mt-6">
              <h3 className="font-bold mb-3">作業員</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="作業員名"
                  className="px-3 py-2 border rounded"
                />
                <select className="px-3 py-2 border rounded">
                  <option>職種</option>
                  <option>大工</option>
                  <option>電気工</option>
                  <option>配管工</option>
                </select>
                <input type="time" className="px-3 py-2 border rounded" />
                <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                  追加
                </button>
              </div>
            </div>

            {/* 進捗・課題 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3">進捗状況</h3>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" className="flex-1" />
                  <span className="font-bold">60%</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-3">課題・連絡事項</h3>
                <textarea
                  placeholder="課題や連絡事項を記入"
                  className="w-full px-3 py-2 border rounded h-20"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600">
                日報を保存
              </button>
              <button className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                日報を送信
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
