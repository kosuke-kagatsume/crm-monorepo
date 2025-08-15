import { NextResponse } from 'next/server';

// メモリDB（route.tsと共有）
let bookings: any[] = [];

// GET: 個別予約取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  // メモリDBから取得（実際はDBから取得）
  const booking = bookings.find((b) => b.id === params.id);

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json(booking);
}

// DELETE: 予約キャンセル
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const bookingIndex = bookings.findIndex((b) => b.id === params.id);

  if (bookingIndex === -1) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // ステータスをキャンセルに変更（物理削除せず論理削除）
  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Booking cancelled successfully',
    booking: bookings[bookingIndex],
  });
}

// PATCH: 予約更新
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json();
  const bookingIndex = bookings.findIndex((b) => b.id === params.id);

  if (bookingIndex === -1) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // 時間変更の場合は重複チェック
  if (body.startTime || body.endTime) {
    const startTime = new Date(
      body.startTime || bookings[bookingIndex].startTime,
    );
    const endTime = new Date(body.endTime || bookings[bookingIndex].endTime);

    const conflicts = bookings.filter((booking, idx) => {
      if (idx === bookingIndex) return false; // 自分自身は除外
      if (
        booking.resourceId !==
        (body.resourceId || bookings[bookingIndex].resourceId)
      )
        return false;
      if (booking.status === 'cancelled') return false;

      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(booking.endTime);

      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      );
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: 'Resource is already booked for this time slot',
          conflicts: conflicts.map((c) => ({
            id: c.id,
            customerName: c.customerName,
            startTime: c.startTime,
            endTime: c.endTime,
          })),
        },
        { status: 409 },
      );
    }
  }

  // 更新
  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(bookings[bookingIndex]);
}
