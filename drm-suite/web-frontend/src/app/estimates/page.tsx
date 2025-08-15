'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { estimateClient } from '@/lib/api/estimateClient';
import { Estimate } from '@/types/estimate-v2';
import { CopyFromTemplateDialog } from '@/components/estimate/CopyFromTemplateDialog';
import { useFeatureFlag, isFlagOn } from '@/config/featureFlags';
import { FlagDebugger } from '@/components/common/FeatureFlag';
import { useHomeShortcuts } from '@/components/home/useHomeShortcuts';
import type { Role } from '@/config/roleDashboard';
import { roleMapping } from '@/config/roleDashboard';

function EstimateListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  // 新形式のフラグチェック
  const newEstimateEnabled = isFlagOn('new_estimate');
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState({
    search: '',
    storeId: 'all',
    assignee: 'all',
    category: 'all',
    amountRange: 'all',
    method: 'all',
    structure: 'all',
    reformArea: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchEstimates();
  }, [projectId]);

  // 役職の取得
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole && roleMapping[userRole]) {
      setRole(roleMapping[userRole]);
    } else {
      setRole('mgmt');
    }
  }, []);

  // 見積画面用のキーボードショートカット
  const shortcutsForRole: Record<Role, any> = {
    mgmt: {
      H: () => router.push('/home'),
      N: () => router.push('/estimates/new'),
    },
    branch: {
      H: () => router.push('/home'),
      N: () => router.push('/estimates/new'),
    },
    sales: {
      H: () => router.push('/home'),
      N: () => router.push('/estimates/new'),
    },
    accounting: {
      H: () => router.push('/home'),
    },
    marketing: {
      H: () => router.push('/home'),
    },
    foreman: {
      H: () => router.push('/home'),
    },
    clerk: {
      H: () => router.push('/home'),
    },
    aftercare: {
      H: () => router.push('/home'),
    },
  };

  // 役職別ショートカットを適用
  useHomeShortcuts(role ? (shortcutsForRole[role] ?? {}) : {}, {
    enabled: true,
  });

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      // projectIdがある場合はフィルタリング
      const url = projectId
        ? `/api/estimates?projectId=${projectId}`
        : '/api/estimates';
      const response = await fetch(url);
      const data = await response.json();
      setEstimates(data.estimates || []);
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (estimate: Estimate) => {
    const version = estimate.versions.find(
      (v) => v.id === estimate.selectedVersionId,
    );
    if (!version) return 0;
    return version.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  const getStatusBadge = (estimate: Estimate) => {
    if (!estimate.approval) {
      return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>;
    }
    switch (estimate.approval.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">承認済み</Badge>;
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">承認待ち</Badge>
        );
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">却下</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>;
    }
  };

  const getContractBadge = (estimate: Estimate) => {
    if (!estimate.contract) return null;
    switch (estimate.contract.status) {
      case 'signed':
        return <Badge className="bg-blue-100 text-blue-800">契約締結</Badge>;
      case 'sent':
        return (
          <Badge className="bg-purple-100 text-purple-800">送信済み</Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800">契約書作成中</Badge>
        );
    }
  };

  const handleTemplateSelect = async (template: any) => {
    // テンプレートから見積作成
    try {
      const response = await fetch('/api/estimates/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          customerId: 'CUST-NEW', // 実際には顧客選択画面を表示
        }),
      });
      const data = await response.json();
      router.push(`/estimates/${data.estimate.id}`);
    } catch (error) {
      console.error('Failed to create from template:', error);
    }
  };

  const filteredEstimates = estimates.filter((est) => {
    if (
      filters.search &&
      !est.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.status !== 'all' && est.approval?.status !== filters.status) {
      return false;
    }
    if (filters.category !== 'all' && est.category !== filters.category) {
      return false;
    }
    if (filters.method !== 'all' && est.method !== filters.method) {
      return false;
    }
    if (filters.structure !== 'all' && est.structure !== filters.structure) {
      return false;
    }
    if (filters.storeId !== 'all' && est.storeId !== filters.storeId) {
      return false;
    }

    // 金額帯フィルター
    if (filters.amountRange !== 'all') {
      const total = calculateTotal(est);
      switch (filters.amountRange) {
        case 'under1m':
          if (total >= 1000000) return false;
          break;
        case '1m-5m':
          if (total < 1000000 || total >= 5000000) return false;
          break;
        case '5m-10m':
          if (total < 5000000 || total >= 10000000) return false;
          break;
        case 'over10m':
          if (total < 10000000) return false;
          break;
      }
    }

    return true;
  });

  // Feature Flag が無効な場合のフォールバック画面
  if (!newEstimateEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              新見積システム
            </h1>
            <p className="text-gray-600 mb-6">
              この機能は段階的公開中です。
              <br />
              以下のURLで利用可能です：
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-6">
              <code className="text-sm text-blue-600">?ff:new_estimate=on</code>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('ff:new_estimate', 'on');
                  window.location.href = url.toString();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                新見積システムを試す
              </Button>
              <Button
                onClick={() => router.push('/estimates')}
                variant="outline"
                className="w-full"
              >
                従来の見積一覧に戻る
              </Button>
            </div>
            <div className="mt-6 pt-6 border-t">
              <FlagDebugger flag="new_estimate" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/home')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← ホーム
              </button>
              <h1 className="text-2xl font-bold text-gray-900">見積管理</h1>
              {process.env.NODE_ENV === 'development' && (
                <FlagDebugger flag="new_estimate" />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowTemplateDialog(true)}
                variant="outline"
              >
                📋 テンプレから作成
              </Button>
              {newEstimateEnabled && (
                <Button onClick={() => router.push('/estimates/new')}>
                  + 新規作成
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 案件フィルター表示 */}
        {projectId && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-blue-800">
                🔍 案件ID: {projectId} に関連する見積を表示中
              </span>
            </div>
            <Button
              onClick={() => router.push('/estimates')}
              size="sm"
              variant="outline"
            >
              すべて表示
            </Button>
          </div>
        )}

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                総件数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimates.length}</div>
              <p className="text-xs text-gray-500 mt-1">今月 +12件</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                総額
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥
                {estimates
                  .reduce((sum, e) => sum + calculateTotal(e), 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">前月比 +18%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                承認待ち
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {
                  estimates.filter((e) => e.approval?.status === 'pending')
                    .length
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">要対応</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                平均額
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥
                {estimates.length > 0
                  ? Math.floor(
                      estimates.reduce((sum, e) => sum + calculateTotal(e), 0) /
                        estimates.length,
                    ).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">案件単価</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="見積名で検索..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />

              <select
                value={filters.storeId}
                onChange={(e) =>
                  setFilters({ ...filters, storeId: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全店舗</option>
                <option value="STORE-001">東京本店</option>
                <option value="STORE-002">大阪支店</option>
                <option value="STORE-003">名古屋支店</option>
              </select>

              <select
                value={filters.assignee}
                onChange={(e) =>
                  setFilters({ ...filters, assignee: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全担当者</option>
                <option value="USER-001">山田太郎</option>
                <option value="USER-002">鈴木一郎</option>
                <option value="USER-003">佐藤花子</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全物件種別</option>
                <option value="戸建住宅">戸建住宅</option>
                <option value="マンション">マンション</option>
                <option value="リフォーム">リフォーム</option>
                <option value="商業施設">商業施設</option>
              </select>

              <select
                value={filters.amountRange}
                onChange={(e) =>
                  setFilters({ ...filters, amountRange: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全金額帯</option>
                <option value="under1m">100万円未満</option>
                <option value="1m-5m">100-500万円</option>
                <option value="5m-10m">500-1000万円</option>
                <option value="over10m">1000万円以上</option>
              </select>

              <select
                value={filters.method}
                onChange={(e) =>
                  setFilters({ ...filters, method: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全工法</option>
                <option value="シリコン塗装">シリコン塗装</option>
                <option value="フッ素塗装">フッ素塗装</option>
                <option value="瓦交換">瓦交換</option>
                <option value="システムキッチン交換">
                  システムキッチン交換
                </option>
              </select>

              <select
                value={filters.structure}
                onChange={(e) =>
                  setFilters({ ...filters, structure: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全構造</option>
                <option value="木造2階建て">木造2階建て</option>
                <option value="木造平屋">木造平屋</option>
                <option value="鉄骨造">鉄骨造</option>
                <option value="RC造">RC造</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">全ステータス</option>
                <option value="draft">下書き</option>
                <option value="pending">承認待ち</option>
                <option value="approved">承認済み</option>
                <option value="rejected">却下</option>
              </select>
            </div>

            {/* リフォーム箇所（リフォーム選択時のみ表示） */}
            {filters.category === 'リフォーム' && (
              <div className="mt-4">
                <select
                  value={filters.reformArea}
                  onChange={(e) =>
                    setFilters({ ...filters, reformArea: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="all">全リフォーム箇所</option>
                  <option value="キッチン">キッチン</option>
                  <option value="バスルーム">バスルーム</option>
                  <option value="トイレ">トイレ</option>
                  <option value="外壁">外壁</option>
                  <option value="屋根">屋根</option>
                  <option value="全面">全面リフォーム</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 見積一覧 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        見積名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        顧客ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        店舗
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        金額
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        契約
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        作成日
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEstimates.map((estimate) => (
                      <tr key={estimate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{estimate.title}</div>
                            <div className="text-sm text-gray-500">
                              {estimate.method} / {estimate.structure}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{estimate.customerId}</td>
                        <td className="px-6 py-4">{estimate.storeId}</td>
                        <td className="px-6 py-4 font-medium">
                          ¥{calculateTotal(estimate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(estimate)}
                        </td>
                        <td className="px-6 py-4">
                          {getContractBadge(estimate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(estimate.createdAt).toLocaleDateString(
                            'ja-JP',
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/estimates/${estimate.id}`)
                              }
                            >
                              詳細
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/estimates/${estimate.id}?tab=edit`,
                                )
                              }
                            >
                              編集
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* テンプレート選択ダイアログ */}
      <CopyFromTemplateDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

export default function EstimateListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <EstimateListContent />
    </Suspense>
  );
}
