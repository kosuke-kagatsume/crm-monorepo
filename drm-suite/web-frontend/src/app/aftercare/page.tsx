'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionList } from './_components/InspectionList';

export interface Inspection {
  id: string;
  projectId: string;
  projectName: string;
  customerId: string;
  customerName: string;
  address: string;
  inspectionType: '1M' | '6M' | '1Y' | '2Y' | '5Y' | '10Y' | 'custom';
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  completedDate?: string;
  inspector?: string;
  result?: {
    checkItems: Record<string, boolean>;
    notes: string;
    photos: string[];
    estimateRequired: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AftercarePage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'7days' | '30days' | 'overdue' | 'all'>(
    '30days',
  );
  const [reminderSettings, setReminderSettings] = useState({
    email: true,
    timing: ['1month', '1week', '1day'] as string[],
  });

  useEffect(() => {
    fetchInspections();
  }, [filter]);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/aftercare/inspections?filter=${filter}`,
      );
      const data = await response.json();
      setInspections(data.inspections || []);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInspection = async (id: string) => {
    router.push(`/aftercare/${id}`);
  };

  const handleInstantEstimate = async (inspection: Inspection) => {
    try {
      const response = await fetch(
        `/api/aftercare/inspections/${inspection.id}/instant-estimate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: inspection.customerId,
            projectId: inspection.projectId,
            templateType: 'aftercare',
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        // 見積作成画面へ遷移（顧客・案件がプリセット）
        router.push(
          `/estimates/create?customerId=${inspection.customerId}&projectId=${inspection.projectId}&title=${encodeURIComponent(inspection.projectName + ' - アフター点検後見積')}`,
        );
      }
    } catch (error) {
      console.error('Failed to create instant estimate:', error);
      alert('見積作成に失敗しました');
    }
  };

  const getFilteredInspections = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return inspections.filter((inspection) => {
      const scheduledDate = new Date(inspection.scheduledDate);
      const diffDays = Math.ceil(
        (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      switch (filter) {
        case '7days':
          return diffDays >= 0 && diffDays <= 7;
        case '30days':
          return diffDays >= 0 && diffDays <= 30;
        case 'overdue':
          return diffDays < 0 && inspection.status !== 'completed';
        case 'all':
        default:
          return true;
      }
    });
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '1M': '1ヶ月点検',
      '6M': '6ヶ月点検',
      '1Y': '1年点検',
      '2Y': '2年点検',
      '5Y': '5年点検',
      '10Y': '10年点検',
      custom: 'カスタム点検',
    };
    return labels[type] || type;
  };

  const stats = {
    total: inspections.length,
    scheduled: inspections.filter((i) => i.status === 'scheduled').length,
    completed: inspections.filter((i) => i.status === 'completed').length,
    overdue: inspections.filter((i) => i.status === 'overdue').length,
  };

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
                🔧 アフター管理
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  setReminderSettings({
                    ...reminderSettings,
                    email: !reminderSettings.email,
                  })
                }
                variant="outline"
                size="sm"
              >
                📧 リマインド設定
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                総点検数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">登録済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                予定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.scheduled}
              </div>
              <p className="text-xs text-gray-500 mt-1">実施待ち</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                完了
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <p className="text-xs text-gray-500 mt-1">実施済み</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                期限超過
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <p className="text-xs text-gray-500 mt-1">要対応</p>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('7days')}
                variant={filter === '7days' ? 'default' : 'outline'}
                size="sm"
              >
                今後7日
              </Button>
              <Button
                onClick={() => setFilter('30days')}
                variant={filter === '30days' ? 'default' : 'outline'}
                size="sm"
              >
                今後30日
              </Button>
              <Button
                onClick={() => setFilter('overdue')}
                variant={filter === 'overdue' ? 'default' : 'outline'}
                size="sm"
              >
                期限超過
              </Button>
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                すべて
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* リマインド設定（表示のみ） */}
        {reminderSettings.email && (
          <Card className="mb-6 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">📧</span>
                  <span className="text-sm font-medium">
                    メールリマインド設定
                  </span>
                </div>
                <div className="flex gap-2">
                  {['1ヶ月前', '1週間前', '前日'].map((timing, idx) => (
                    <Badge
                      key={timing}
                      className={
                        reminderSettings.timing.includes(
                          ['1month', '1week', '1day'][idx],
                        )
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    >
                      {timing}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 点検リスト */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <InspectionList
            inspections={getFilteredInspections()}
            onComplete={handleCompleteInspection}
            onInstantEstimate={handleInstantEstimate}
            getInspectionTypeLabel={getInspectionTypeLabel}
          />
        )}
      </main>
    </div>
  );
}
