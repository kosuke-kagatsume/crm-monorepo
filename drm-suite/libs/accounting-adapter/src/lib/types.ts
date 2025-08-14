// 会計連携の型定義

export enum AccountingSystem {
  YAYOI = 'yayoi',
  BUGYO = 'bugyo', 
  PCA = 'pca',
  FREEE = 'freee',
  MF = 'mf',
}

export interface AccountingMapping {
  system: AccountingSystem;
  accounts: Record<string, string>; // 勘定科目マッピング
  subAccounts: Record<string, string>; // 補助科目マッピング
  departments: Record<string, string>; // 部門マッピング
  taxCodes: Record<string, string>; // 税区分マッピング
}

export interface LedgerData {
  date: Date;
  voucherNo?: string; // 伝票番号
  accountType: string; // 勘定科目種別
  amount: number;
  taxRate: number;
  taxAmount?: number;
  description: string;
  isDebit: boolean; // 借方/貸方
  subAccount?: string; // 補助科目
  department?: string; // 部門
  projectCode?: string; // プロジェクトコード
  reference?: string; // 参照番号
}

export interface CSVRow {
  date: string;
  voucherNo: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  taxCode: string;
  taxAmount: number;
  description: string;
  subAccount: string;
  department: string;
  project: string;
  reference: string;
}

// v1.0 拡張: 工事台帳連携
export interface ProjectLedgerData {
  projectId: string;
  contractAmount: number;
  billedAmount: number;
  paidAmount: number;
  costs: ProjectCostData[];
  progress: ProjectProgressData[];
  changeOrders: ChangeOrderData[];
  retainage: RetainageData;
}

export interface ProjectCostData {
  date: Date;
  docType: 'MATERIAL' | 'OUTSOURCE' | 'LABOR';
  vendorName: string;
  description: string;
  amount: number;
  taxRate: number;
  invoiceNo?: string;
  costCode: string;
  department: string;
}

export interface ProjectProgressData {
  date: Date;
  progressPct: number;
  earnedValueAmt: number;
  billedAmt: number;
  description: string;
}

export interface ChangeOrderData {
  date: Date;
  code: string;
  description: string;
  deltaAmt: number;
  reason: string;
  status: string;
}

export interface RetainageData {
  totalRetainage: number;
  releasedRetainage: number;
  pendingRetainage: number;
  releaseRule: 'ON_FINAL' | 'ON_INSPECTION';
}

// 仕訳エントリ
export interface JournalEntry {
  entryDate: Date;
  voucherNo: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
  reference?: string;
  projectId?: string;
  department?: string;
}

// アフター管理費用
export interface MaintenanceCostData {
  date: Date;
  contractId: string;
  maintenanceType: string;
  description: string;
  cost: number;
  materials: string[];
  laborHours?: number;
  vendorName?: string;
}