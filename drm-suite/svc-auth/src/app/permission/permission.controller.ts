import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionService, PermissionCheck, UserPermissions } from './permission.service';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * 現在のユーザー権限取得
   */
  @Get('user/:companyId')
  async getUserPermissions(
    @Param('companyId') companyId: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<UserPermissions> {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    return this.permissionService.getUserPermissions(userId, companyId);
  }

  /**
   * 権限チェック
   */
  @Post('check')
  async checkPermission(
    @Body() check: PermissionCheck,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ hasPermission: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    const hasPermission = await this.permissionService.checkPermission(userId, check);
    return { hasPermission };
  }

  /**
   * 機能アクセス権限チェック
   */
  @Get('features/:companyId/:feature')
  async checkFeatureAccess(
    @Param('companyId') companyId: string,
    @Param('feature') feature: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ hasAccess: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    const hasAccess = await this.permissionService.checkFeatureAccess(userId, companyId, feature);
    return { hasAccess };
  }

  /**
   * 役職別権限一覧取得
   */
  @Get('roles/:role/permissions')
  async getRolePermissions(
    @Param('role') role: string,
  ): Promise<{ permissions: string[] }> {
    const permissions = await this.permissionService.setupRolePermissions(role);
    return { permissions };
  }

  /**
   * 権限違反ログ取得
   */
  @Get('violations/:companyId')
  async getPermissionViolations(
    @Param('companyId') companyId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    if (userRole !== 'admin' && userRole !== 'owner') {
      throw new ForbiddenException('管理者権限が必要です');
    }

    // 実際の実装では監査ログから違反履歴を取得
    return {
      violations: [
        {
          id: '1',
          userId: 'user123',
          action: 'project:delete',
          resource: 'project',
          timestamp: new Date(),
          reason: 'Insufficient permissions',
        },
      ],
    };
  }

  /**
   * 権限要求（デコレーター用）
   */
  @Post('require')
  async requirePermission(
    @Body() check: PermissionCheck,
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    await this.permissionService.requirePermission(userId, check);
    return { success: true };
  }

  /**
   * 機能要求（デコレーター用）
   */
  @Post('require-feature')
  async requireFeature(
    @Body() request: { companyId: string; feature: string },
    @Headers('x-user-id') userId?: string,
  ): Promise<{ success: boolean }> {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    await this.permissionService.requireFeature(userId, request.companyId, request.feature);
    return { success: true };
  }
}