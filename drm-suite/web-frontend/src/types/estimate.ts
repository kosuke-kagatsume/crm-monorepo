/**
 * Estimate Types - 見積管理関連の型定義
 */

export type EstimateStatus =
  | 'draft' // 下書き
  | 'pending' // 承認待ち
  | 'approved' // 承認済み
  | 'sent' // 送付済み
  | 'accepted' // 受注
  | 'rejected' // 失注
  | 'expired'; // 期限切れ

export interface EstimateItem {
  // Basic Information
  id: string;
  category: string; // 工事項目カテゴリ
  subcategory?: string; // サブカテゴリ
  itemName: string; // 品名
  specification: string; // 仕様・規格
  quantity: number; // 数量
  unit: string; // 単位
  unitPrice: number; // 単価
  amount: number; // 金額（数量×単価）

  // Cost Information (原価情報)
  costPrice: number; // 原価単価
  grossProfit: number; // 粗利益
  profitRate: number; // 粗利率（%）

  // Cost Breakdown (詳細原価内訳)
  materialCost?: number; // 材料費
  laborCost?: number; // 労務費
  subcontractorCost?: number; // 外注費

  // Metadata
  vendor?: string; // 仕入先・協力会社
  remarks?: string; // 備考
  isHighlighted?: boolean; // 強調表示

  // Approval & History (承認・変更履歴)
  approvedBy?: string;
  approvedAt?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface EstimateSection {
  id: string;
  name: string; // セクション名（例：基礎工事、外壁工事）
  order: number; // 表示順序
  items: EstimateItem[]; // 明細項目
  subtotal: number; // 小計
  isExpanded: boolean; // 展開状態（UI用）
  notes?: string; // セクション備考
}

export interface EstimateExpenses {
  siteManagementRate: number; // 現場管理費率（%）
  generalManagementRate: number; // 一般管理費率（%）
  profitRate: number; // 利益率（%）
  discountAmount: number; // 値引き金額
  taxRate: number; // 消費税率（%）

  // 追加経費
  additionalExpenses?: Array<{
    name: string;
    amount: number;
    type: 'fixed' | 'rate'; // 固定額 or 率
  }>;
}

export interface EstimateTotals {
  directCost: number; // 直接工事費
  siteManagement: number; // 現場管理費
  generalManagement: number; // 一般管理費
  profit: number; // 利益
  subtotal: number; // 税抜合計
  tax: number; // 消費税
  total: number; // 税込合計

  // 原価分析
  totalCost: number; // 総原価
  grossProfitAmount: number; // 総粗利益額
  grossProfitRate: number; // 総粗利率（%）
}

export interface Estimate {
  id: string;

  // 基本情報
  estimateNumber: string; // 見積番号（自動生成）
  customerName: string; // 顧客名
  customerCompany?: string; // 顧客会社名
  customerId?: string; // 顧客ID（紐付け）

  // プロジェクト情報
  projectName: string; // 工事名・案件名
  projectAddress?: string; // 工事住所
  projectType: string; // 工事種別（reform, new_build, commercial等）
  constructionPeriod?: string; // 工期

  // 見積内容
  sections: EstimateSection[]; // 見積明細セクション
  expenses: EstimateExpenses; // 諸経費設定
  totals: EstimateTotals; // 合計金額

  // 商談・契約条件
  paymentTerms?: string; // 支払い条件
  validUntil?: string; // 見積有効期限
  deliveryTerms?: string; // 納期・引渡し条件
  warrantyTerms?: string; // 保証条件
  specialConditions?: string; // 特記事項

  // ステータス・承認
  status: EstimateStatus;
  approvalWorkflow?: {
    requiredApprovers: string[];
    currentApprover?: string;
    approvedBy: Array<{
      userId: string;
      userName: string;
      approvedAt: string;
      comments?: string;
    }>;
    rejectedBy?: {
      userId: string;
      userName: string;
      rejectedAt: string;
      reason: string;
    };
  };

  // メタデータ
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignee?: string; // 担当営業

