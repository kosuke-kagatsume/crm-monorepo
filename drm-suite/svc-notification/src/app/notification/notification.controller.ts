import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { EnhancedNotificationService, NotificationTemplate, NotificationRule } from './enhanced-notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: EnhancedNotificationService,
  ) {}

  /**
   * 通知テンプレート作成
   */
  @Post('templates')
  async createTemplate(
    @Body() template: Omit<NotificationTemplate, 'id'>,
    @Headers('x-user-role') userRole?: string,
  ): Promise<NotificationTemplate> {
    this.validateAdminAccess(userRole);
    return this.notificationService.createTemplate(template);
  }

  /**
   * 通知ルール作成
   */
  @Post('rules')
  async createNotificationRule(
    @Body() rule: Omit<NotificationRule, 'id'>,
    @Headers('x-user-role') userRole?: string,
  ): Promise<NotificationRule> {
    this.validateAdminAccess(userRole);
    return this.notificationService.createNotificationRule(rule);
  }

  /**
   * 手動通知送信
   */
  @Post('send')
  async sendNotification(
    @Body() notification: {
      trigger: string;
      companyId: string;
      storeId?: string;
      projectId?: string;
      customerId?: string;
      data: Record<string, any>;
    },
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    await this.notificationService.triggerNotification(notification.trigger, {
      companyId: notification.companyId,
      storeId: notification.storeId,
      projectId: notification.projectId,
      customerId: notification.customerId,
      userId,
      data: notification.data,
    });

    return { success: true };
  }

  /**
   * 緊急通知送信
   */
  @Post('urgent')
  async sendUrgentNotification(
    @Body() notification: {
      recipients: string[];
      subject: string;
      message: string;
      companyId: string;
      storeId?: string;
      projectId?: string;
    },
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    await this.notificationService.sendUrgentNotification(
      notification.recipients,
      notification.subject,
      notification.message,
      {
        companyId: notification.companyId,
        storeId: notification.storeId,
        projectId: notification.projectId,
        userId,
        data: {},
      }
    );

    return { success: true };
  }

  /**
   * ユーザー通知設定更新
   */
  @Put('preferences/:userId')
  async updateNotificationPreferences(
    @Param('userId') userId: string,
    @Body() preferences: Record<string, boolean>,
    @Headers('x-user-id') requestUserId?: string,
  ) {
    // 自分の設定のみ変更可能（管理者は除く）
    if (requestUserId !== userId) {
      throw new UnauthorizedException('自分の通知設定のみ変更できます');
    }

    await this.notificationService.updateUserNotificationPreferences(userId, preferences);
    return { success: true };
  }

  /**
   * 通知履歴取得
   */
  @Get('history/:companyId')
  async getNotificationHistory(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      userId,
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    return this.notificationService.getNotificationHistory(companyId, filters);
  }

  /**
   * 通知統計取得
   */
  @Get('stats/:companyId')
  async getNotificationStats(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const period = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return this.notificationService.getNotificationStats(companyId, period);
  }

  /**
   * 定期通知設定
   */
  @Post('setup-recurring')
  async setupRecurringNotifications(
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAdminAccess(userRole);
    await this.notificationService.setupRecurringNotifications();
    return { success: true };
  }

  /**
   * 通知テンプレート一覧
   */
  @Get('templates')
  async getTemplates() {
    return {
      templates: [
        {
          id: 'inspection_reminder',
          name: '点検リマインダー',
          type: 'reminder',
          subject: '{{customerName}}様の{{inspectionType}}点検のお知らせ',
          body: '{{customerName}}様\n\n{{scheduledDate}}に{{inspectionType}}点検を予定しております。\nよろしくお願いいたします。',
          variables: ['customerName', 'inspectionType', 'scheduledDate'],
          channels: ['email', 'sms'],
        },
        {
          id: 'payment_reminder',
          name: '支払期限リマインダー',
          type: 'billing',
          subject: '請求書{{invoiceNumber}}の支払期限のお知らせ',
          body: '{{customerName}}様\n\n請求書{{invoiceNumber}}（金額：￥{{amount}}）の支払期限が{{dueDate}}に迫っております。\nお忙しい中恐れ入りますが、ご確認をお願いいたします。',
          variables: ['customerName', 'invoiceNumber', 'amount', 'dueDate'],
          channels: ['email'],
        },
        {
          id: 'contract_renewal_reminder',
          name: '契約更新リマインダー',
          type: 'contract',
          subject: 'メンテナンス契約{{contractNumber}}の更新のご案内',
          body: '{{customerName}}様\n\nメンテナンス契約{{contractNumber}}が{{endDate}}に期限を迎えます。\n契約更新についてご相談させていただきたく、ご連絡いたします。',
          variables: ['customerName', 'contractNumber', 'endDate'],
          channels: ['email', 'phone'],
        },
        {
          id: 'defect_alert',
          name: '不具合アラート',
          type: 'alert',
          subject: '【緊急】不具合報告：{{projectName}}',
          body: '{{projectName}}にて不具合が報告されました。\n\n詳細：{{description}}\n深刻度：{{severity}}\n報告者：{{reportedBy}}\n\n速やかな対応をお願いいたします。',
          variables: ['projectName', 'description', 'severity', 'reportedBy'],
          channels: ['email', 'sms', 'slack'],
        },
        {
          id: 'project_completion',
          name: 'プロジェクト完了通知',
          type: 'completion',
          subject: 'プロジェクト{{projectName}}が完了いたしました',
          body: '{{customerName}}様\n\nプロジェクト{{projectName}}が{{completionDate}}に完了いたしました。\n今後ともよろしくお願いいたします。',
          variables: ['customerName', 'projectName', 'completionDate'],
          channels: ['email'],
        },
      ],
    };
  }

  /**
   * 通知設定の推奨値取得
   */
  @Get('recommendations/:role')
  async getNotificationRecommendations(
    @Param('role') role: string,
  ) {
    const recommendations = {
      construction_manager: {
        project_deadline_warning: true,
        task_assignment: true,
        quality_issue_alert: true,
        safety_incident: true,
        resource_conflict: true,
        urgent_email: true,
        urgent_sms: false,
        urgent_slack: true,
      },
      accounting: {
        payment_overdue: true,
        budget_exceeded: true,
        invoice_sent: false,
        month_end_reminder: true,
        tax_deadline: true,
        urgent_email: true,
        urgent_sms: false,
        urgent_slack: false,
      },
      aftercare: {
        inspection_reminder: true,
        warranty_expiration: true,
        defect_reported: true,
        maintenance_due: true,
        customer_satisfaction_low: true,
        urgent_email: true,
        urgent_sms: true,
        urgent_slack: false,
      },
      admin: {
        system_error: true,
        security_alert: true,
        backup_failure: true,
        license_expiration: true,
        urgent_email: true,
        urgent_sms: true,
        urgent_slack: true,
      },
    };

    return { recommendations: recommendations[role] || {} };
  }

  // ==================== プライベートメソッド ====================

  private validateAdminAccess(userRole?: string) {
    if (!userRole || !['admin', 'owner', 'general_manager'].includes(userRole)) {
      throw new UnauthorizedException('管理者権限が必要です');
    }
  }
}