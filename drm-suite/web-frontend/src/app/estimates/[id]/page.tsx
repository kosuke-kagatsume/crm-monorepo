'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Estimate } from '@/types/estimate-v2';

export default function EstimateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRAG, setShowRAG] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [params.id]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toUpperCase()) {
        case 'E':
          alert('出来高入力（TODO: 実装予定）'); // TODO: 出来高入力機能を実装
          break;
        case 'C':
          alert('変更工事起票（TODO: 実装予定）'); // TODO: 変更工事機能を実装
          break;
        case 'B':
          alert('請求案プレビュー（TODO: 実装予定）'); // TODO: 請求案プレビュー機能を実装
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchEstimate = async () => {
    try {
      const response = await fetch(`/api/estimates/${params.id}`);
      const data = await response.json();
      setEstimate(data);
    } catch (error) {
      console.error('Failed to fetch estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSubmit = async () => {
    try {
      const response = await fetch(
        `/api/estimates/${params.id}/submit-approval`,
        {
          method: 'POST',
        },
      );
      const data = await response.json();
      alert(`承認申請しました。ワークフローID: ${data.workflow?.id}`);
      fetchEstimate();
    } catch (error) {
      alert('承認申請に失敗しました');
    }
  };

  const handleContractExport = async (provider: 'gmo' | 'cloudsign') => {
    try {
      const response = await fetch(
        `/api/estimates/${params.id}/export-contract`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        },
      );
      const data = await response.json();
      alert(`契約書を作成しました。\\nURL: ${data.contract?.url}`);
      fetchEstimate();
    } catch (error) {
      alert('契約書作成に失敗しました');
    }
  };

  const handleStockBooking = async () => {
    if (!estimate) return;

    const version = estimate.versions.find(
      (v) => v.id === estimate.selectedVersionId,
    );
    if (!version) return;

    const stockItems = version.items
      .filter((item) => item.skuId)
      .map((item) => ({ skuId: item.skuId!, qty: item.qty }));

    if (stockItems.length === 0) {
      alert('在庫連携可能な項目がありません');
      return;
    }

    try {
      const response = await fetch(`/api/estimates/${params.id}/book-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: stockItems }),
      });
      const data = await response.json();

      if (data.status === 'complete') {
        alert('在庫予約が完了しました！');
      } else {
        alert(`在庫不足があります。不足数: ${data.summary?.totalShortage}`);
      }
    } catch (error) {
      alert('在庫予約に失敗しました');
    }
  };

  const handleCopyFromTemplate = () => {
    // TODO: テンプレートコピー機能を実装
    if (!estimate) return;

    // ダミーで1行追加
    const newItem = {
      id: Date.now().toString(),
      name: 'テンプレートから追加された項目',
      qty: 1,
      unit: '式',
      price: 100000,
      cost: 60000,
    };

    const updatedEstimate = {
      ...estimate,
      versions: estimate.versions.map((v) => {
        if (v.id === estimate.selectedVersionId) {
          return {
            ...v,
            items: [...v.items, newItem],
          };
        }
        return v;
      }),
    };

    setEstimate(updatedEstimate);
    alert('テンプレートから項目を追加しました');
    setShowCopyDialog(false);
  };

  const calculateTotal = (estimate: Estimate) => {
    const version = estimate.versions.find(
      (v) => v.id === estimate.selectedVersionId,
    );
    if (!version) return 0;
    return version.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">見積が見つかりません</p>
          <Button onClick={() => router.push('/estimates')} className="mt-4">
            一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  const currentVersion = estimate.versions.find(
    (v) => v.id === estimate.selectedVersionId,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/estimates')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 見積一覧
              </button>
              <h1 className="text-2xl font-bold text-gray-900">見積詳細</h1>
              {getStatusBadge(estimate.approval?.status)}
            </div>

            {/* ヘッダー右のアクション */}
            <div className="flex gap-2">
              {estimate.approval?.status === 'draft' && (
                <Button
                  onClick={handleApprovalSubmit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  承認申請
                </Button>
              )}
              {estimate.approval?.status === 'approved' &&
                !estimate.contract && (
                  <>
                    <Button
                      onClick={() => handleContractExport('gmo')}
                      variant="outline"
                    >
                      契約ドラフト（GMO）
                    </Button>
                    <Button
                      onClick={() => handleContractExport('cloudsign')}
                      variant="outline"
                    >
                      契約ドラフト（CloudSign）
                    </Button>
                  </>
                )}
              <Button onClick={handleStockBooking} variant="outline">
                在庫予約
              </Button>
              <Button onClick={() => setShowRAG(!showRAG)} variant="outline">
                RAG {showRAG ? '閉じる' : '開く'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">見積番号</label>
                    <p className="font-medium">{estimate.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">顧客ID</label>
                    <p className="font-medium">{estimate.customerId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">タイトル</label>
                    <p className="font-medium">{estimate.title}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">店舗</label>
                    <p className="font-medium">{estimate.storeId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">工法</label>
                    <p className="font-medium">{estimate.method}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">金額</label>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(calculateTotal(estimate))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 明細テーブル */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>明細</CardTitle>
                  <Button
                    onClick={() => setShowCopyDialog(true)}
                    size="sm"
                    variant="outline"
                  >
                    テンプレからコピー
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          品名
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                          仕様
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          数量
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                          単位
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          単価
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          金額
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          原価
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                          粗利率
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentVersion?.items.map((item) => {
                        const amount = item.qty * item.price;
                        const cost = item.qty * (item.cost || 0);
                        const margin =
                          amount > 0 ? ((amount - cost) / amount) * 100 : 0;

                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {item.attachments?.[0]?.name || '-'}
                            </td>
                            <td className="px-4 py-2 text-right">{item.qty}</td>
                            <td className="px-4 py-2 text-center">
                              {item.unit}
                            </td>
                            <td className="px-4 py-2 text-right">
                              ¥{item.price.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(amount)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {/* TODO: 権限マスク実装 */}
                              {formatCurrency(cost)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {/* TODO: 権限マスク実装 */}
                              <span
                                className={
                                  margin >= 30
                                    ? 'text-green-600'
                                    : margin >= 15
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                }
                              >
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-2 text-right font-medium"
                        >
                          合計
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          {formatCurrency(calculateTotal(estimate))}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* 承認パネル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">承認</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">ステータス</label>
                    <div className="mt-1">
                      {getStatusBadge(estimate.approval?.status)}
                    </div>
                  </div>
                  {/* TODO: 承認ワークフロー実装 */}
                  <div className="text-sm text-gray-500">
                    承認フロー：マネージャー → ディレクター
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 契約パネル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">契約</CardTitle>
              </CardHeader>
              <CardContent>
                {estimate.contract ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">状態</label>
                      <p className="font-medium">{estimate.contract.status}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">
                        プロバイダー
                      </label>
                      <p className="font-medium">
                        {estimate.contract.provider}
                      </p>
                    </div>
                    {estimate.contract.url && (
                      <div>
                        <a
                          href={estimate.contract.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          契約書を開く →
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">契約書未作成</p>
                )}
                {/* TODO: 契約連携実装 */}
              </CardContent>
            </Card>

            {/* 入金計画パネル */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">入金計画</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">着工金（30%）</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.floor(calculateTotal(estimate) * 0.3),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">中間金（40%）</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.floor(calculateTotal(estimate) * 0.4),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">最終金（30%）</span>
                    <span className="font-medium">
                      {formatCurrency(
                        Math.floor(calculateTotal(estimate) * 0.3),
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RAGパネル（プレースホルダ） */}
            {showRAG && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">RAGパネル</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {/* TODO: RAG機能実装 */}
                    関連見積・仕様テンプレの引用機能
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* テンプレからコピーダイアログ（簡易版） */}
        {showCopyDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                テンプレートから項目をコピー
              </h3>
              <div className="space-y-2 mb-4">
                <button
                  onClick={handleCopyFromTemplate}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  外壁塗装標準セット
                </button>
                <button
                  onClick={handleCopyFromTemplate}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  屋根修理標準セット
                </button>
                <button
                  onClick={handleCopyFromTemplate}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  キッチンリフォームセット
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowCopyDialog(false)}
                  variant="outline"
                >
                  キャンセル
                </Button>
                <Button onClick={handleCopyFromTemplate}>
                  選択した項目を追加
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
