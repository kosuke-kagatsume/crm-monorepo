'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ClerkActions() {
  const router = useRouter();

  const handleVisitorBooking = () => {
    // 来店受付 → 商談室自動割当
    router.push('/booking/create?type=room&purpose=来店受付&storeId=STORE-001');
  };

  const handleLandTourBooking = () => {
    // 土地案内 → 車両自動割当
    router.push(
      '/booking/create?type=vehicle&purpose=土地案内&storeId=STORE-001',
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">🗓️ 予約管理</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">事務専用</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">ワンクリックで予約を作成</p>

          {/* 来店受付ボタン */}
          <Button
            onClick={handleVisitorBooking}
            className="w-full justify-start bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">🏢</span>
            来店受付 → 商談室割当
          </Button>

          {/* 土地案内ボタン */}
          <Button
            onClick={handleLandTourBooking}
            className="w-full justify-start bg-green-600 hover:bg-green-700"
          >
            <span className="mr-2">🚗</span>
            土地案内 → 車両割当
          </Button>

          {/* 予約一覧へのリンク */}
          <Button
            onClick={() => router.push('/booking')}
            variant="outline"
            className="w-full justify-start"
          >
            <span className="mr-2">📅</span>
            予約カレンダーを見る
          </Button>

          {/* 台帳サマリーへのリンク */}
          <Button
            onClick={() => router.push('/ledger/overview')}
            variant="secondary"
            className="w-full justify-start"
          >
            <span className="mr-2">📑</span>
            台帳サマリーへ
          </Button>
        </div>

        <div className="pt-3 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>本日の予約</span>
            <span className="font-medium text-blue-600">3件</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>空き商談室</span>
            <span className="font-medium text-green-600">2室</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>利用可能車両</span>
            <span className="font-medium text-green-600">3台</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
