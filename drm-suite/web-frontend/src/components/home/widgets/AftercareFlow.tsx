'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UpcomingInspection {
  id: string;
  customerName: string;
  inspectionType: string;
  scheduledDate: string;
  daysUntil: number;
}

export function AftercareFlow() {
  const router = useRouter();
  const [upcomingInspections, setUpcomingInspections] = useState<
    UpcomingInspection[]
  >([]);
  const [stats, setStats] = useState({
    thisWeek: 0,
    overdue: 0,
    pendingEstimates: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 今後7日間の点検を取得
      const response = await fetch('/api/aftercare/inspections?filter=7days');
      const data = await response.json();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const upcoming =
        data.inspections?.slice(0, 3).map((inspection: any) => {
          const scheduledDate = new Date(inspection.scheduledDate);
          const daysUntil = Math.ceil(
            (scheduledDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 1000),
          );

          return {
            id: inspection.id,
            customerName: inspection.customerName,
            inspectionType: getInspectionTypeLabel(inspection.inspectionType),
            scheduledDate: inspection.scheduledDate,
            daysUntil,
          };
        }) || [];

      setUpcomingInspections(upcoming);

      // 統計情報（スタブ）
      setStats({
        thisWeek: upcoming.length,
        overdue: 2,
        pendingEstimates: 3,
      });
    } catch (error) {
      console.error('Failed to fetch aftercare data:', error);
    }
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '1M': '1ヶ月',
      '6M': '6ヶ月',
      '1Y': '1年',
      '2Y': '2年',
      '5Y': '5年',
      '10Y': '10年',
      custom: 'カスタム',
    };
    return labels[type] || type;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            🔧 アフターケアフロー
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/aftercare')}
          >
            管理画面へ →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 統計サマリー */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {stats.thisWeek}
            </div>
            <div className="text-xs text-gray-600">今週の点検</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
            <div className="text-xs text-gray-600">期限超過</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingEstimates}
            </div>
            <div className="text-xs text-gray-600">見積待ち</div>
          </div>
        </div>

        {/* 直近の点検予定 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            直近の点検予定
          </h3>
          <div className="space-y-2">
            {upcomingInspections.length > 0 ? (
              upcomingInspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/aftercare/${inspection.id}`)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {inspection.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inspection.inspectionType}点検
                    </div>
                  </div>
                  <Badge
                    variant={
                      inspection.daysUntil <= 1
                        ? 'destructive'
                        : inspection.daysUntil <= 3
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {inspection.daysUntil === 0
                      ? '本日'
                      : inspection.daysUntil === 1
                        ? '明日'
                        : `${inspection.daysUntil}日後`}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                今週の点検予定はありません
              </div>
            )}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => router.push('/aftercare')}
          >
            🗓 点検スケジュール
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => router.push('/estimates/create?template=aftercare')}
          >
            💡 即時見積
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
