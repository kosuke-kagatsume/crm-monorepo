import { NextRequest, NextResponse } from 'next/server';

// TODO: swap with real service - DandoriWorks/会計システムAPIとの統合

// メモリDB（開発用モックデータ）
const mockProjects = [
  {
    id: 'PRJ-2024-001',
    projectName: '田中様邸 外壁塗装工事',
    customerName: '田中 太郎',
    contractAmount: 3500000,
    actualCost: 2450000,
    progressRate: 85,
    grossMargin: 1050000,
    grossMarginRate: 30,
    additionalAmount: 150000,
    collectedAmount: 2975000,
    subcontractorPayable: 350000,
    retentionAmount: 175000,
    status: 'active',
  },
  {
    id: 'PRJ-2024-002',
    projectName: '佐藤様邸 屋根・外壁塗装',
    customerName: '佐藤 花子',
    contractAmount: 5200000,
    actualCost: 4160000,
    progressRate: 60,
    grossMargin: 1040000,
    grossMarginRate: 20,
    additionalAmount: -200000,
    collectedAmount: 3120000,
    subcontractorPayable: 520000,
    retentionAmount: 260000,
    status: 'active',
  },
  {
    id: 'PRJ-2024-003',
    projectName: '鈴木様邸 防水工事',
    customerName: '鈴木 一郎',
    contractAmount: 2800000,
    actualCost: 2240000,
    progressRate: 100,
    grossMargin: 560000,
    grossMarginRate: 20,
    additionalAmount: 0,
    collectedAmount: 2800000,
    subcontractorPayable: 0,
    retentionAmount: 140000,
    status: 'completed',
  },
  {
    id: 'PRJ-2024-004',
    projectName: '高橋様邸 外壁リフォーム',
    customerName: '高橋 次郎',
    contractAmount: 4500000,
    actualCost: 3825000,
    progressRate: 45,
    grossMargin: 675000,
    grossMarginRate: 15,
    additionalAmount: 300000,
    collectedAmount: 2025000,
    subcontractorPayable: 450000,
    retentionAmount: 225000,
    status: 'active',
  },
  {
    id: 'PRJ-2024-005',
    projectName: '伊藤様邸 総合リフォーム',
    customerName: '伊藤 美咲',
    contractAmount: 8500000,
    actualCost: 7225000,
    progressRate: 30,
    grossMargin: 1275000,
    grossMarginRate: 15,
    additionalAmount: 500000,
    collectedAmount: 2550000,
    subcontractorPayable: 850000,
    retentionAmount: 425000,
    status: 'delayed',
  },
  {
    id: 'PRJ-2024-006',
    projectName: '山田様邸 全面改装',
    customerName: '山田 健一',
    contractAmount: 6200000,
    actualCost: 4960000,
    progressRate: 70,
    grossMargin: 1240000,
    grossMarginRate: 20,
    additionalAmount: 200000,
    collectedAmount: 4340000,
    subcontractorPayable: 310000,
    retentionAmount: 310000,
    status: 'active',
  },
  {
    id: 'PRJ-2024-007',
    projectName: '渡辺様邸 外構工事',
    customerName: '渡辺 明子',
    contractAmount: 1800000,
    actualCost: 1530000,
    progressRate: 95,
    grossMargin: 270000,
    grossMarginRate: 15,
    additionalAmount: 0,
    collectedAmount: 1710000,
    subcontractorPayable: 90000,
    retentionAmount: 90000,
    status: 'active',
  },
  {
    id: 'PRJ-2024-008',
    projectName: '中村様邸 屋根塗装',
    customerName: '中村 洋子',
    contractAmount: 2200000,
    actualCost: 1980000,
    progressRate: 100,
    grossMargin: 220000,
    grossMarginRate: 10,
    additionalAmount: -100000,
    collectedAmount: 2200000,
    subcontractorPayable: 0,
    retentionAmount: 110000,
    status: 'completed',
  },
];

export async function GET(request: NextRequest) {
  try {
    // localStorageからデータを取得（サーバーサイドでは使用不可のためモックを使用）
    const projects = mockProjects;

    // サマリー計算
    const totalBudget = projects.reduce((sum, p) => sum + p.contractAmount, 0);
    const totalActualCost = projects.reduce((sum, p) => sum + p.actualCost, 0);
    const averageProgressRate =
      projects.reduce((sum, p) => sum + p.progressRate, 0) / projects.length;
    const expectedGrossMargin = projects.reduce(
      (sum, p) => sum + p.grossMargin,
      0,
    );
    const totalAdditional = projects.reduce(
      (sum, p) => sum + p.additionalAmount,
      0,
    );
    const additionalRatio = (totalAdditional / totalBudget) * 100;
    const totalCollected = projects.reduce(
      (sum, p) => sum + p.collectedAmount,
      0,
    );
    const collectionRate = (totalCollected / totalBudget) * 100;
    const totalSubcontractorPayable = projects.reduce(
      (sum, p) => sum + p.subcontractorPayable,
      0,
    );
    const totalRetention = projects.reduce(
      (sum, p) => sum + p.retentionAmount,
      0,
    );

    const summary = {
      totalBudget,
      totalActualCost,
      averageProgressRate,
      expectedGrossMargin,
      additionalRatio,
      collectionRate,
      totalSubcontractorPayable,
      totalRetention,
      projects,
    };

    // localStorageに保存（クライアントサイドでの永続化を想定）
    // 実際はデータベースや外部APIから取得

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching ledger summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ledger summary' },
      { status: 500 },
    );
  }
}

// TODO: POST/PUT/DELETEメソッドも将来的に実装
// - POST: 新規プロジェクト台帳作成
// - PUT: 台帳情報更新（進捗、原価、回収状況等）
// - DELETE: 台帳削除（論理削除）
