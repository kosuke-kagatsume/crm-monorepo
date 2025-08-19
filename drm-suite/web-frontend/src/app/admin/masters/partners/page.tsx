'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  ChevronLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Filter,
  Phone,
  Mail,
  MapPin,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  Briefcase,
  Star,
  X,
} from 'lucide-react';
import { PartnerCompanyMaster } from '@/types/master';

export default function PartnersMasterPage() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'suspended' | 'terminated'
  >('all');
  const [filterBusinessType, setFilterBusinessType] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerCompanyMaster | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    '2024-03-15 10:30:00',
  );

  // モックデータ：協力会社マスタ（DW APIから取得想定）
  const [partners] = useState<PartnerCompanyMaster[]>([
    {
      id: '1',
      dwId: 'DW-PARTNER-001',
      companyName: '山田建設株式会社',
      companyNameKana: 'ヤマダケンセツカブシキガイシャ',
      representative: '山田 太郎',
      contactPerson: '山田 次郎',
      email: 'info@yamada-kensetsu.co.jp',
      phone: '03-1234-5678',
      address: '東京都新宿区西新宿1-2-3',
      businessTypes: ['大工工事', '内装工事', '建具工事'],
      licenses: ['建設業許可（東京都知事）第12345号', '一級建築施工管理技士'],
      bankInfo: {
        bankName: 'みずほ銀行',
        branchName: '新宿支店',
        accountType: '普通',
        accountNumber: '1234567',
        accountName: 'ヤマダケンセツ（カ',
      },
      evaluationScore: 4.5,
      contractStatus: 'active',
      notes: '品質・納期ともに安定。長期契約実績あり。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-01-15',
      updatedAt: '2024-03-15',
    },
    {
      id: '2',
      dwId: 'DW-PARTNER-002',
      companyName: '鈴木電気工事株式会社',
      companyNameKana: 'スズキデンキコウジカブシキガイシャ',
      representative: '鈴木 一郎',
      contactPerson: '鈴木 花子',
      email: 'contact@suzuki-denki.jp',
      phone: '045-234-5678',
      address: '神奈川県横浜市中区山下町123',
      businessTypes: ['電気工事', '空調工事', '設備工事'],
      licenses: ['電気工事業登録', '第一種電気工事士'],
      evaluationScore: 4.8,
      contractStatus: 'active',
      notes: '電気工事のスペシャリスト。緊急対応可能。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-02-20',
      updatedAt: '2024-03-14',
    },
    {
      id: '3',
      dwId: 'DW-PARTNER-003',
      companyName: '田中塗装工業',
      companyNameKana: 'タナカトソウコウギョウ',
      representative: '田中 三郎',
      contactPerson: '田中 三郎',
      email: 'tanaka-tosou@email.com',
      phone: '090-1234-5678',
      address: '埼玉県さいたま市大宮区桜木町4-5-6',
      businessTypes: ['塗装工事', '防水工事'],
      licenses: ['塗装技能士1級'],
      evaluationScore: 4.2,
      contractStatus: 'active',
      notes: '小規模だが技術力高い。個人経営。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-03-10',
      updatedAt: '2024-03-13',
    },
    {
      id: '4',
      dwId: 'DW-PARTNER-004',
      companyName: '佐藤設備工業株式会社',
      companyNameKana: 'サトウセツビコウギョウカブシキガイシャ',
      representative: '佐藤 四郎',
      contactPerson: '佐藤 美咲',
      email: 'info@sato-setsubi.co.jp',
      phone: '048-345-6789',
      address: '埼玉県川口市本町1-2-3',
      businessTypes: ['給排水工事', '空調工事', 'ガス工事'],
      licenses: ['管工事業許可', '給水装置工事主任技術者'],
      evaluationScore: 4.6,
      contractStatus: 'active',
      notes: '設備工事全般対応可能。アフターサービス充実。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-04-01',
      updatedAt: '2024-03-12',
    },
    {
      id: '5',
      dwId: 'DW-PARTNER-005',
      companyName: '高橋左官工業',
      companyNameKana: 'タカハシサカンコウギョウ',
      representative: '高橋 五郎',
      contactPerson: '高橋 五郎',
      email: 'takahashi-sakan@example.com',
      phone: '080-2345-6789',
      address: '千葉県船橋市本町2-3-4',
      businessTypes: ['左官工事', 'タイル工事'],
      licenses: ['左官技能士1級'],
      evaluationScore: 3.8,
      contractStatus: 'suspended',
      notes: '技術力はあるが、最近納期遅延が発生。要注意。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-05-15',
      updatedAt: '2024-03-11',
    },
    {
      id: '6',
      dwId: 'DW-PARTNER-006',
      companyName: '中村解体工業株式会社',
      companyNameKana: 'ナカムラカイタイコウギョウカブシキガイシャ',
      representative: '中村 六郎',
      contactPerson: '中村 健太',
      email: 'nakamura-kaitai@demo.jp',
      phone: '043-456-7890',
      address: '千葉県千葉市中央区新町1000',
      businessTypes: ['解体工事', '産廃処理'],
      licenses: ['解体工事業登録', '産業廃棄物収集運搬業許可'],
      evaluationScore: 4.0,
      contractStatus: 'active',
      notes: '解体工事のプロフェッショナル。廃棄物処理も一括対応。',
      lastSyncedAt: '2024-03-15 10:30:00',
      createdAt: '2023-06-01',
      updatedAt: '2024-03-10',
    },
  ]);

  const businessTypes = [
    '大工工事',
    '内装工事',
    '電気工事',
    '給排水工事',
    '空調工事',
    '塗装工事',
    '左官工事',
    '解体工事',
    '防水工事',
    'その他',
  ];

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.companyNameKana
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      partner.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.dwId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || partner.contractStatus === filterStatus;
    const matchesBusinessType =
      filterBusinessType === 'all' ||
      partner.businessTypes.includes(filterBusinessType);
    return matchesSearch && matchesStatus && matchesBusinessType;
  });

  const handleSyncWithDW = async () => {
    setIsSyncing(true);
    // DW APIとの同期処理（モック）
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleString('ja-JP'));
      alert('DandoriWork APIとの同期が完了しました');
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            契約中
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            一時停止
          </span>
        );
      case 'terminated':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            契約終了
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (score: number) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />,
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-200 text-yellow-400" />,
      );
    }
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">({score})</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <nav className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/masters')}
                className="hover:bg-white/20 p-2 rounded transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-7 w-7" />
                  協力会社マスタ
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  DandoriWork連携・協力会社情報管理
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncWithDW}
                disabled={isSyncing}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                DW同期
              </button>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <Download className="h-4 w-4" />
                エクスポート
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 同期状態 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                DandoriWork APIとの最終同期: {lastSyncTime}
              </span>
            </div>
            <span className="text-xs text-blue-600">
              自動同期: 毎日 AM 3:00
            </span>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="会社名、担当者名、DW IDで検索..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={filterBusinessType}
              onChange={(e) => setFilterBusinessType(e.target.value)}
            >
              <option value="all">全業種</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">全ステータス</option>
              <option value="active">契約中</option>
              <option value="suspended">一時停止</option>
              <option value="terminated">契約終了</option>
            </select>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">総協力会社数</p>
            <p className="text-2xl font-bold text-gray-900">
              {partners.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">契約中</p>
            <p className="text-2xl font-bold text-green-600">
              {partners.filter((p) => p.contractStatus === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">平均評価</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(
                partners.reduce((sum, p) => sum + (p.evaluationScore || 0), 0) /
                partners.length
              ).toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">業種数</p>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(partners.flatMap((p) => p.businessTypes)).size}
            </p>
          </div>
        </div>

        {/* データテーブル */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DW ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会社名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    業種
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    評価
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {partner.dwId}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {partner.companyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {partner.representative}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {partner.businessTypes.slice(0, 2).map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                          >
                            {type}
                          </span>
                        ))}
                        {partner.businessTypes.length > 2 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            +{partner.businessTypes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>{partner.contactPerson}</div>
                        <div className="text-xs text-gray-500">
                          {partner.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {partner.evaluationScore &&
                        renderStars(partner.evaluationScore)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(partner.contractStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedPartner(partner);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      {showDetailModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">協力会社詳細</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPartner(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* 基本情報 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    基本情報
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">DW ID</label>
                      <p className="font-medium">{selectedPartner.dwId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">会社名</label>
                      <p className="font-medium">
                        {selectedPartner.companyName}
                      </p>
                      {selectedPartner.companyNameKana && (
                        <p className="text-sm text-gray-500">
                          {selectedPartner.companyNameKana}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">代表者</label>
                      <p className="font-medium">
                        {selectedPartner.representative}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">
                        ステータス
                      </label>
                      <div className="mt-1">
                        {getStatusBadge(selectedPartner.contractStatus)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 連絡先情報 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    連絡先
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">担当者</label>
                      <p className="font-medium">
                        {selectedPartner.contactPerson}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">電話番号</label>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {selectedPartner.phone}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">メール</label>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {selectedPartner.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">住所</label>
                      <p className="font-medium flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        {selectedPartner.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 業務情報 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    業務情報
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">対応業種</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPartner.businessTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedPartner.licenses &&
                      selectedPartner.licenses.length > 0 && (
                        <div>
                          <label className="text-sm text-gray-600">
                            保有資格
                          </label>
                          <div className="space-y-1 mt-1">
                            {selectedPartner.licenses.map((license, index) => (
                              <p
                                key={index}
                                className="text-sm flex items-start gap-1"
                              >
                                <Award className="h-4 w-4 text-yellow-500 mt-0.5" />
                                {license}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* 評価・備考 */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    評価・備考
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-gray-600">
                        評価スコア
                      </label>
                      <div className="mt-1">
                        {selectedPartner.evaluationScore &&
                          renderStars(selectedPartner.evaluationScore)}
                      </div>
                    </div>
                    {selectedPartner.notes && (
                      <div>
                        <label className="text-sm text-gray-600">備考</label>
                        <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                          {selectedPartner.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 銀行情報 */}
              {selectedPartner.bankInfo && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-bold text-gray-900 mb-3">銀行口座情報</h3>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded">
                    <div>
                      <label className="text-sm text-gray-600">銀行名</label>
                      <p className="font-medium">
                        {selectedPartner.bankInfo.bankName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">支店名</label>
                      <p className="font-medium">
                        {selectedPartner.bankInfo.branchName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">口座種別</label>
                      <p className="font-medium">
                        {selectedPartner.bankInfo.accountType}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">口座番号</label>
                      <p className="font-medium">
                        {selectedPartner.bankInfo.accountNumber}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-gray-600">口座名義</label>
                      <p className="font-medium">
                        {selectedPartner.bankInfo.accountName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 同期情報 */}
              <div className="mt-6 pt-6 border-t flex justify-between text-sm text-gray-500">
                <span>作成日: {selectedPartner.createdAt}</span>
                <span>最終同期: {selectedPartner.lastSyncedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
