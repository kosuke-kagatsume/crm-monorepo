/**
 * Customer Types - 顧客管理関連の型定義
 */

export type CustomerStatus = 'lead' | 'prospect' | 'customer' | 'inactive';

export interface Customer {
  // Basic Information
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  industry?: string;
  status: CustomerStatus;
  tags: string[];
  assignee: string;
  notes?: string;

  // Sales Information (営業関連情報)
  lastContact?: string;
  nextAction?: string;
  value: number; // 顧客価値（見込み金額）
  source?: string; // 獲得チャネル（web, referral, direct等）

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Related Data (関連データ)
  estimatesCount?: number;
  contractsCount?: number;
  totalRevenue?: number;
  lastEstimateDate?: string;
  lastContractDate?: string;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'chat' | 'line' | 'note' | 'visit';
  content: string;
  date: string;
  duration?: number; // 分単位
  outcome?: string; // 結果・成果
  nextAction?: string;
  createdBy: string;
  createdAt: string;

  // 関連ファイル
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
  }>;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  type: 'general' | 'technical' | 'financial' | 'personal';
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProject {
  id: string;
  customerId: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  budget?: number;
  startDate?: string;
  endDate?: string;
  estimateId?: string;
  contractId?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
}

// フィルター・検索用
export interface CustomerFilter {
  status?: CustomerStatus[];
  assignee?: string[];
  tags?: string[];
  industry?: string[];
  source?: string[];

  // 金額範囲
  valueMin?: number;
  valueMax?: number;

  // 日付範囲
  lastContactFrom?: string;
  lastContactTo?: string;
  createdFrom?: string;
  createdTo?: string;

  // テキスト検索
  search?: string; // 名前、会社名、メール、電話番号を対象

  // ソート
  sortBy?: 'name' | 'company' | 'lastContact' | 'value' | 'createdAt';
  sortOrder?: 'asc' | 'desc';

  // ページネーション
  offset?: number;
  limit?: number;
}

// 統計・分析用
export interface CustomerStats {
  total: number;

  byStatus: {
    lead: number;
    prospect: number;
    customer: number;
    inactive: number;
  };

  bySource: Record<string, number>;

  recentActivity: {
    newCustomersThisMonth: number;
    interactionsThisWeek: number;
    upcomingActions: number;
  };

  performance: {
    conversionRate: number; // lead → customer
    averageValue: number;
    averageLifetime: number; // 日数
    topAssignees: Array<{
      assignee: string;
      customerCount: number;
      totalValue: number;
      conversionRate: number;
    }>;
  };

  trends: {
    newCustomersTrend: Array<{
      month: string;
      count: number;
      value: number;
    }>;
    conversionTrend: Array<{
      month: string;
      rate: number;
    }>;
  };
}

// カンバンボード用
export interface CustomerKanbanColumn {
  status: CustomerStatus;
  title: string;
  color: string;
  customers: Customer[];
  count: number;
  totalValue: number;
}

// エクスポート・インポート用
export interface CustomerExportData {
  customers: Customer[];
  exportedAt: string;
  exportedBy: string;
  format: 'csv' | 'excel' | 'json';
}

export interface CustomerImportResult {
  success: number;
  skipped: number;
  errors: Array<{
    row: number;
    data: any;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    data: any;
    message: string;
  }>;
}
