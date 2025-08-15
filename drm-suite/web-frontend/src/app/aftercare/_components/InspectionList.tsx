'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Inspection } from '../page';

interface InspectionListProps {
  inspections: Inspection[];
  onComplete: (id: string) => void;
  onInstantEstimate: (inspection: Inspection) => void;
  getInspectionTypeLabel: (type: string) => string;
}

export function InspectionList({
  inspections,
  onComplete,
  onInstantEstimate,
  getInspectionTypeLabel,
}: InspectionListProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: '予定', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '完了', className: 'bg-green-100 text-green-800' },
      overdue: { label: '期限超過', className: 'bg-red-100 text-red-800' },
      cancelled: {
        label: 'キャンセル',
        className: 'bg-gray-100 text-gray-800',
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    const formattedDate = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    if (diffDays === 0) return `${formattedDate} (本日)`;
    if (diffDays === 1) return `${formattedDate} (明日)`;
    if (diffDays === -1) return `${formattedDate} (昨日)`;
    if (diffDays > 0) return `${formattedDate} (${diffDays}日後)`;
    return `${formattedDate} (${Math.abs(diffDays)}日前)`;
  };

  if (inspections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg font-medium mb-2">点検予定がありません</p>
            <p className="text-sm">選択された期間内に点検予定はありません</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {inspections.map((inspection) => (
        <Card key={inspection.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {inspection.customerName}
                  </CardTitle>
                  {getStatusBadge(inspection.status)}
                  <Badge variant="outline">
                    {getInspectionTypeLabel(inspection.inspectionType)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {inspection.projectName}
                </p>
                <p className="text-xs text-gray-500">{inspection.address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(inspection.scheduledDate)}
                </p>
                {inspection.inspector && (
                  <p className="text-xs text-gray-500 mt-1">
                    担当: {inspection.inspector}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500">案件ID:</span>
                  <span className="ml-1 font-medium">
                    {inspection.projectId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">顧客ID:</span>
                  <span className="ml-1 font-medium">
                    {inspection.customerId}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {inspection.status === 'completed' &&
                  inspection.result?.estimateRequired && (
                    <Button
                      onClick={() => onInstantEstimate(inspection)}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      💡 即時見積
                    </Button>
                  )}
                {inspection.status !== 'completed' &&
                  inspection.status !== 'cancelled' && (
                    <Button
                      onClick={() => onComplete(inspection.id)}
                      variant="default"
                      size="sm"
                    >
                      ✅ 点検実施
                    </Button>
                  )}
                {inspection.status === 'completed' && (
                  <Button
                    onClick={() => onComplete(inspection.id)}
                    variant="outline"
                    size="sm"
                  >
                    📋 詳細確認
                  </Button>
                )}
              </div>
            </div>

            {inspection.result && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">完了日:</span>
                    <span className="ml-1 font-medium">
                      {inspection.completedDate
                        ? formatDate(inspection.completedDate)
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">チェック項目:</span>
                    <span className="ml-1 font-medium">
                      {Object.keys(inspection.result.checkItems).length}項目
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">写真:</span>
                    <span className="ml-1 font-medium">
                      {inspection.result.photos.length}枚
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">見積必要:</span>
                    <span className="ml-1 font-medium">
                      {inspection.result.estimateRequired ? '要' : '不要'}
                    </span>
                  </div>
                </div>
                {inspection.result.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">所見:</span>{' '}
                      {inspection.result.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
