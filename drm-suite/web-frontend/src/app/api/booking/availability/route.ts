import { NextResponse } from 'next/server';

// メモリDB（route.tsと共有）
// 実際の実装では、route.tsから共通のDB接続を使用
const getBookings = async () => {
  // ここでは簡易的に空配列を返す（実際はDBから取得）
  return [];
};

// POST: 空き枠確認
export async function POST(request: Request) {
  const body = await request.json();

  // バリデーション
  if (!body.type || !body.resourceId || !body.startTime || !body.endTime) {
    return NextResponse.json(
      { error: 'Required fields are missing' },
      { status: 400 },
    );
  }

  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);

  // 時間の妥当性チェック
  if (startTime >= endTime) {
    return NextResponse.json(
      { error: 'End time must be after start time' },
      { status: 400 },
    );
  }

  // 既存の予約を取得
  const bookings = await getBookings();

  // 重複する予約を検索
  const conflicts = bookings.filter((booking: any) => {
    if (booking.resourceId !== body.resourceId) return false;
    if (booking.status === 'cancelled') return false;
    // 自分自身は除外（更新時用）
    if (body.excludeId && booking.id === body.excludeId) return false;

    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);

    // 時間帯の重複をチェック
    return (
      (startTime >= existingStart && startTime < existingEnd) ||
      (endTime > existingStart && endTime <= existingEnd) ||
      (startTime <= existingStart && endTime >= existingEnd)
    );
  });

  // 利用可能な時間枠を計算
  const availableSlots = calculateAvailableSlots(
    body.resourceId,
    startTime,
    endTime,
    bookings,
  );

  return NextResponse.json({
    available: conflicts.length === 0,
    conflicts: conflicts.map((c: any) => ({
      id: c.id,
      customerName: c.customerName,
      staffName: c.staffName,
      startTime: c.startTime,
      endTime: c.endTime,
      status: c.status,
    })),
    alternativeSlots: availableSlots,
    message:
      conflicts.length > 0
        ? 'この時間帯は既に予約が入っています'
        : 'この時間帯は予約可能です',
  });
}

// 利用可能な時間枠を計算
function calculateAvailableSlots(
  resourceId: string,
  requestedStart: Date,
  requestedEnd: Date,
  bookings: any[],
): any[] {
  const slots = [];
  const duration = requestedEnd.getTime() - requestedStart.getTime();

  // 同じリソースの予約を時間順でソート
  const resourceBookings = bookings
    .filter((b: any) => b.resourceId === resourceId && b.status !== 'cancelled')
    .sort(
      (a: any, b: any) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // 営業時間（8:00-20:00）
  const dayStart = new Date(requestedStart);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(requestedStart);
  dayEnd.setHours(20, 0, 0, 0);

  // 前後1時間の範囲で代替スロットを探す
  const searchStart = new Date(requestedStart.getTime() - 60 * 60 * 1000);
  const searchEnd = new Date(requestedEnd.getTime() + 60 * 60 * 1000);

  let currentTime = Math.max(dayStart.getTime(), searchStart.getTime());

  for (const booking of resourceBookings) {
    const bookingStart = new Date(booking.startTime).getTime();
    const bookingEnd = new Date(booking.endTime).getTime();

    // 現在時刻から予約開始までの間に必要な時間があるか
    if (bookingStart - currentTime >= duration) {
      slots.push({
        startTime: new Date(currentTime).toISOString(),
        endTime: new Date(currentTime + duration).toISOString(),
        available: true,
      });
    }

    currentTime = Math.max(currentTime, bookingEnd);
  }

  // 最後の予約後から営業終了まで
  if (
    currentTime + duration <=
    Math.min(dayEnd.getTime(), searchEnd.getTime())
  ) {
    slots.push({
      startTime: new Date(currentTime).toISOString(),
      endTime: new Date(currentTime + duration).toISOString(),
      available: true,
    });
  }

  // 最大3つの代替案を返す
  return slots.slice(0, 3);
}
