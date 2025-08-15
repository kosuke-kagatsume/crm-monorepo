import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { customerId, projectId, templateType } = body;

    // スタブ: アフター点検用の見積テンプレートを作成
    const estimateTemplate = {
      id: `EST-AFTER-${Date.now()}`,
      templateType: 'aftercare',
      customerId,
      projectId,
      inspectionId: params.id,
      title: 'アフター点検後 補修見積',
      items: [
        {
          category: '屋根補修',
          items: [
            {
              name: '屋根材補修',
              quantity: 1,
              unit: '式',
              unitPrice: 150000,
              amount: 150000,
            },
            {
              name: '防水シート張替',
              quantity: 30,
              unit: '㎡',
              unitPrice: 3500,
              amount: 105000,
            },
          ],
        },
        {
          category: '雨樋清掃',
          items: [
            {
              name: '雨樋清掃・点検',
              quantity: 1,
              unit: '式',
              unitPrice: 35000,
              amount: 35000,
            },
            {
              name: '雨樋金具交換',
              quantity: 5,
              unit: '箇所',
              unitPrice: 2500,
              amount: 12500,
            },
          ],
        },
        {
          category: '外壁メンテナンス',
          items: [
            {
              name: 'クラック補修',
              quantity: 10,
              unit: '箇所',
              unitPrice: 5000,
              amount: 50000,
            },
            {
              name: 'コーキング打替',
              quantity: 20,
              unit: 'm',
              unitPrice: 1500,
              amount: 30000,
            },
          ],
        },
      ],
      subtotal: 382500,
      tax: 38250,
      total: 420750,
      notes:
        '※アフター点検の結果に基づく補修見積です\n※詳細な施工範囲は現地調査後に確定します',
      createdAt: new Date().toISOString(),
    };

    // localStorageに保存（ブラウザでは使えないので、実際はメモリDBまたはDBへ保存）
    // ここではスタブとして成功レスポンスを返す

    return NextResponse.json({
      success: true,
      estimateId: estimateTemplate.id,
      redirectUrl: `/estimates/create?customerId=${customerId}&projectId=${projectId}&templateId=${estimateTemplate.id}`,
    });
  } catch (error) {
    console.error('Error creating instant estimate:', error);
    return NextResponse.json(
      { error: 'Failed to create instant estimate' },
      { status: 500 },
    );
  }
}
