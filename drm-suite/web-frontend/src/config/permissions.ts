// 権限マトリクス（会社一律）
export type Role =
  | 'mgmt'
  | 'branch'
  | 'sales'
  | 'accounting'
  | 'marketing'
  | 'foreman'
  | 'clerk'
  | 'aftercare';

export type Perm = {
  canViewCost: boolean; // 原価
  canViewGrossMargin: boolean; // 粗利
  canApprove: boolean; // 承認
  canExportAccounting: boolean;
};

export const PERMISSIONS: Record<Role, Perm> = {
  mgmt: {
    canViewCost: true,
    canViewGrossMargin: true,
    canApprove: true,
    canExportAccounting: true,
  },
  branch: {
    canViewCost: true,
    canViewGrossMargin: true,
    canApprove: true,
    canExportAccounting: false,
  },
  sales: {
    canViewCost: false,
    canViewGrossMargin: false,
    canApprove: false,
    canExportAccounting: false,
  },
  accounting: {
    canViewCost: true,
    canViewGrossMargin: true,
    canApprove: false,
    canExportAccounting: true,
  },
  marketing: {
    canViewCost: false,
    canViewGrossMargin: false,
    canApprove: false,
    canExportAccounting: false,
  },
  foreman: {
    canViewCost: true,
    canViewGrossMargin: false,
    canApprove: true,
    canExportAccounting: false,
  },
  clerk: {
    canViewCost: false,
    canViewGrossMargin: false,
    canApprove: false,
    canExportAccounting: false,
  },
  aftercare: {
    canViewCost: false,
    canViewGrossMargin: false,
    canApprove: false,
    canExportAccounting: false,
  },
};

// 権限チェック用ヘルパー関数
export function hasPermission(role: Role, permission: keyof Perm): boolean {
  return PERMISSIONS[role][permission];
}

// RAG用の機密情報非表示対象ロール
export const RESTRICTED_ROLES: Role[] = ['sales', 'clerk', 'aftercare'];

// デバッグ用：権限マトリクス表示
export function debugPermissions(role: Role): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 権限マトリクス [${role}]:`, PERMISSIONS[role]);
  }
}
