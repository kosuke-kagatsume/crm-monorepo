export type Id = string;

export type EstimateItem = {
  id: Id;
  parentId?: Id;          // 親子明細対応
  name: string;
  qty: number;
  unit: string;
  price: number;          // 売価(税抜)
  cost?: number;          // 原価(税抜)
  attachments?: { name: string; url: string }[];
  skuId?: string;         // 在庫連動
};

export type EstimateVersion = {
  id: Id;
  label: string;          // v1, v2...
  createdAt: string;
  items: EstimateItem[];
  notes?: string;
  selectedVendorIds?: string[];
};

export type Vendor = { id: Id; name: string; unitPriceHint?: number; score?: number };

export type ApprovalStep = { role: 'manager'|'director'|'cfo'; threshold: number };

export type PaymentPlan = {
  depositPct?: number;    // 着工金%
  middlePct?: number;     // 中間金%
  finalPct?: number;      // 最終金%
};

export type ContractLink = { provider: 'gmo'|'cloudsign'; status: 'draft'|'sent'|'signed'; url?: string };

export type Estimate = {
  id: Id;
  projectId?: Id;
  customerId: Id;
  title: string;
  storeId: Id;
  method?: string;        // 工法
  structure?: string;     // 構造
  category?: string;      // 物件種別/リフォーム箇所
  versions: EstimateVersion[];
  selectedVersionId?: Id;
  approval?: { steps: ApprovalStep[]; status: 'draft'|'pending'|'approved'|'rejected' };
  contract?: ContractLink;
  paymentPlan?: PaymentPlan;
  createdBy: Id;
  createdAt: string;
  updatedAt: string;
};