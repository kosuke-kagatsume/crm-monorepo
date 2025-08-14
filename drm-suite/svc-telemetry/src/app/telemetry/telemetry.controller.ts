import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { TelemetryService, TelemetryEvent, EventMetadata } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * 汎用イベント送信
   */
  @Post('events')
  async trackEvent(
    @Body() eventData: {
      eventName: string;
      properties: Record<string, any>;
      sessionId?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    const event: TelemetryEvent = {
      eventName: eventData.eventName,
      userId,
      companyId,
      sessionId: eventData.sessionId,
      properties: eventData.properties,
      timestamp: new Date(),
      userAgent,
      ipAddress,
    };

    await this.telemetryService.trackEvent(event);
    return { success: true };
  }

  /**
   * バッチイベント送信（複数イベントを一度に送信）
   */
  @Post('events/batch')
  async trackBatchEvents(
    @Body() eventsData: {
      events: Array<{
        eventName: string;
        properties: Record<string, any>;
        timestamp?: string;
      }>;
      sessionId?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    const promises = eventsData.events.map(eventData => {
      const event: TelemetryEvent = {
        eventName: eventData.eventName,
        userId,
        companyId,
        sessionId: eventsData.sessionId,
        properties: eventData.properties,
        timestamp: eventData.timestamp ? new Date(eventData.timestamp) : new Date(),
        userAgent,
        ipAddress,
      };

      return this.telemetryService.trackEvent(event);
    });

    await Promise.all(promises);
    return { success: true, processed: eventsData.events.length };
  }

  /**
   * ホームダッシュボード専用イベント
   */
  @Post('home/todo-clicked')
  async trackHomeTodoClicked(
    @Body() data: {
      todoId: string;
      todoType: string;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackHomeTodoClicked(
      userId,
      companyId,
      data.todoId,
      data.todoType,
      data.metadata || {}
    );

    return { success: true };
  }

  @Post('home/shortcut-used')
  async trackShortcutUsed(
    @Body() data: {
      shortcutKey: string;
      action: string;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackShortcutUsed(
      userId,
      companyId,
      data.shortcutKey,
      data.action,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * 工事台帳専用イベント
   */
  @Post('ledger/progress-saved')
  async trackProgressSaved(
    @Body() data: {
      projectId: string;
      progressPercent: number;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackProgressSaved(
      userId,
      companyId,
      data.projectId,
      data.progressPercent,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * 請求書専用イベント
   */
  @Post('invoice/issued')
  async trackInvoiceIssued(
    @Body() data: {
      invoiceId: string;
      amount: number;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackInvoiceIssued(
      userId,
      companyId,
      data.invoiceId,
      data.amount,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * アフターケア専用イベント
   */
  @Post('aftercare/estimate-converted')
  async trackAfterEstimateConverted(
    @Body() data: {
      estimateId: string;
      projectId: string;
      amount: number;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackAfterEstimateConverted(
      userId,
      companyId,
      data.estimateId,
      data.projectId,
      data.amount,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * セッション管理
   */
  @Post('session/start')
  async trackSessionStart(
    @Body() data: { sessionId: string },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackSessionStart(
      userId,
      companyId,
      data.sessionId,
      userAgent,
      ipAddress
    );

    return { success: true };
  }

  @Post('session/end')
  async trackSessionEnd(
    @Body() data: { sessionId: string; duration: number },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackSessionEnd(
      userId,
      companyId,
      data.sessionId,
      data.duration
    );

    return { success: true };
  }

  /**
   * パフォーマンス測定
   */
  @Post('performance')
  async trackPerformanceMetric(
    @Body() data: {
      metricName: string;
      value: number;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackPerformanceMetric(
      userId,
      companyId,
      data.metricName,
      data.value,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * エラー追跡
   */
  @Post('error')
  async trackError(
    @Body() data: {
      errorType: string;
      errorMessage: string;
      metadata?: EventMetadata;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    await this.telemetryService.trackError(
      userId,
      companyId,
      data.errorType,
      data.errorMessage,
      data.metadata || {}
    );

    return { success: true };
  }

  /**
   * UAT性能測定
   */
  @Post('uat/scenario')
  async measureUATPerformance(
    @Body() data: {
      scenario: string;
      startTime: string;
      endTime: string;
      success: boolean;
      steps: Array<{ name: string; duration: number; success: boolean }>;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!userId || !companyId) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    const result = await this.telemetryService.measureUATPerformance(
      userId,
      companyId,
      data.scenario,
      new Date(data.startTime),
      new Date(data.endTime),
      data.success,
      data.steps
    );

    return { success: true, ...result };
  }

  /**
   * 統計データ取得
   */
  @Get('stats/:companyId')
  async getEventStats(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('events') events?: string, // カンマ区切り
    @Headers('x-user-role') userRole?: string,
  ) {
    // 管理者のみアクセス可能
    if (!userRole || !['admin', 'owner', 'general_manager'].includes(userRole)) {
      throw new UnauthorizedException('統計データにアクセスする権限がありません');
    }

    const eventNames = events ? events.split(',') : undefined;
    const stats = await this.telemetryService.getEventStats(
      companyId,
      new Date(startDate),
      new Date(endDate),
      eventNames
    );

    return stats;
  }

  /**
   * ユーザー行動分析
   */
  @Get('analysis/user/:companyId/:userId')
  async getUserBehaviorAnalysis(
    @Param('companyId') companyId: string,
    @Param('userId') targetUserId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // 自分のデータまたは管理者のみアクセス可能
    if (userId !== targetUserId && !['admin', 'owner', 'general_manager'].includes(userRole || '')) {
      throw new UnauthorizedException('このユーザーの分析データにアクセスする権限がありません');
    }

    const analysis = await this.telemetryService.getUserBehaviorAnalysis(
      companyId,
      targetUserId,
      new Date(startDate),
      new Date(endDate)
    );

    return analysis;
  }

  /**
   * 機能利用率分析
   */
  @Get('analysis/features/:companyId')
  async getFeatureUsageAnalysis(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // 管理者のみアクセス可能
    if (!userRole || !['admin', 'owner', 'general_manager'].includes(userRole)) {
      throw new UnauthorizedException('機能利用率分析にアクセスする権限がありません');
    }

    const analysis = await this.telemetryService.getFeatureUsageAnalysis(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    return analysis;
  }

  /**
   * リアルタイム統計
   */
  @Get('realtime/:companyId')
  async getRealtimeStats(
    @Param('companyId') companyId: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // 管理者のみアクセス可能
    if (!userRole || !['admin', 'owner', 'general_manager'].includes(userRole)) {
      throw new UnauthorizedException('リアルタイム統計にアクセスする権限がありません');
    }

    // 過去1時間のデータ
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    const stats = await this.telemetryService.getEventStats(
      companyId,
      oneHourAgo,
      now,
      ['home.todo.clicked', 'home.shortcut.used', 'ledger.progress.saved', 'invoice.issued', 'aftercare.estimate.converted']
    );

    return {
      ...stats,
      timeRange: 'last_1_hour',
      refreshedAt: now,
    };
  }
}