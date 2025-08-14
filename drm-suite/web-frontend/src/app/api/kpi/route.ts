import { NextResponse } from 'next/server';
import type { Role } from '@/config/roleDashboard';

interface KPIRequest {
  role: Role;
}

interface KPIResponse {
  role: Role;
  timestamp: string;
  kpis: Record<string, any>;
}

// 実API形式のKPIデータ（バックエンド想定形式）
const API_KPI_DATA: Record<Role, Record<string, any>> = {
  mgmt: {
    monthly_revenue: 15420000, // 今月売上
    gross_margin_rate: 34.5, // 粗利率
    cash_on_hand: 24800000, // 手持ち資金
    overdue_receivables_count: 7, // 回収遅延件数
  },
  branch: {
    gross_margin_rate: 34.5, // 粗利率
    monthly_contracts: 23, // 今月契約数
    pending_approvals: 5, // 承認待ち
    delayed_projects: 3, // 遅延案件
  },
  sales: {
    daily_leads: 12, // 本日の新規反響
    quote_deadlines: 8, // 見積提出期限
    daily_visits: 4, // 本日の来店予定
  },
  accounting: {
    monthly_revenue: 15420000, // 今月売上
    accounts_receivable: 8500000, // 未収金
    weekly_collections: 3200000, // 今週入金予定
  },
  marketing: {
    website_visits: 1250, // 訪問数
    conversion_rate: 2.8, // CV率
    cost_per_acquisition: 3500, // CPA
  },
  foreman: {
    active_sites: 6, // 今日の現場
    average_progress: 67.5, // 平均進捗
    earned_value: 45200000, // 累計出来高
    unapproved_billing: 2100000, // 未承認請求
  },
  clerk: {
    avg_response_time_minutes: 12, // 平均初動応答時間
    unreplied_today: 3, // 当日未返信
    customer_satisfaction: 87, // 受付満足度
  },
  aftercare: {
    weekly_inspections: 15, // 今週点検
    pending_defects: 4, // 是正保留
    nps_score: 72, // 満足度(NPS)
  },
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as Role;

    if (!role || !(role in API_KPI_DATA)) {
      return NextResponse.json(
        { error: '有効な役職を指定してください' },
        { status: 400 },
      );
    }

    // 実際のAPIでは、ここでデータベースクエリやキャッシュから取得
    const kpiData = API_KPI_DATA[role];

    // 一部の値をリアルタイム風にランダム変動
    const dynamicData = { ...kpiData };
    if (dynamicData.daily_leads) {
      dynamicData.daily_leads += Math.floor(Math.random() * 3) - 1; // ±1のランダム変動
    }
    if (dynamicData.pending_approvals) {
      dynamicData.pending_approvals = Math.max(
        0,
        dynamicData.pending_approvals + Math.floor(Math.random() * 3) - 1,
      );
    }
    if (dynamicData.unreplied_today) {
      dynamicData.unreplied_today = Math.max(
        0,
        dynamicData.unreplied_today + Math.floor(Math.random() * 2) - 1,
      );
    }

    const response: KPIResponse = {
      role,
      timestamp: new Date().toISOString(),
      kpis: dynamicData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('KPI API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}

// POST メソッドでも対応（役職をbodyで送る場合）
export async function POST(req: Request) {
  try {
    const { role }: KPIRequest = await req.json();

    if (!role || !(role in API_KPI_DATA)) {
      return NextResponse.json(
        { error: '有効な役職を指定してください' },
        { status: 400 },
      );
    }

    const kpiData = API_KPI_DATA[role];

    const response: KPIResponse = {
      role,
      timestamp: new Date().toISOString(),
      kpis: kpiData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('KPI API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
  }
}
