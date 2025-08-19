/**
 * マスタ管理の型定義
 */

// 商品マスタ
export interface ProductMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  unit: string;
  basePrice: number;
  costPrice?: number;
  taxRate: number;
  description?: string;
  specifications?: string;
  maker?: string;
  modelNumber?: string;
  imageUrl?: string;
  stock?: number;
  leadTime?: number; // リードタイム（日数）
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 項目マスタ（見積項目テンプレート）
export interface ItemMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  includesMaterial: boolean;
  includesLabor: boolean;
  defaultQuantity?: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 単価マスタ
export interface PriceMaster {
  id: string;
  productId?: string;
  itemId?: string;
  name: string;
  priceType: 'standard' | 'special' | 'campaign' | 'volume';
  basePrice: number;
  discountRate?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  minQuantity?: number;
  maxQuantity?: number;
  conditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 工事種別マスタ
export interface ConstructionTypeMaster {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  standardDuration?: number; // 標準工期（日数）
  requiredLicenses?: string[]; // 必要な資格
  safetyRequirements?: string[]; // 安全要件
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 部屋種別マスタ
export interface RoomTypeMaster {
  id: string;
  code: string;
  name: string;
  category: 'residential' | 'commercial' | 'common';
  standardSize?: number; // 標準面積（㎡）
  standardHeight?: number; // 標準天井高（mm）
  defaultFinishes?: {
    floor?: string;
    wall?: string;
    ceiling?: string;
  };
  requiredFacilities?: string[]; // 必要設備
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 協力会社マスタ（DW APIから取得）
export interface PartnerCompanyMaster {
  id: string;
  dwId: string; // DandoriWork ID
  companyName: string;
  companyNameKana?: string;
  representative?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  businessTypes: string[]; // 業種
  licenses?: string[]; // 保有資格
  bankInfo?: {
    bankName?: string;
    branchName?: string;
    accountType?: string;
    accountNumber?: string;
    accountName?: string;
  };
  evaluationScore?: number; // 評価スコア
  contractStatus: 'active' | 'suspended' | 'terminated';
  notes?: string;
  lastSyncedAt: string; // DW APIとの最終同期日時
  createdAt: string;
  updatedAt: string;
}

// カテゴリー定義
export const ProductCategories = [
  '内装材',
  '床材',
  '下地材',
  '設備',
  '電気設備',
  '給排水設備',
  '外装材',
  '構造材',
  '金物',
  '塗料',
  '接着剤',
  '工具',
  '安全用品',
  '労務',
  'その他',
] as const;

export const ConstructionCategories = [
  '基礎工事',
  '躯体工事',
  '屋根工事',
  '外装工事',
  '内装工事',
  '電気工事',
  '給排水工事',
  '空調工事',
  '防水工事',
  '塗装工事',
  '左官工事',
  '建具工事',
  '解体工事',
  'その他工事',
] as const;

export const Units = [
  '㎡',
  'm',
  '㎥',
  'kg',
  't',
  '本',
  '個',
  '枚',
  '台',
  '式',
  '箇所',
  '人日',
  '人時',
  'セット',
  'ケース',
  'ロール',
  'パック',
] as const;

// CSV インポート/エクスポート用の型
export interface CSVImportResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface CSVExportOptions {
  format: 'csv' | 'excel';
  encoding: 'utf-8' | 'shift-jis';
  includeHeader: boolean;
  dateFormat: string;
}
