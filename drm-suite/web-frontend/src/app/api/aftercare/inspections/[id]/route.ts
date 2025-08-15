import { NextRequest, NextResponse } from 'next/server';

// メモリDBのデータをインポート（実際はDBから取得）
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const inspection = inspections.find((i) => i.id === params.id);

    if (!inspection) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspection' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const index = inspections.findIndex((i) => i.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 },
      );
    }

    // 点検を更新
    inspections[index] = {
      ...inspections[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(inspections[index]);
  } catch (error) {
    console.error('Error updating inspection:', error);
    return NextResponse.json(
      { error: 'Failed to update inspection' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const index = inspections.findIndex((i) => i.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 },
      );
    }

    inspections.splice(index, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json(
      { error: 'Failed to delete inspection' },
      { status: 500 },
    );
  }
}