  // 関連情報
  parentEstimateId?: string; // 元見積ID（改訂版の場合）
  version: number; // バージョン番号
  tags?: string[]; // タグ
  notes?: string; // 内部メモ

  // 外部連携
  contractId?: string; // 受注時の契約ID
  projectId?: string; // プロジェクトID

  // PDF・ドキュメント
  pdfUrl?: string;
  documentSettings?: {
    templateId: string;
    logoUrl?: string;
    customHeader?: string;
    customFooter?: string;
    showCostBreakdown: boolean;
  };
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
  sections: EstimateSection[];
  expenses: EstimateExpenses;

  // メタデータ
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  usageCount: number;

  // カテゴリ・タグ
  category?: string;
  tags?: string[];
}

// フィルター・検索用
export interface EstimateFilter {
  status?: EstimateStatus[];
  customerId?: string;
  projectType?: string[];
  createdBy?: string[];
  assignee?: string[];

  // 金額範囲
  amountMin?: number;
  amountMax?: number;

  // 日付範囲
  createdFrom?: string;
  createdTo?: string;
  validUntilFrom?: string;
  validUntilTo?: string;

  // テキスト検索
  search?: string; // 顧客名、案件名、見積番号を対象

  // ソート
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'customerName'
    | 'projectName'
    | 'totalAmount'
    | 'validUntil';
  sortOrder?: 'asc' | 'desc';

  // ページネーション
  offset?: number;
  limit?: number;
}

// 統計・分析用
export interface EstimateStats {
  total: number;

  byStatus: Record<EstimateStatus, number>;

  financial: {
    totalValue: number;
    averageValue: number;
    medianValue: number;
    totalCost: number;
    averageProfitRate: number;
  };

  performance: {
    conversionRate: number; // 受注率
    averageApprovalTime: number; // 承認にかかる平均時間（時間）
    onTimeDeliveryRate: number; // 期限内提出率
  };

  byProjectType: Array<{
    type: string;
    count: number;
    totalValue: number;
    averageValue: number;
    conversionRate: number;
  }>;

  byAssignee: Array<{
    assignee: string;
    count: number;
    totalValue: number;
    conversionRate: number;
    averageProfitRate: number;
  }>;

  trends: {
    monthlyEstimates: Array<{
      month: string;
      count: number;
      value: number;
      conversions: number;
    }>;

    profitTrends: Array<{
      month: string;
      averageProfitRate: number;
      totalProfit: number;
    }>;
  };
}

// RAG（AI）アシスタント関連
export interface RAGSuggestion {
  type:
    | 'similar_estimate'
    | 'missing_item'
    | 'price_optimization'
    | 'cost_alert'
    | 'market_trend';
  title: string;
  description: string;
  confidence: number; // 信頼度（0-100）

  data?: {
    // 類似見積の場合
    similarEstimate?: {
      id: string;
      projectName: string;
      customerName: string;
      totalAmount: number;
      createdAt: string;
      similarity: number;
    };

    // 項目提案の場合
    suggestedItem?: EstimateItem;

    // 価格最適化の場合
    priceOptimization?: {
      currentPrice: number;
      suggestedPrice: number;
      reason: string;
      marketData?: any;
    };
  };

  actionable: boolean; // アクション可能かどうか
  action?: {
    type: 'add_item' | 'update_price' | 'copy_section' | 'apply_template';
    payload: any;
  };
}

// エクスポート・レポート用
export interface EstimateReport {
  period: {
    from: string;
    to: string;
  };

  summary: {
    totalEstimates: number;
    totalValue: number;
    conversions: number;
    conversionRate: number;
    averageValue: number;
    totalProfit: number;
    averageProfitRate: number;
  };

  breakdown: {
    byStatus: Record<EstimateStatus, { count: number; value: number }>;
    byProjectType: Record<
      string,
      { count: number; value: number; conversions: number }
    >;
    byAssignee: Record<
      string,
      { count: number; value: number; conversions: number }
    >;
  };

  trends: Array<{
    date: string;
    estimates: number;
    value: number;
    conversions: number;
  }>;

  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendations: string[];
  }>;
}
