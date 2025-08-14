import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

export interface TelemetryEvent {
  eventName: string;
  userId: string;
  companyId: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface EventMetadata {
  page?: string;
  component?: string;
  feature?: string;
  duration?: number; // milliseconds
  success?: boolean;
  errorCode?: string;
  customData?: Record<string, any>;
}

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * イベント送信
   */
  async trackEvent(event: TelemetryEvent): Promise<void> {
    try {
      await this.prisma.telemetryEvent.create({
        data: {
          eventName: event.eventName,
          userId: event.userId,
          companyId: event.companyId,
          sessionId: event.sessionId,
          properties: JSON.stringify(event.properties),
          timestamp: event.timestamp,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
        },
      });

      // 重要イベントの場合はリアルタイム処理
      if (this.isHighPriorityEvent(event.eventName)) {
        await this.processHighPriorityEvent(event);
      }
    } catch (error) {
      console.error('Failed to track telemetry event:', error);
      // テレメトリの失敗でアプリケーションを止めない
    }
  }

  /**
   * ホームダッシュボード関連イベント
   */
  async trackHomeTodoClicked(
    userId: string,
    companyId: string,
    todoId: string,
    todoType: string,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'home.todo.clicked',
      userId,
      companyId,
      properties: {
        todoId,
        todoType,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  async trackShortcutUsed(
    userId: string,
    companyId: string,
    shortcutKey: string,
    action: string,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'home.shortcut.used',
      userId,
      companyId,
      properties: {
        shortcutKey,
        action,
        role: metadata.customData?.role,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * 工事台帳関連イベント
   */
  async trackProgressSaved(
    userId: string,
    companyId: string,
    projectId: string,
    progressPercent: number,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'ledger.progress.saved',
      userId,
      companyId,
      properties: {
        projectId,
        progressPercent,
        duration: metadata.duration,
        inputMethod: metadata.customData?.inputMethod, // 'shortcut' | 'form'
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * 請求書関連イベント
   */
  async trackInvoiceIssued(
    userId: string,
    companyId: string,
    invoiceId: string,
    amount: number,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'invoice.issued',
      userId,
      companyId,
      properties: {
        invoiceId,
        amount,
        billType: metadata.customData?.billType,
        generatedFrom: metadata.customData?.generatedFrom, // 'shortcut' | 'form' | 'automation'
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * アフターケア関連イベント
   */
  async trackAfterEstimateConverted(
    userId: string,
    companyId: string,
    estimateId: string,
    projectId: string,
    amount: number,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'aftercare.estimate.converted',
      userId,
      companyId,
      properties: {
        estimateId,
        projectId,
        amount,
        conversionMethod: metadata.customData?.conversionMethod, // 'merge' | 'new_project'
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * セッション開始/終了追跡
   */
  async trackSessionStart(
    userId: string,
    companyId: string,
    sessionId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'session.started',
      userId,
      companyId,
      sessionId,
      properties: {
        platform: this.extractPlatform(userAgent),
        browser: this.extractBrowser(userAgent),
      },
      timestamp: new Date(),
      userAgent,
      ipAddress,
    });
  }

  async trackSessionEnd(
    userId: string,
    companyId: string,
    sessionId: string,
    duration: number
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'session.ended',
      userId,
      companyId,
      sessionId,
      properties: {
        duration,
      },
      timestamp: new Date(),
    });
  }

  /**
   * パフォーマンス測定
   */
  async trackPerformanceMetric(
    userId: string,
    companyId: string,
    metricName: string,
    value: number,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'performance.metric',
      userId,
      companyId,
      properties: {
        metricName,
        value,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * エラー追跡
   */
  async trackError(
    userId: string,
    companyId: string,
    errorType: string,
    errorMessage: string,
    metadata: EventMetadata
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'error.occurred',
      userId,
      companyId,
      properties: {
        errorType,
        errorMessage,
        stack: metadata.customData?.stack,
        ...metadata,
      },
      timestamp: new Date(),
    });
  }

  /**
   * イベント統計取得
   */
  async getEventStats(
    companyId: string,
    startDate: Date,
    endDate: Date,
    eventNames?: string[]
  ) {
    const whereClause: any = {
      companyId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (eventNames && eventNames.length > 0) {
      whereClause.eventName = { in: eventNames };
    }

    const events = await this.prisma.telemetryEvent.findMany({
      where: whereClause,
      select: {
        eventName: true,
        userId: true,
        timestamp: true,
        properties: true,
      },
    });

    return this.aggregateEventStats(events);
  }

  /**
   * ユーザー行動分析
   */
  async getUserBehaviorAnalysis(
    companyId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const events = await this.prisma.telemetryEvent.findMany({
      where: {
        companyId,
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return {
      totalEvents: events.length,
      sessionCount: this.countUniqueSessions(events),
      mostUsedFeatures: this.getMostUsedFeatures(events),
      shortcutUsage: this.getShortcutUsage(events),
      averageSessionDuration: this.calculateAverageSessionDuration(events),
      errorRate: this.calculateErrorRate(events),
    };
  }

  /**
   * 機能利用率分析
   */
  async getFeatureUsageAnalysis(companyId: string, startDate: Date, endDate: Date) {
    const events = await this.prisma.telemetryEvent.findMany({
      where: {
        companyId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        eventName: {
          in: [
            'home.todo.clicked',
            'home.shortcut.used',
            'ledger.progress.saved',
            'invoice.issued',
            'aftercare.estimate.converted',
          ],
        },
      },
    });

    return {
      todoClickRate: this.calculateEventRate(events, 'home.todo.clicked'),
      shortcutUsageRate: this.calculateEventRate(events, 'home.shortcut.used'),
      progressSaveRate: this.calculateEventRate(events, 'ledger.progress.saved'),
      invoiceIssuanceRate: this.calculateEventRate(events, 'invoice.issued'),
      estimateConversionRate: this.calculateEventRate(events, 'aftercare.estimate.converted'),
      byRole: this.analyzeByRole(events),
    };
  }

  /**
   * UAT性能測定
   */
  async measureUATPerformance(
    userId: string,
    companyId: string,
    scenario: string,
    startTime: Date,
    endTime: Date,
    success: boolean,
    steps: Array<{ name: string; duration: number; success: boolean }>
  ) {
    const totalDuration = endTime.getTime() - startTime.getTime();

    await this.trackEvent({
      eventName: 'uat.scenario.completed',
      userId,
      companyId,
      properties: {
        scenario,
        totalDuration,
        success,
        steps,
        stepCount: steps.length,
        failedSteps: steps.filter(s => !s.success).length,
      },
      timestamp: endTime,
    });

    // シナリオ別のベンチマーク評価
    const benchmark = this.getUATBenchmark(scenario);
    const performanceGrade = totalDuration <= benchmark.excellent ? 'excellent' :
                           totalDuration <= benchmark.good ? 'good' :
                           totalDuration <= benchmark.acceptable ? 'acceptable' : 'poor';

    return {
      scenario,
      duration: totalDuration,
      success,
      performanceGrade,
      benchmark,
      improvement: benchmark.target - totalDuration,
    };
  }

  // ==================== プライベートメソッド ====================

  private isHighPriorityEvent(eventName: string): boolean {
    return ['error.occurred', 'session.started', 'invoice.issued'].includes(eventName);
  }

  private async processHighPriorityEvent(event: TelemetryEvent): Promise<void> {
    // エラーイベントの場合はアラート送信など
    if (event.eventName === 'error.occurred') {
      // 実際の実装では監視システムに通知
      console.log(`High priority event: ${event.eventName}`, event.properties);
    }
  }

  private extractPlatform(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'unknown';
  }

  private extractBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'unknown';
  }

  private aggregateEventStats(events: any[]) {
    const stats = {};
    const eventCounts = {};
    const userCounts = new Set();

    events.forEach(event => {
      const eventName = event.eventName;
      eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;
      userCounts.add(event.userId);
    });

    return {
      totalEvents: events.length,
      uniqueUsers: userCounts.size,
      eventBreakdown: eventCounts,
      timeRange: {
        start: events[0]?.timestamp,
        end: events[events.length - 1]?.timestamp,
      },
    };
  }

  private countUniqueSessions(events: any[]): number {
    const sessions = new Set();
    events.forEach(event => {
      if (event.sessionId) {
        sessions.add(event.sessionId);
      }
    });
    return sessions.size;
  }

  private getMostUsedFeatures(events: any[]): Array<{ feature: string; count: number }> {
    const featureCounts = {};
    events.forEach(event => {
      featureCounts[event.eventName] = (featureCounts[event.eventName] || 0) + 1;
    });

    return Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getShortcutUsage(events: any[]): Array<{ shortcut: string; count: number }> {
    const shortcuts = {};
    events
      .filter(event => event.eventName === 'home.shortcut.used')
      .forEach(event => {
        const properties = JSON.parse(event.properties);
        const key = properties.shortcutKey;
        shortcuts[key] = (shortcuts[key] || 0) + 1;
      });

    return Object.entries(shortcuts)
      .map(([shortcut, count]) => ({ shortcut, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateAverageSessionDuration(events: any[]): number {
    const sessionDurations = {};
    
    events.forEach(event => {
      if (event.eventName === 'session.ended') {
        const properties = JSON.parse(event.properties);
        sessionDurations[event.sessionId] = properties.duration;
      }
    });

    const durations = Object.values(sessionDurations) as number[];
    return durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;
  }

  private calculateErrorRate(events: any[]): number {
    const totalEvents = events.length;
    const errorEvents = events.filter(event => event.eventName === 'error.occurred').length;
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
  }

  private calculateEventRate(events: any[], eventName: string): number {
    const eventCount = events.filter(event => event.eventName === eventName).length;
    return events.length > 0 ? (eventCount / events.length) * 100 : 0;
  }

  private analyzeByRole(events: any[]) {
    const roleStats = {};
    
    events.forEach(event => {
      const properties = JSON.parse(event.properties);
      const role = properties.role || 'unknown';
      
      if (!roleStats[role]) {
        roleStats[role] = { total: 0, byEvent: {} };
      }
      
      roleStats[role].total++;
      roleStats[role].byEvent[event.eventName] = 
        (roleStats[role].byEvent[event.eventName] || 0) + 1;
    });

    return roleStats;
  }

  private getUATBenchmark(scenario: string): { excellent: number; good: number; acceptable: number; target: number } {
    const benchmarks = {
      'foreman_progress_to_invoice': {
        excellent: 15000, // 15秒
        good: 20000,      // 20秒
        acceptable: 25000, // 25秒
        target: 20000,    // 目標20秒
      },
      'clerk_reception_to_assignment': {
        excellent: 45000, // 45秒
        good: 60000,      // 1分
        acceptable: 75000, // 1分15秒
        target: 60000,    // 目標1分
      },
      'aftercare_inspection_to_merge': {
        excellent: 120000, // 2分
        good: 180000,      // 3分
        acceptable: 240000, // 4分
        target: 180000,    // 目標3分
      },
    };

    return benchmarks[scenario] || {
      excellent: 30000,
      good: 60000,
      acceptable: 90000,
      target: 60000,
    };
  }
}