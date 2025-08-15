'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProjectLedger {
  id: string;
  projectName: string;
  customerName: string;
  contractAmount: number;
  actualCost: number;
  progressRate: number;
  grossMargin: number;
  grossMarginRate: number;
  additionalAmount: number;
  collectedAmount: number;
  subcontractorPayable: number;
  retentionAmount: number;
  status: 'active' | 'completed' | 'delayed';
}

interface LedgerSummary {
  totalBudget: number;
  totalActualCost: number;
  averageProgressRate: number;
  expectedGrossMargin: number;
  additionalRatio: number;
  collectionRate: number;
  totalSubcontractorPayable: number;
  totalRetention: number;
  projects: ProjectLedger[];
}

export default function LedgerOverviewPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    fetchLedgerSummary();
  }, []);

  const fetchLedgerSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ledger/summary');
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch ledger summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    if (!summary) return;

    setExportingCsv(true);
    try {
      // CSVデータを生成
      const headers = [
        'プロジェクト名',
        '顧客名',
        '契約金額',
        '実際原価',
        '進捗率',
        '粗利',
        '粗利率',
        '追加減額',
        '回収金額',
        '協力会社未払高',
        '保留金',
        'ステータス',
      ];

      const rows = summary.projects.map((project) => [
        project.projectName,
        project.customerName,
        project.contractAmount,
        project.actualCost,
        `${project.progressRate}%`,
        project.grossMargin,
        `${project.grossMarginRate}%`,
        project.additionalAmount,
        project.collectedAmount,
        project.subcontractorPayable,
        project.retentionAmount,
        project.status === 'active'
          ? '進行中'
          : project.status === 'completed'
            ? '完了'
            : '遅延',
      ]);

      // BOM付きCSV生成
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const blob = new Blob([bom, csvContent], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);

      // ダウンロード
      const a = document.createElement('a');
      a.href = url;
      a.download = `工事台帳_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('CSVエクスポートが完了しました');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('CSVエクスポートに失敗しました');
    } finally {
      setExportingCsv(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '進行中', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '完了', className: 'bg-green-100 text-green-800' },
      delayed: { label: '遅延', className: 'bg-red-100 text-red-800' },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
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

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">台帳データが見つかりません</p>
          <Button onClick={() => router.push('/home')} className="mt-4">
            ホームに戻る
          </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">
                📑 工事台帳サマリー
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportCsv}
                variant="outline"
                disabled={exportingCsv}
              >
                {exportingCsv
                  ? 'エクスポート中...'
                  : '📊 会計エクスポート（CSV）'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パネル表示 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                予算対比原価
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {(
                  (summary.totalActualCost / summary.totalBudget) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(summary.totalActualCost)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                進捗率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {summary.averageProgressRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">平均進捗</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                見込粗利
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(summary.expectedGrossMargin)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(
                  (summary.expectedGrossMargin / summary.totalBudget) *
                  100
                ).toFixed(1)}
                %
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                追加減額比率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {summary.additionalRatio > 0 ? '+' : ''}
                {summary.additionalRatio.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">契約変更</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                回収状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {summary.collectionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">回収率</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">
                協力会社未払高
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(summary.totalSubcontractorPayable)}
              </div>
              <p className="text-xs text-gray-500 mt-1">未払合計</p>
            </CardContent>
          </Card>
        </div>

        {/* 保留金情報 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">保留金状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">総保留金額</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(summary.totalRetention)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">解放予定</p>
                <p className="text-lg font-medium mt-1">
                  今月: {formatCurrency(summary.totalRetention * 0.15)}
                </p>
                <p className="text-sm text-gray-500">
                  来月: {formatCurrency(summary.totalRetention * 0.25)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* プロジェクト一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プロジェクト別台帳</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>プロジェクト</TableHead>
                    <TableHead>顧客</TableHead>
                    <TableHead className="text-right">契約金額</TableHead>
                    <TableHead className="text-right">原価</TableHead>
                    <TableHead className="text-center">進捗</TableHead>
                    <TableHead className="text-right">粗利</TableHead>
                    <TableHead className="text-center">粗利率</TableHead>
                    <TableHead className="text-right">回収済</TableHead>
                    <TableHead className="text-center">ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.projectName}
                      </TableCell>
                      <TableCell>{project.customerName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(project.contractAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(project.actualCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progressRate}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {project.progressRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            project.grossMargin >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {formatCurrency(project.grossMargin)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            project.grossMarginRate >= 20
                              ? 'text-green-600'
                              : project.grossMarginRate >= 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }
                        >
                          {project.grossMarginRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(project.collectedAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(project.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* TODOコメント */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            🚧 TODO: swap with real service - 現在はモックAPIを使用しています。
            将来的にDandoriWorks/会計システムのAPIと統合予定です。
          </p>
        </div>
      </main>
    </div>
  );
}
