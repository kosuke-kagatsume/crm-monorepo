'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '../page';

interface BookingCalendarProps {
  bookings: Booking[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
}

export function BookingCalendar({
  bookings,
  selectedDate,
  onDateChange,
  onBookingClick,
}: BookingCalendarProps) {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // 週の開始日と終了日を計算
  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // 現在の週の日付配列を生成
  const weekDates = useMemo(() => {
    const dates = [];
    const { start } = getWeekRange(selectedDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }

    return dates;
  }, [selectedDate]);

  // 時間スロット（8:00-20:00）
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8);

  // 指定日時の予約を取得
  const getBookingsForSlot = (date: Date, hour: number) => {
    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour, 59, 59, 999);

      return (
        bookingStart.toDateString() === date.toDateString() &&
        bookingStart.getHours() <= hour &&
        bookingEnd.getHours() > hour
      );
    });
  };

  // 予約の色を取得
  const getBookingColor = (type: 'room' | 'vehicle') => {
    return type === 'room'
      ? 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900'
      : 'bg-green-100 hover:bg-green-200 border-green-300 text-green-900';
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  // 前週/次週への移動
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    onDateChange(newDate);
  };

  return (
    <div className="space-y-4">
      {/* コントロール */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>📅 予約カレンダー</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setViewMode('week')}
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
              >
                週表示
              </Button>
              <Button
                onClick={() => setViewMode('day')}
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
              >
                日表示
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => navigateWeek('prev')}
              variant="outline"
              size="sm"
            >
              ← 前週
            </Button>
            <div className="text-lg font-medium">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </div>
            <Button
              onClick={() => navigateWeek('next')}
              variant="outline"
              size="sm"
            >
              次週 →
            </Button>
          </div>

          {/* カレンダーグリッド */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* ヘッダー */}
              <div className="grid grid-cols-8 gap-0 border-b">
                <div className="p-2 text-center text-sm font-medium bg-gray-50">
                  時間
                </div>
                {(viewMode === 'week' ? weekDates : [selectedDate]).map(
                  (date, idx) => (
                    <div
                      key={idx}
                      className={`p-2 text-center text-sm font-medium border-l ${
                        date.toDateString() === new Date().toDateString()
                          ? 'bg-blue-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      {formatDate(date)}
                    </div>
                  ),
                )}
              </div>

              {/* タイムスロット */}
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-0 border-b">
                  <div className="p-2 text-center text-sm bg-gray-50">
                    {hour}:00
                  </div>
                  {(viewMode === 'week' ? weekDates : [selectedDate]).map(
                    (date, idx) => {
                      const slotBookings = getBookingsForSlot(date, hour);

                      return (
                        <div
                          key={idx}
                          className="p-1 border-l min-h-[60px] relative"
                        >
                          {slotBookings.map((booking, bookingIdx) => (
                            <div
                              key={booking.id}
                              className={`p-1 mb-1 rounded border cursor-pointer text-xs ${getBookingColor(
                                booking.type,
                              )}`}
                              onClick={() => onBookingClick?.(booking)}
                              style={{
                                position:
                                  bookingIdx > 0 ? 'absolute' : 'relative',
                                top:
                                  bookingIdx > 0
                                    ? `${bookingIdx * 25}px`
                                    : 'auto',
                                left: bookingIdx > 0 ? '4px' : 'auto',
                                right: bookingIdx > 0 ? '4px' : 'auto',
                                zIndex: bookingIdx,
                              }}
                            >
                              <div className="font-medium truncate">
                                {booking.type === 'room' ? '🏢' : '🚗'}{' '}
                                {booking.resourceName}
                              </div>
                              <div className="truncate">
                                {booking.customerName}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    },
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 凡例 */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>会議室予約</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>車両予約</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
