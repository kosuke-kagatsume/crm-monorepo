/**
 * 認証・権限管理の型定義
 */

// ユーザーロールの定義
export enum UserRoleType {
  // 管理者権限
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',

  // 通常ユーザー（既存の8役職）
  EXECUTIVE = '経営者',
  MANAGER = '支店長',
  SALES = '営業担当',
  ACCOUNTING = '経理担当',
  MARKETING = 'マーケティング',
  CONSTRUCTION = '施工管理',
  OFFICE = '事務員',
  AFTERCARE = 'アフター担当',

  // カスタム役職用
  CUSTOM = 'custom',
}

// テナント情報
export interface Tenant {
  id: string;
  companyName: string;
  plan: 'demo' | 'basic' | 'professional' | 'enterprise';
  contractStartDate: string;
  contractEndDate: string;
  maxUsers: number;
  currentUsers: number;
  settings?: TenantSettings;
}

// テナント設定
export interface TenantSettings {
  features: {
    estimates: boolean;
    inventory: boolean;
    marketing: boolean;
    ragCopilot: boolean;
  };
  customization: {
    companyLogo?: string;
    primaryColor?: string;
  };
}

// 拡張されたユーザー情報
export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleType?: UserRoleType;
  tenantId: string;
  department?: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: UserPermissions;
}

// ユーザー権限の詳細
export interface UserPermissions {
  // 各機能に対する権限（表示・編集・削除・なし）
  estimates: PermissionLevel;
  customers: PermissionLevel;
  inventory: PermissionLevel;
  accounting: PermissionLevel;
  reports: PermissionLevel;
  settings: PermissionLevel;
  users: PermissionLevel;
}

// 権限レベル
export enum PermissionLevel {
  NONE = 'none', // アクセス不可
  VIEW = 'view', // 表示のみ
  EDIT = 'edit', // 編集可能
  DELETE = 'delete', // 削除可能
  FULL = 'full', // 全権限
}

// 部署情報
export interface Department {
  id: string;
  name: string;
  parentId?: string; // 親部署のID（階層構造用）
  managerId?: string; // 部署責任者のユーザーID
  memberCount: number;
  createdAt: string;
}

// 組織構造
export interface Organization {
  tenantId: string;
  departments: Department[];
  hierarchy: OrganizationNode[];
}

// 組織階層ノード
export interface OrganizationNode {
  departmentId: string;
  children: OrganizationNode[];
}
