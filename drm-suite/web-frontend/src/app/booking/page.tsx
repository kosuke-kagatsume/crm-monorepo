'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingCalendar } from './_components/BookingCalendar';

export interface Booking {
  id: string;
  type: 'room' | 'vehicle';
  resourceId: string;
  resourceName: string;
  customerId: string;
  customerName: string;
  staffId: string;
  staffName: string;
  storeId: string;
  storeName: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<'all' | 'room' | 'vehicle'>(
    'all',
  );
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/booking');
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return;

    try {
      const response = await fetch(`/api/booking/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBookings();
      }
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filterType === 'all') return true;
    return booking.type === filterType;
  });

  const getTypeColor = (type: 'room' | 'vehicle') => {
    return type === 'room'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 統計情報の計算
  const stats = {
    total: bookings.length,
    room: bookings.filter((b) => b.type === 'room').length,
    vehicle: bookings.filter((b) => b.type === 'vehicle').length,
    today: bookings.filter((b) => {
      const bookingDate = new Date(b.startTime);
      const today = new Date();
      return bookingDate.toDateString() === today.toDateString();
    }).length,
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
                🗓️ 会議室・車両予約
              </h1>
            </div>
            <Button
              onClick={() => router.push('/booking/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + 新規予約
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                総予約数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">全期間</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                会議室予約
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.room}
              </div>
              <p className="text-xs text-gray-500 mt-1">商談室・応接室</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                車両予約
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.vehicle}
              </div>
              <p className="text-xs text-gray-500 mt-1">社用車</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                本日の予約
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.today}
              </div>
              <p className="text-xs text-gray-500 mt-1">今日</p>
            </CardContent>
          </Card>
        </div>

        {/* ビュー切り替えとフィルター */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setView('calendar')}
              variant={view === 'calendar' ? 'default' : 'outline'}
              size="sm"
            >
              📅 カレンダー
            </Button>
            <Button
              onClick={() => setView('list')}
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
            >
              📋 リスト
            </Button>
          </div>

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">すべて</option>
              <option value="room">会議室のみ</option>
              <option value="vehicle">車両のみ</option>
            </select>
          </div>
        </div>

        {/* コンテンツ表示 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : view === 'calendar' ? (
          <BookingCalendar
            bookings={filteredBookings}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onBookingClick={(booking) => {
              // 予約詳細表示や編集画面への遷移
              console.log('Booking clicked:', booking);
            }}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        タイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        リソース
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        顧客
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        担当者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Badge className={getTypeColor(booking.type)}>
                            {booking.type === 'room' ? '会議室' : '車両'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {booking.resourceName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.storeName}
                          </div>
                        </td>
                        <td className="px-6 py-4">{booking.customerName}</td>
                        <td className="px-6 py-4">{booking.staffName}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div>{formatDateTime(booking.startTime)}</div>
                            <div className="text-gray-500">
                              〜 {formatDateTime(booking.endTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status === 'confirmed'
                              ? '確定'
                              : booking.status === 'pending'
                                ? '仮予約'
                                : 'キャンセル'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => handleDeleteBooking(booking.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            キャンセル
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredBookings.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">予約がありません</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
