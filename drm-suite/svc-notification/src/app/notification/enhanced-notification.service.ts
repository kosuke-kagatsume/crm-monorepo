import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, addHours, subDays, format } from 'date-fns';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
  channels: ('email' | 'sms' | 'slack' | 'chatwork' | 'system')[];
}

export interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  templateId: string;
  recipients: {
    roles: string[];
    users: string[];
    dynamic: boolean; // プロジェクト担当者など動的決定
  };
  schedule: {
    immediate: boolean;
    delay?: number; // minutes
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
    };
  };
  isActive: boolean;
}

export interface NotificationContext {
  companyId: string;
  storeId?: string;
  projectId?: string;
  customerId?: string;
  userId?: string;
  data: Record<string, any>;
}

@Injectable()
export class EnhancedNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 通知テンプレートの管理
   */
  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const created = await this.prisma.notificationTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: JSON.stringify(template.variables),
        channels: JSON.stringify(template.channels),
      },
    });

    return {
      id: created.id,
      name: created.name,
      type: created.type,
      subject: created.subject,
      body: created.body,
      variables: JSON.parse(created.variables),
      channels: JSON.parse(created.channels),
    };
  }

  /**
   * 通知ルールの設定
   */
  async createNotificationRule(rule: Omit<NotificationRule, 'id'>): Promise<NotificationRule> {
    const created = await this.prisma.notificationRule.create({
      data: {
        name: rule.name,
        trigger: rule.trigger,
        conditions: JSON.stringify(rule.conditions),
        templateId: rule.templateId,
        recipients: JSON.stringify(rule.recipients),
        schedule: JSON.stringify(rule.schedule),
        isActive: rule.isActive,
      },
    });

    return {
      id: created.id,
      name: created.name,
      trigger: created.trigger,
      conditions: JSON.parse(created.conditions),
      templateId: created.templateId,
      recipients: JSON.parse(created.recipients),
      schedule: JSON.parse(created.schedule),
      isActive: created.isActive,
    };
  }

  /**
   * イベントベース通知の送信
   */
  async triggerNotification(trigger: string, context: NotificationContext): Promise<void> {
    // アクティブな通知ルールを取得
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        trigger,
        isActive: true,
      },
      include: {
        template: true,
      },
    });

    for (const rule of rules) {
      // 条件チェック
      if (!this.evaluateConditions(rule.conditions, context)) {
        continue;
      }

      // 受信者の決定
      const recipients = await this.resolveRecipients(rule.recipients, context);

      // テンプレートの処理
      const processedTemplate = await this.processTemplate(rule.template, context);

      // 通知のスケジューリング
      await this.scheduleNotification(rule.schedule, processedTemplate, recipients, context);
    }
  }

  /**
   * 定期通知の設定
   */
  async setupRecurringNotifications(): Promise<void> {
    // 点検リマインダー
    await this.setupInspectionReminders();
    
    // 支払期限リマインダー
    await this.setupPaymentReminders();
    
    // 契約更新リマインダー
    await this.setupContractRenewalReminders();
    
    // 保証期限リマインダー
    await this.setupWarrantyExpirationReminders();
  }

  /**
   * 緊急通知の送信
   */
  async sendUrgentNotification(
    recipients: string[],
    subject: string,
    message: string,
    context: NotificationContext
  ): Promise<void> {
    const urgentChannels = ['email', 'sms', 'slack']; // 緊急時は複数チャネル

    for (const recipientId of recipients) {
      const user = await this.prisma.user.findUnique({
        where: { id: recipientId },
        include: { notificationPreferences: true },
      });

      if (!user) continue;

      // ユーザーの緊急通知設定を確認
      const preferences = user.notificationPreferences || {};
      const enabledChannels = urgentChannels.filter(channel => 
        preferences[`urgent_${channel}`] !== false
      );

      for (const channel of enabledChannels) {
        await this.sendNotificationToChannel(
          channel as 'email' | 'sms' | 'slack',
          user,
          subject,
          message,
          context,
          'high'
        );
      }
    }
  }

  /**
   * 通知設定の管理
   */
  async updateUserNotificationPreferences(
    userId: string,
    preferences: Record<string, boolean>
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: JSON.stringify(preferences),
      },
    });
  }

  /**
   * 通知履歴の取得
   */
  async getNotificationHistory(
    companyId: string,
    filters: {
      userId?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    return await this.prisma.notification.findMany({
      where: {
        companyId,
        ...(filters.userId && { recipientId: filters.userId }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && filters.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }

  /**
   * 通知統計の取得
   */
  async getNotificationStats(companyId: string, period: { start: Date; end: Date }) {
    const [sent, failed, opened] = await Promise.all([
      this.prisma.notification.count({
        where: {
          companyId,
          status: 'sent',
          createdAt: { gte: period.start, lte: period.end },
        },
      }),
      this.prisma.notification.count({
        where: {
          companyId,
          status: 'failed',
          createdAt: { gte: period.start, lte: period.end },
        },
      }),
      this.prisma.notification.count({
        where: {
          companyId,
          status: 'opened',
          createdAt: { gte: period.start, lte: period.end },
        },
      }),
    ]);

    return {
      sent,
      failed,
      opened,
      deliveryRate: sent > 0 ? ((sent - failed) / sent) * 100 : 0,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
    };
  }

  // ==================== プライベートメソッド ====================

  /**
   * 条件評価
   */
  private evaluateConditions(conditions: any, context: NotificationContext): boolean {
    // 簡易的な条件評価ロジック
    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = this.getNestedValue(context, key);
      if (contextValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * 受信者の解決
   */
  private async resolveRecipients(recipients: any, context: NotificationContext): Promise<string[]> {
    const resolvedRecipients = [];

    // 直接指定されたユーザー
    if (recipients.users) {
      resolvedRecipients.push(...recipients.users);
    }

    // 役職ベースの受信者
    if (recipients.roles) {
      const roleUsers = await this.prisma.user.findMany({
        where: {
          companyAccess: {
            some: {
              companyId: context.companyId,
              role: { in: recipients.roles },
            },
          },
        },
      });
      resolvedRecipients.push(...roleUsers.map(u => u.id));
    }

    // 動的受信者（プロジェクト担当者など）
    if (recipients.dynamic && context.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: context.projectId },
        include: { assignedUsers: true },
      });
      
      if (project) {
        resolvedRecipients.push(project.managerId);
        resolvedRecipients.push(...project.assignedUsers.map(au => au.userId));
      }
    }

    return [...new Set(resolvedRecipients)]; // 重複除去
  }

  /**
   * テンプレート処理
   */
  private async processTemplate(template: any, context: NotificationContext): Promise<{
    subject: string;
    body: string;
  }> {
    let subject = template.subject;
    let body = template.body;

    // 変数の置換
    const variables = JSON.parse(template.variables || '[]');
    for (const variable of variables) {
      const value = this.getNestedValue(context, variable) || `{${variable}}`;
      const regex = new RegExp(`{{${variable}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { subject, body };
  }

  /**
   * 通知のスケジューリング
   */
  private async scheduleNotification(
    schedule: any,
    template: { subject: string; body: string },
    recipients: string[],
    context: NotificationContext
  ): Promise<void> {
    const now = new Date();
    const sendAt = schedule.immediate 
      ? now 
      : addDays(now, schedule.delay || 0);

    for (const recipientId of recipients) {
      await this.prisma.notification.create({
        data: {
          companyId: context.companyId,
          recipientId,
          type: 'email', // デフォルト
          channel: 'email',
          title: template.subject,
          message: template.body,
          priority: 3,
          status: 'pending',
          scheduledAt: sendAt,
          metadata: JSON.stringify(context),
        },
      });
    }
  }

  /**
   * チャネル別通知送信
   */
  private async sendNotificationToChannel(
    channel: 'email' | 'sms' | 'slack',
    user: any,
    subject: string,
    message: string,
    context: NotificationContext,
    priority: 'low' | 'medium' | 'high'
  ): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        companyId: context.companyId,
        recipientId: user.id,
        type: channel,
        channel,
        title: subject,
        message,
        priority: priority === 'high' ? 1 : priority === 'medium' ? 2 : 3,
        status: 'pending',
        metadata: JSON.stringify(context),
      },
    });

    // 実際の送信処理（外部API呼び出し）
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(user.email, subject, message);
          break;
        case 'sms':
          await this.sendSMS(user.phone, message);
          break;
        case 'slack':
          await this.sendSlackMessage(user.slackUserId, subject, message);
          break;
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  /**
   * 点検リマインダーの設定
   */
  private async setupInspectionReminders(): Promise<void> {
    const upcomingInspections = await this.prisma.afterCareSchedule.findMany({
      where: {
        scheduledDate: {
          gte: new Date(),
          lte: addDays(new Date(), 7),
        },
        status: { in: ['scheduled', 'reminded'] },
      },
      include: { customer: true },
    });

    for (const inspection of upcomingInspections) {
      await this.triggerNotification('inspection_reminder', {
        companyId: inspection.companyId,
        storeId: inspection.storeId,
        customerId: inspection.customerId,
        data: {
          customerName: inspection.customer.name,
          inspectionType: inspection.inspectionType,
          scheduledDate: format(inspection.scheduledDate, 'yyyy年M月d日'),
        },
      });
    }
  }

  /**
   * 支払期限リマインダーの設定
   */
  private async setupPaymentReminders(): Promise<void> {
    const upcomingPayments = await this.prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: addDays(new Date(), 3),
        },
        status: { in: ['sent', 'partial'] },
      },
      include: { customer: true },
    });

    for (const invoice of upcomingPayments) {
      await this.triggerNotification('payment_reminder', {
        companyId: invoice.companyId,
        storeId: invoice.storeId,
        customerId: invoice.customerId,
        data: {
          customerName: invoice.customer?.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount.toLocaleString(),
          dueDate: format(invoice.dueDate, 'yyyy年M月d日'),
        },
      });
    }
  }

  /**
   * 契約更新リマインダーの設定
   */
  private async setupContractRenewalReminders(): Promise<void> {
    const expiringContracts = await this.prisma.maintenanceContract.findMany({
      where: {
        endDate: {
          gte: new Date(),
          lte: addDays(new Date(), 30),
        },
        status: 'active',
      },
      include: { customer: true },
    });

    for (const contract of expiringContracts) {
      await this.triggerNotification('contract_renewal_reminder', {
        companyId: contract.companyId,
        customerId: contract.customerId,
        data: {
          customerName: contract.customer.name,
          contractNumber: contract.contractNumber,
          endDate: format(contract.endDate, 'yyyy年M月d日'),
        },
      });
    }
  }

  /**
   * 保証期限リマインダーの設定
   */
  private async setupWarrantyExpirationReminders(): Promise<void> {
    const expiringWarranties = await this.prisma.warrantyRecord.findMany({
      where: {
        endDate: {
          gte: new Date(),
          lte: addDays(new Date(), 60),
        },
        isActive: true,
      },
      include: { customer: true },
    });

    for (const warranty of expiringWarranties) {
      await this.triggerNotification('warranty_expiration_reminder', {
        companyId: warranty.companyId,
        customerId: warranty.customerId,
        data: {
          customerName: warranty.customer.name,
          warrantyType: warranty.warrantyType,
          endDate: format(warranty.endDate, 'yyyy年M月d日'),
        },
      });
    }
  }

  /**
   * ネストした値の取得
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * 外部サービス連携メソッド（実装例）
   */
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // メール送信サービス（SendGrid、SES等）の実装
    console.log(`Email sent to ${to}: ${subject}`);
  }

  private async sendSMS(to: string, message: string): Promise<void> {
    // SMS送信サービス（Twilio等）の実装
    console.log(`SMS sent to ${to}: ${message}`);
  }

  private async sendSlackMessage(userId: string, title: string, message: string): Promise<void> {
    // Slack API の実装
    console.log(`Slack message sent to ${userId}: ${title} - ${message}`);
  }
}