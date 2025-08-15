'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingForm } from '../_components/BookingForm';

function CreateBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータから初期値を取得（事務ダッシュボードからの遷移時）
  const presetType = searchParams.get('type') as 'room' | 'vehicle' | null;
  const presetCustomerId = searchParams.get('customerId');
  const presetPurpose = searchParams.get('purpose');
  const presetStoreId = searchParams.get('storeId');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (bookingData: any) => {
    setLoading(true);
    try {
      // 空き枠チェック
      const availabilityResponse = await fetch('/api/booking/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: bookingData.type,
          resourceId: bookingData.resourceId,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
        }),
      });

      const availability = await availabilityResponse.json();

      if (!availability.available) {
        alert(
          `この時間帯は既に予約が入っています。\n\n衝突する予約:\n${availability.conflicts
            .map(
              (c: any) =>
                `・${c.customerName} (${new Date(c.startTime).toLocaleTimeString('ja-JP')} - ${new Date(c.endTime).toLocaleTimeString('ja-JP')})`,
            )
            .join('\n')}`,
        );
        setLoading(false);
        return;
      }

      // 予約作成
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      alert('予約を作成しました！');
      router.push('/booking');
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('予約の作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('入力内容は保存されません。よろしいですか？')) {
      router.push('/booking');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/booking')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 予約一覧
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新規予約作成</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* プリセット情報の表示 */}
        {(presetType || presetPurpose) && (
          <Card className="mb-6 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800">
                🔗 事務ダッシュボードからの予約
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {presetType && (
                  <div>
                    <span className="text-gray-600">予約タイプ:</span>
                    <span className="ml-2 font-medium">
                      {presetType === 'room' ? '商談室' : '車両'}
                    </span>
                  </div>
                )}
                {presetPurpose && (
                  <div>
                    <span className="text-gray-600">目的:</span>
                    <span className="ml-2 font-medium">{presetPurpose}</span>
                  </div>
                )}
                {presetCustomerId && (
                  <div>
                    <span className="text-gray-600">顧客ID:</span>
                    <span className="ml-2 font-medium">{presetCustomerId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>予約情報を入力</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm
              initialData={{
                type: presetType || 'room',
                customerId: presetCustomerId || '',
                storeId: presetStoreId || '',
                memo: presetPurpose || '',
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CreateBookingPage() {
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
      <CreateBookingContent />
    </Suspense>
  );
}
