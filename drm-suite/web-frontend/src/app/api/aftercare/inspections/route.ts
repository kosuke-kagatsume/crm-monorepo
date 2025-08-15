import { NextRequest, NextResponse } from 'next/server';

// メモリDB（開発用）
let inspections = [
  {
    id: 'INSP-001',
    projectId: 'PRJ-2023-001',
    projectName: '田中様邸 外壁塗装工事',
    customerId: 'CUST-001',
    customerName: '田中 太郎',
    address: '東京都世田谷区〇〇1-2-3',
    inspectionType: '1Y',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INSP-002',
    projectId: 'PRJ-2023-002',
    projectName: '佐藤様邸 屋根・外壁塗装',
    customerId: 'CUST-002',
    customerName: '佐藤 花子',
    address: '東京都杉並区△△2-3-4',
    inspectionType: '6M',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INSP-003',
    projectId: 'PRJ-2023-003',
    projectName: '鈴木様邸 防水工事',
    customerId: 'CUST-003',
    customerName: '鈴木 一郎',
    address: '東京都練馬区□□3-4-5',
    inspectionType: '2Y',
    scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'overdue',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INSP-004',
    projectId: 'PRJ-2023-004',
    projectName: '高橋様邸 外壁リフォーム',
    customerId: 'CUST-004',
    customerName: '高橋 次郎',
    address: '東京都目黒区◇◇4-5-6',
    inspectionType: '1Y',
    scheduledDate: new Date(
      Date.now() + 15 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INSP-005',
    projectId: 'PRJ-2023-005',
    projectName: '伊藤様邸 総合リフォーム',
    customerId: 'CUST-005',
    customerName: '伊藤 美咲',
    address: '東京都大田区☆☆5-6-7',
    inspectionType: '5Y',
    scheduledDate: new Date(
      Date.now() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    status: 'completed',
    completedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    inspector: '山田 技術員',
    result: {
      checkItems: {
        structure_foundation: true,
        structure_walls: true,
        structure_roof: false,
        leak_ceiling: true,
        leak_walls: true,
        equipment_gutter: false,
      },
      notes: '屋根材の一部に劣化が見られます。雨樋の清掃が必要です。',
      photos: ['photo1.jpg', 'photo2.jpg'],
      estimateRequired: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let filteredInspections = [...inspections];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter !== 'all') {
      filteredInspections = inspections.filter((inspection) => {
        const scheduledDate = new Date(inspection.scheduledDate);
        const diffDays = Math.ceil(
          (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        switch (filter) {
          case '7days':
            return (
              diffDays >= 0 &&
              diffDays <= 7 &&
              inspection.status !== 'completed'
            );
          case '30days':
            return (
              diffDays >= 0 &&
              diffDays <= 30 &&
              inspection.status !== 'completed'
            );
          case 'overdue':
            return inspection.status === 'overdue';
          default:
            return true;
        }
      });
    }

    // 日付順でソート
    filteredInspections.sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

    return NextResponse.json({ inspections: filteredInspections });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newInspection = {
      id: `INSP-${Date.now()}`,
      ...body,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inspections.push(newInspection);

    return NextResponse.json(newInspection, { status: 201 });
  } catch (error) {
    console.error('Error creating inspection:', error);
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 },
    );
  }
}
