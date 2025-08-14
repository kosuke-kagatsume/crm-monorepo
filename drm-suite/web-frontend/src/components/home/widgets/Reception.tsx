'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlag } from '@/config/featureFlags';
import Link from 'next/link';

interface Inquiry {
  id: string;
  type: 'phone' | 'web' | 'visit';
  customerName: string;
  content: string;
  status: 'new' | 'processing' | 'completed';
  receivedAt: string;
  estimateCreated?: boolean;
}

export function Reception() {
  const searchParams = useSearchParams();
  const newEstimateEnabled = useFeatureFlag('new_estimate', searchParams);
  const [inquiries] = useState<Inquiry[]>([
    {
      id: 'INQ-001',
      type: 'phone',
      customerName: '新規・佐藤様',
      content: '屋根の雨漏り修理の相談',
      status: 'new',
      receivedAt: '10:30',
      estimateCreated: false,
    },
    {
      id: 'INQ-002',
      type: 'web',
      customerName: '新規・高橋様',
      content: 'キッチンリフォームの見積依頼',
      status: 'processing',
      receivedAt: '09:15',
      estimateCreated: false,
    },
    {
      id: 'INQ-003',
      type: 'visit',
      customerName: '既存・山田様',
      content: '追加工事の相談',
      status: 'completed',
      receivedAt: '昨日',
      estimateCreated: true,
    },
  ]);

  const getTypeIcon = (type: Inquiry['type']) => {
    switch (type) {
      case 'phone':
        return '📞';
      case 'web':
        return '🌐';
      case 'visit':
        return '🏢';
    }
  };

  const getStatusBadge = (status: Inquiry['status']) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-red-100 text-red-800">新規</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">対応中</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">完了</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">📋 受付・問い合わせ</CardTitle>
          <Badge variant="outline" className="text-xs">
            本日: {inquiries.filter((i) => i.status === 'new').length}件
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getTypeIcon(inquiry.type)}</span>
                    <span className="font-medium text-sm">
                      {inquiry.customerName}
                    </span>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <p className="text-xs text-gray-600">{inquiry.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    受付: {inquiry.receivedAt}
                  </p>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex gap-2 mt-2">
                {!inquiry.estimateCreated &&
                  inquiry.status !== 'completed' &&
                  (newEstimateEnabled ? (
                    <Link
                      href={`/estimate/new?customer=${encodeURIComponent(inquiry.customerName)}&title=${encodeURIComponent(inquiry.content)}`}
                    >
                      <Button size="sm" variant="outline" className="text-xs">
                        📝 見積作成
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled
                    >
                      📝 見積作成（準備中）
                    </Button>
                  ))}
                {inquiry.estimateCreated && (
                  <Link href="/estimate">
                    <Button size="sm" variant="ghost" className="text-xs">
                      見積済
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" className="text-xs">
                  詳細
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* クイックアクション */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">
              未対応: {inquiries.filter((i) => i.status === 'new').length}件
            </span>
            <div className="flex gap-2">
              {newEstimateEnabled ? (
                <Link href="/estimate/new">
                  <Button size="sm" variant="outline" className="text-xs">
                    新規見積
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  disabled
                >
                  新規見積（準備中）
                </Button>
              )}
              <Button size="sm" className="text-xs">
                受付登録
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
