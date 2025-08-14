import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

export interface PermissionCheck {
  resource: string;
  action: string;
  companyId: string;
  storeId?: string;
  projectId?: string;
  customerId?: string;
}

export interface UserPermissions {
  role: string;
  permissions: string[];
  companyAccess: string[];
  storeAccess: string[];
  planLevel: 'LITE' | 'STANDARD' | 'PRO';
  features: Record<string, boolean>;
}

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ユーザー権限の取得
   */
  async getUserPermissions(userId: string, companyId: string): Promise<UserPermissions> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyAccess: {
          where: { companyId },
          include: {
            company: {
              include: {
                companyPlan: true,
              },
            },
          },
        },
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('ユーザーが見つかりません');
    }

    const companyAccess = user.companyAccess[0];
    if (!companyAccess) {
      throw new ForbiddenException('この会社へのアクセス権限がありません');
    }

    const planLevel = companyAccess.company.companyPlan?.plan || 'LITE';
    const planFeatures = JSON.parse(companyAccess.company.companyPlan?.features || '{}');

    return {
      role: companyAccess.role,
      permissions: user.rolePermissions.map(rp => rp.permission.name),
      companyAccess: user.companyAccess.map(ca => ca.companyId),
      storeAccess: user.companyAccess.flatMap(ca => ca.storeIds || []),
      planLevel: planLevel as 'LITE' | 'STANDARD' | 'PRO',
      features: {
        ...this.getDefaultFeatures(planLevel),
        ...planFeatures,
      },
    };
  }

  /**
   * 権限チェック
   */
  async checkPermission(userId: string, check: PermissionCheck): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, check.companyId);
    
    // 基本的な権限チェック
    const requiredPermission = `${check.resource}:${check.action}`;
    if (!userPermissions.permissions.includes(requiredPermission) && 
        !userPermissions.permissions.includes(`${check.resource}:*`) &&
        !userPermissions.permissions.includes('*:*')) {
      return false;
    }

    // 会社アクセス権限チェック
    if (!userPermissions.companyAccess.includes(check.companyId)) {
      return false;
    }

    // 店舗アクセス権限チェック
    if (check.storeId && userPermissions.storeAccess.length > 0) {
      if (!userPermissions.storeAccess.includes(check.storeId)) {
        return false;
      }
    }

    // プロジェクトアクセス権限チェック
    if (check.projectId) {
      const hasProjectAccess = await this.checkProjectAccess(userId, check.projectId);
      if (!hasProjectAccess) {
        return false;
      }
    }

    // 顧客アクセス権限チェック
    if (check.customerId) {
      const hasCustomerAccess = await this.checkCustomerAccess(userId, check.customerId, check.companyId);
      if (!hasCustomerAccess) {
        return false;
      }
    }

    return true;
  }

  /**
   * 機能アクセス権限チェック
   */
  async checkFeatureAccess(userId: string, companyId: string, feature: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, companyId);
    
    // プラン別機能制限
    const planFeatures = this.getPlanFeatures(userPermissions.planLevel);
    if (!planFeatures.includes(feature)) {
      return false;
    }

    // カスタム機能設定
    return userPermissions.features[feature] !== false;
  }

  /**
   * 役職別デフォルト権限の設定
   */
  async setupRolePermissions(role: string): Promise<string[]> {
    const rolePermissions = {
      // 施工管理者
      construction_manager: [
        'project:read', 'project:write', 'project:create',
        'task:read', 'task:write', 'task:create', 'task:assign',
        'resource:read', 'resource:book',
        'customer:read',
        'contract:read',
        'ledger:read',
        'dashboard:construction',
      ],

      // プロジェクトマネージャー
      project_manager: [
        'project:read', 'project:write', 'project:create', 'project:manage',
        'task:read', 'task:write', 'task:create', 'task:assign', 'task:approve',
        'resource:read', 'resource:book', 'resource:manage',
        'customer:read', 'customer:write',
        'contract:read', 'contract:write',
        'ledger:read', 'ledger:write',
        'budget:read', 'budget:write',
        'dashboard:construction',
      ],

      // 事務・経理
      accounting: [
        'invoice:read', 'invoice:write', 'invoice:create', 'invoice:send',
        'payment:read', 'payment:write', 'payment:create',
        'expense:read', 'expense:write', 'expense:create',
        'ledger:read', 'ledger:write', 'ledger:export',
        'budget:read', 'budget:write',
        'contract:read', 'contract:write',
        'customer:read', 'customer:write',
        'dashboard:accounting',
      ],

      // 事務所管理者
      office_manager: [
        'user:read', 'user:write', 'user:create',
        'customer:read', 'customer:write', 'customer:create',
        'reception:read', 'reception:write', 'reception:create',
        'booking:read', 'booking:write', 'booking:create',
        'notification:read', 'notification:send',
        'dashboard:office',
      ],

      // アフターケア担当
      aftercare: [
        'inspection:read', 'inspection:write', 'inspection:create', 'inspection:schedule',
        'defect:read', 'defect:write', 'defect:create',
        'warranty:read', 'warranty:write', 'warranty:claim',
        'maintenance:read', 'maintenance:write', 'maintenance:schedule',
        'satisfaction:read', 'satisfaction:write', 'satisfaction:survey',
        'customer:read', 'customer:contact',
        'dashboard:aftercare',
      ],

      // 顧客サービス
      customer_service: [
        'customer:read', 'customer:write', 'customer:contact',
        'reception:read', 'reception:write', 'reception:create',
        'inquiry:read', 'inquiry:write', 'inquiry:respond',
        'satisfaction:read', 'satisfaction:survey',
      ],

      // 管理者
      admin: [
        '*:*', // 全権限
      ],

      // オーナー
      owner: [
        '*:*', // 全権限
      ],
    };

    return rolePermissions[role] || [];
  }

  /**
   * プロジェクトアクセス権限チェック
   */
  private async checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        assignedUsers: true,
      },
    });

    if (!project) return false;

    // プロジェクトマネージャーまたはアサインされたユーザー
    return project.managerId === userId || 
           project.assignedUsers.some(au => au.userId === userId);
  }

  /**
   * 顧客アクセス権限チェック
   */
  private async checkCustomerAccess(userId: string, customerId: string, companyId: string): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) return false;

    // 同じ会社の顧客のみアクセス可能
    return customer.companyId === companyId;
  }

  /**
   * プラン別機能一覧
   */
  private getPlanFeatures(planLevel: string): string[] {
    const features = {
      LITE: [
        'basic_ledger',
        'simple_invoicing',
        'basic_aftercare',
        'customer_management',
      ],
      STANDARD: [
        'basic_ledger',
        'simple_invoicing',
        'basic_aftercare',
        'customer_management',
        'advanced_reporting',
        'budget_management',
        'progress_tracking',
        'maintenance_contracts',
      ],
      PRO: [
        'basic_ledger',
        'simple_invoicing',
        'basic_aftercare',
        'customer_management',
        'advanced_reporting',
        'budget_management',
        'progress_tracking',
        'maintenance_contracts',
        'retention_management',
        'change_orders',
        'advanced_analytics',
        'custom_workflows',
        'api_access',
        'third_party_integrations',
      ],
    };

    return features[planLevel] || features.LITE;
  }

  /**
   * デフォルト機能設定
   */
  private getDefaultFeatures(planLevel: string): Record<string, boolean> {
    const planFeatures = this.getPlanFeatures(planLevel);
    const features = {};

    planFeatures.forEach(feature => {
      features[feature] = true;
    });

    return features;
  }

  /**
   * 権限違反時のアクション
   */
  async logPermissionViolation(userId: string, check: PermissionCheck, reason: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'permission_violation',
        resource: check.resource,
        details: JSON.stringify({
          attemptedAction: check.action,
          companyId: check.companyId,
          storeId: check.storeId,
          projectId: check.projectId,
          customerId: check.customerId,
          reason,
        }),
        ipAddress: '', // 実際の実装ではリクエストから取得
        userAgent: '', // 実際の実装ではリクエストから取得
      },
    });
  }

  /**
   * 権限確認デコレーター用のヘルパー
   */
  async requirePermission(userId: string, check: PermissionCheck): Promise<void> {
    const hasPermission = await this.checkPermission(userId, check);
    
    if (!hasPermission) {
      await this.logPermissionViolation(userId, check, 'Access denied');
      throw new ForbiddenException('この操作を実行する権限がありません');
    }
  }

  /**
   * 機能制限確認
   */
  async requireFeature(userId: string, companyId: string, feature: string): Promise<void> {
    const hasAccess = await this.checkFeatureAccess(userId, companyId, feature);
    
    if (!hasAccess) {
      throw new ForbiddenException(`この機能（${feature}）は現在のプランでは利用できません`);
    }
  }
}