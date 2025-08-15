import { NextResponse } from 'next/server';

// メモリDB（実際の実装ではDBを使用）
let bookings: any[] = [];

// 初期データ
if (bookings.length === 0) {
  bookings = [
    {
      id: 'BOOK-001',
      type: 'room',
      resourceId: 'ROOM-001',
      resourceName: '商談室A',
      customerId: 'CUST-001',
      customerName: '山田太郎',
      staffId: 'STAFF-001',
      staffName: '営業 太郎',
      storeId: 'STORE-001',
      storeName: '東京本店',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      memo: '新規契約相談',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'BOOK-002',
      type: 'vehicle',
      resourceId: 'VEH-001',
      resourceName: 'プリウス（品川300あ1234）',
      customerId: 'CUST-002',
      customerName: '鈴木一郎',
      staffId: 'STAFF-002',
      staffName: '営業 花子',
      storeId: 'STORE-001',
      storeName: '東京本店',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      memo: '土地案内',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// GET: 予約一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const type = searchParams.get('type');
  const storeId = searchParams.get('storeId');

  let filteredBookings = [...bookings];

  // フィルタリング
  if (date) {
    const targetDate = new Date(date);
    filteredBookings = filteredBookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.toDateString() === targetDate.toDateString();
    });
  }

  if (type) {
    filteredBookings = filteredBookings.filter(
      (booking) => booking.type === type,
    );
  }

  if (storeId) {
    filteredBookings = filteredBookings.filter(
      (booking) => booking.storeId === storeId,
    );
  }

  // ソート（開始時刻順）
  filteredBookings.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return NextResponse.json({ bookings: filteredBookings });
}

// POST: 新規予約作成
export async function POST(request: Request) {
  const body = await request.json();

  // バリデーション
  if (
    !body.type ||
    !body.resourceId ||
    !body.customerId ||
    !body.startTime ||
    !body.endTime
  ) {
    return NextResponse.json(
      { error: 'Required fields are missing' },
      { status: 400 },
    );
  }

  // 時間の妥当性チェック
  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);

  if (startTime >= endTime) {
    return NextResponse.json(
      { error: 'End time must be after start time' },
      { status: 400 },
    );
  }

  // 先勝ちルールで重複チェック
  const conflicts = bookings.filter((booking) => {
    if (booking.resourceId !== body.resourceId) return false;
    if (booking.status === 'cancelled') return false;

    const existingStart = new Date(booking.startTime);
    const existingEnd = new Date(booking.endTime);

    // 時間帯の重複をチェック
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

  // 新規予約作成
  const newBooking = {
    id: `BOOK-${Date.now()}`,
    ...body,
    status: body.status || 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  bookings.push(newBooking);

  // localStorageに保存（ブラウザ側で永続化）
  if (typeof window !== 'undefined') {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }

  return NextResponse.json(newBooking, { status: 201 });
}
