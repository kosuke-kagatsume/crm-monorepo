// KPI データ取得サービス

import type { Role } from '@/config/roleDashboard';

interface KPIResponse {
  role: Role;
  timestamp: string;
  kpis: Record<string, any>;
}

// 実API形式のKPIデータを取得
export async function fetchKPIData(role: Role): Promise<Record<string, any>> {
  try {
    const response = await fetch(`/api/kpi?role=${role}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`KPI API エラー: ${response.status}`);
    }

    const data: KPIResponse = await response.json();
    return data.kpis;
  } catch (error) {
    console.error(`KPI データ取得エラー [${role}]:`, error);

    // フォールバック: スタブデータを返す
    return getFallbackKPIData(role);
  }
}

// フォールバック用スタブデータ
function getFallbackKPIData(role: Role): Record<string, any> {
  const fallbackData: Record<Role, Record<string, any>> = {
    mgmt: {
      monthly_revenue: 15420000,
      gross_margin_rate: 34.5,
      cash_on_hand: 24800000,
      overdue_receivables_count: 7,
    },
    branch: {
      gross_margin_rate: 34.5,
      monthly_contracts: 23,
      pending_approvals: 5,
      delayed_projects: 3,
    },
    sales: {
      daily_leads: 12,
      quote_deadlines: 8,
      daily_visits: 4,
    },
    accounting: {
      monthly_revenue: 15420000,
      accounts_receivable: 8500000,
      weekly_collections: 3200000,
    },
    marketing: {
      website_visits: 1250,
      conversion_rate: 2.8,
      cost_per_acquisition: 3500,
    },
    foreman: {
      active_sites: 6,
      average_progress: 67.5,
      earned_value: 45200000,
      unapproved_billing: 2100000,
    },
    clerk: {
      avg_response_time_minutes: 12,
      unreplied_today: 3,
      customer_satisfaction: 87,
    },
    aftercare: {
      weekly_inspections: 15,
      pending_defects: 4,
      nps_score: 72,
    },
  };

  return fallbackData[role] || {};
}

// リアルタイム更新用（WebSocketやSSE導入時）
export function subscribeToKPIUpdates(
  role: Role,
  callback: (data: Record<string, any>) => void,
): () => void {
  // 現在はポーリングで実装（5秒間隔）
  const interval = setInterval(async () => {
    try {
      const data = await fetchKPIData(role);
      callback(data);
    } catch (error) {
      console.error('KPI 更新エラー:', error);
    }
  }, 5000);

  // クリーンアップ関数を返す
  return () => clearInterval(interval);
}

// 複数役職の一括取得（管理者向け）
export async function fetchMultipleKPIData(
  roles: Role[],
): Promise<Record<Role, Record<string, any>>> {
  const results: Record<Role, Record<string, any>> = {} as Record<
    Role,
    Record<string, any>
  >;

  // 並列で取得
  const promises = roles.map(async (role) => {
    const data = await fetchKPIData(role);
    return { role, data };
  });

  try {
    const resolvedData = await Promise.all(promises);
    resolvedData.forEach(({ role, data }) => {
      results[role] = data;
    });
  } catch (error) {
    console.error('複数KPI取得エラー:', error);
  }

  return results;
}
