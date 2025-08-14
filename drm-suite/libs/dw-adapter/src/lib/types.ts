// DW API連携の型定義

export interface DWProgress {
  siteId: string;
  projectId: string;
  date: string;
  progressPct: number;
  earnedValueAmt: number;
  workType: string;
  photos?: string[];
  checklist?: Record<string, boolean>;
  updatedAt: string;
}

export interface DWClaim {
  id: string;
  projectId: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  submittedDate: string;
  photos?: string[];
}

export interface DWApproveProgressRequest {
  siteId: string;
  projectId: string;
  progressPct: number;
  earnedValueAmt: number;
  approvedBy: string;
  approvalDate: string;
  notes?: string;
}

export interface DWCreateChangeOrderRequest {
  projectId: string;
  code: string;
  description: string;
  deltaAmt: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
}

export interface DWResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: string[];
}

// v1.0 新機能: 工事台帳連携
export interface DWLedgerSyncRequest {
  ledgerId: string;
  projectId: string;
  contractAmount: number;
  billingMode: 'MILESTONE' | 'PERCENT_COMPLETE';
  subLedgers: DWSubLedger[];
}

export interface DWSubLedger {
  tradeCode: string;
  name: string;
  budgets: DWBudgetItem[];
  costs: DWCostItem[];
}

export interface DWBudgetItem {
  costCode: string;
  costName: string;
  plannedQty?: number;
  unit?: string;
  plannedAmt: number;
  taxCode: string;
}

export interface DWCostItem {
  docType: 'MATERIAL' | 'OUTSOURCE' | 'LABOR';
  vendorName: string;
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
  taxCode: string;
  invoiceNo?: string;
  invoiceDate?: string;
}

// アフター管理連携
export interface DWMaintenanceRequest {
  contractId: string;
  customerId: string;
  inspectionType: string;
  scheduledDate: string;
  inspector: string;
}

export interface DWInspectionResult {
  inspectionId: string;
  completedDate: string;
  findings: Record<string, any>;
  photos: string[];
  defects: DWDefectRecord[];
  nextInspectionDate?: string;
}

export interface DWDefectRecord {
  category: string;
  description: string;
  severity: string;
  location?: string;
  photos: string[];
  estimatedCost?: number;
}

// 受付システム連携
export interface DWVisitorNotification {
  visitorName: string;
  purpose: string;
  assignedTo?: string;
  roomId?: string;
  arrivedAt: string;
}

// 通知システム
export interface DWNotificationRequest {
  recipientId: string;
  type: 'email' | 'sms' | 'slack' | 'chatwork';
  title: string;
  message: string;
  priority: number;
  metadata?: Record<string, any>;
}