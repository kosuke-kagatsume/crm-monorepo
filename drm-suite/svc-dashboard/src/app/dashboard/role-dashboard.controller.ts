import {
  Controller,
  Get,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { 
  RoleDashboardService,
  ConstructionManagerDashboard,
  AccountingDashboard,
  AftercareDashboard,
} from './role-dashboard.service';
import { WidgetService, WidgetData } from './widget.service';

@Controller('dashboard')
export class RoleDashboardController {
  constructor(
    private readonly roleDashboardService: RoleDashboardService,
    private readonly widgetService: WidgetService,
  ) {}

  /**
   * 施工管理者向けダッシュボード
   */
  @Get('construction-manager/:companyId')
  async getConstructionManagerDashboard(
    @Param('companyId') companyId: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<ConstructionManagerDashboard> {
    this.validateRole(userRole, ['construction_manager', 'project_manager', 'site_supervisor', 'admin']);
    
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    return this.roleDashboardService.getConstructionManagerDashboard(
      companyId,
      userId,
      storeId
    );
  }

  /**
   * 事務・経理担当者向けダッシュボード
   */
  @Get('accounting/:companyId')
  async getAccountingDashboard(
    @Param('companyId') companyId: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<AccountingDashboard> {
    this.validateRole(userRole, ['accounting', 'finance', 'office_manager', 'admin']);

    return this.roleDashboardService.getAccountingDashboard(
      companyId,
      storeId
    );
  }

  /**
   * アフターケア担当者向けダッシュボード
   */
  @Get('aftercare/:companyId')
  async getAftercareDashboard(
    @Param('companyId') companyId: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<AftercareDashboard> {
    this.validateRole(userRole, ['aftercare', 'customer_service', 'maintenance', 'admin']);
    
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    return this.roleDashboardService.getAftercareDashboard(
      companyId,
      userId,
      storeId
    );
  }

  /**
   * 統合ダッシュボード（管理者向け）
   */
  @Get('integrated/:companyId')
  async getIntegratedDashboard(
    @Param('companyId') companyId: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateRole(userRole, ['admin', 'owner', 'general_manager']);
    
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    // 全ての役職別ダッシュボードデータを統合
    const [constructionData, accountingData, aftercareData] = await Promise.all([
      this.roleDashboardService.getConstructionManagerDashboard(companyId, userId, storeId),
      this.roleDashboardService.getAccountingDashboard(companyId, storeId),
      this.roleDashboardService.getAftercareDashboard(companyId, userId, storeId),
    ]);

    return {
      construction: constructionData,
      accounting: accountingData,
      aftercare: aftercareData,
      overview: {
        totalActiveProjects: constructionData.activeProjects,
        totalReceivables: accountingData.totalReceivables,
        totalUpcomingInspections: aftercareData.upcomingInspections,
        overallHealthScore: this.calculateHealthScore(constructionData, accountingData, aftercareData),
      },
    };
  }

  /**
   * 役職別アラート一覧
   */
  @Get('alerts/:companyId/:role')
  async getRoleAlerts(
    @Param('companyId') companyId: string,
    @Param('role') role: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateRole(userRole, [role, 'admin']);

    const alerts = [];

    switch (role) {
      case 'construction_manager':
        const constructionData = await this.roleDashboardService.getConstructionManagerDashboard(
          companyId,
          userId!,
          storeId
        );
        
        // 進捗遅延アラート
        constructionData.progressAlerts.forEach(alert => {
          alerts.push({
            type: 'progress_delay',
            severity: alert.variance < -20 ? 'high' : 'medium',
            title: `${alert.projectName}の進捗遅延`,
            message: `予定より${Math.abs(alert.variance).toFixed(1)}%遅延しています`,
            projectId: alert.projectId,
          });
        });

        // 品質問題アラート
        constructionData.qualityIssues.forEach(issue => {
          alerts.push({
            type: 'quality_issue',
            severity: issue.severity,
            title: '品質問題の報告',
            message: issue.issue,
            projectId: issue.projectId,
          });
        });

        // 安全アラート
        if (constructionData.safetyMetrics.riskLevel === 'high') {
          alerts.push({
            type: 'safety_risk',
            severity: 'high',
            title: '安全リスクが高い状態です',
            message: `過去12ヶ月で${constructionData.safetyMetrics.totalIncidents}件の事故が発生`,
          });
        }

        break;

      case 'accounting':
        const accountingData = await this.roleDashboardService.getAccountingDashboard(
          companyId,
          storeId
        );

        // 延滞請求書アラート
        if (accountingData.overdueInvoices > 0) {
          alerts.push({
            type: 'overdue_invoices',
            severity: accountingData.overdueInvoices > 5 ? 'high' : 'medium',
            title: '延滞請求書があります',
            message: `${accountingData.overdueInvoices}件の請求書が支払い期限を過ぎています`,
          });
        }

        // 予算超過アラート
        accountingData.budgetVariance.forEach(project => {
          if (project.variancePercent > 10) {
            alerts.push({
              type: 'budget_overrun',
              severity: project.variancePercent > 20 ? 'high' : 'medium',
              title: `${project.projectName}の予算超過`,
              message: `予算を${project.variancePercent.toFixed(1)}%超過しています`,
              projectId: project.projectId,
            });
          }
        });

        // 税務期限アラート
        accountingData.taxDeadlines.forEach(deadline => {
          const daysUntilDue = Math.ceil((deadline.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 30 && daysUntilDue > 0) {
            alerts.push({
              type: 'tax_deadline',
              severity: daysUntilDue <= 7 ? 'high' : 'medium',
              title: `${deadline.type}の期限が近づいています`,
              message: `あと${daysUntilDue}日で期限です`,
            });
          }
        });

        break;

      case 'aftercare':
        const aftercareData = await this.roleDashboardService.getAftercareDashboard(
          companyId,
          userId!,
          storeId
        );

        // 遅延点検アラート
        if (aftercareData.overdueInspections > 0) {
          alerts.push({
            type: 'overdue_inspections',
            severity: 'high',
            title: '遅延している点検があります',
            message: `${aftercareData.overdueInspections}件の点検が予定日を過ぎています`,
          });
        }

        // 保証期限アラート
        aftercareData.warrantyExpirations.forEach(warranty => {
          if (warranty.daysRemaining <= 30) {
            alerts.push({
              type: 'warranty_expiring',
              severity: warranty.daysRemaining <= 7 ? 'high' : 'medium',
              title: `${warranty.customerName}様の保証期限`,
              message: `${warranty.warrantyType}保証があと${warranty.daysRemaining}日で期限切れです`,
              customerId: warranty.customerId,
            });
          }
        });

        // 未解決不具合アラート
        if (aftercareData.activeDefects > 10) {
          alerts.push({
            type: 'active_defects',
            severity: 'medium',
            title: '未解決の不具合が多数あります',
            message: `${aftercareData.activeDefects}件の不具合が未解決です`,
          });
        }

        break;
    }

    // 重要度でソート
    alerts.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return alerts;
  }

  /**
   * 役職別パフォーマンス指標
   */
  @Get('performance/:companyId/:role')
  async getRolePerformance(
    @Param('companyId') companyId: string,
    @Param('role') role: string,
    @Query('storeId') storeId?: string,
    @Query('period') period: string = '30', // days
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateRole(userRole, [role, 'admin']);

    const periodDays = parseInt(period);
    const performance = {};

    switch (role) {
      case 'construction_manager':
        // 施工管理者のパフォーマンス指標
        performance['projectCompletionRate'] = await this.calculateProjectCompletionRate(companyId, userId!, periodDays);
        performance['averageProjectDuration'] = await this.calculateAverageProjectDuration(companyId, userId!, periodDays);
        performance['qualityScore'] = await this.calculateQualityScore(companyId, userId!, periodDays);
        performance['safetyScore'] = await this.calculateSafetyScore(companyId, storeId, periodDays);
        break;

      case 'accounting':
        // 事務・経理のパフォーマンス指標
        performance['collectionRate'] = await this.calculateCollectionRate(companyId, storeId, periodDays);
        performance['budgetAccuracy'] = await this.calculateBudgetAccuracy(companyId, storeId, periodDays);
        performance['profitMargin'] = await this.calculateOverallProfitMargin(companyId, storeId, periodDays);
        performance['cashFlowHealth'] = await this.calculateCashFlowHealth(companyId, storeId);
        break;

      case 'aftercare':
        // アフターケアのパフォーマンス指標
        performance['inspectionCompletionRate'] = await this.calculateInspectionCompletionRate(companyId, storeId, periodDays);
        performance['customerSatisfactionTrend'] = await this.calculateSatisfactionTrend(companyId, storeId, periodDays);
        performance['defectResolutionTime'] = await this.calculateDefectResolutionTime(companyId, storeId, periodDays);
        performance['warrantyClaimRate'] = await this.calculateWarrantyClaimRate(companyId, storeId, periodDays);
        break;
    }

    return performance;
  }

  // ==================== プライベートメソッド ====================

  private validateRole(userRole: string | undefined, allowedRoles: string[]) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new UnauthorizedException('Insufficient permissions for this dashboard');
    }
  }

  private calculateHealthScore(
    construction: ConstructionManagerDashboard,
    accounting: AccountingDashboard,
    aftercare: AftercareDashboard
  ): number {
    let score = 100;

    // 施工管理関連の減点
    if (construction.progressAlerts.length > 0) score -= 10;
    if (construction.qualityIssues.length > 0) score -= 5;
    if (construction.safetyMetrics.riskLevel === 'high') score -= 15;
    if (construction.safetyMetrics.riskLevel === 'medium') score -= 5;

    // 経理関連の減点
    if (accounting.overdueInvoices > 5) score -= 10;
    if (accounting.overdueInvoices > 0) score -= 5;

    // アフターケア関連の減点
    if (aftercare.overdueInspections > 0) score -= 10;
    if (aftercare.activeDefects > 10) score -= 5;

    return Math.max(score, 0);
  }

  // パフォーマンス計算メソッド（簡易版）
  private async calculateProjectCompletionRate(companyId: string, userId: string, periodDays: number): Promise<number> {
    // プロジェクト完了率の計算
    return 85; // 仮の値
  }

  private async calculateAverageProjectDuration(companyId: string, userId: string, periodDays: number): Promise<number> {
    // 平均プロジェクト期間の計算
    return 60; // 日数
  }

  private async calculateQualityScore(companyId: string, userId: string, periodDays: number): Promise<number> {
    // 品質スコアの計算
    return 92; // 仮の値
  }

  private async calculateSafetyScore(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 安全スコアの計算
    return 95; // 仮の値
  }

  private async calculateCollectionRate(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 回収率の計算
    return 88; // 仮の値
  }

  private async calculateBudgetAccuracy(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 予算精度の計算
    return 93; // 仮の値
  }

  private async calculateOverallProfitMargin(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 全体利益率の計算
    return 15.2; // パーセント
  }

  private async calculateCashFlowHealth(companyId: string, storeId: string | undefined): Promise<number> {
    // キャッシュフロー健全性の計算
    return 78; // 仮の値
  }

  private async calculateInspectionCompletionRate(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 点検完了率の計算
    return 96; // 仮の値
  }

  private async calculateSatisfactionTrend(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 満足度トレンドの計算
    return 4.2; // 5点満点
  }

  private async calculateDefectResolutionTime(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 不具合解決時間の計算
    return 5.5; // 日数
  }

  private async calculateWarrantyClaimRate(companyId: string, storeId: string | undefined, periodDays: number): Promise<number> {
    // 保証クレーム率の計算
    return 2.1; // パーセント
  }

  // ==================== ウィジェット API ====================

  /**
   * 役職別ウィジェット一覧取得
   */
  @Get('widgets/:companyId/:role')
  async getRoleWidgets(
    @Param('companyId') companyId: string,
    @Param('role') role: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<WidgetData[]> {
    this.validateRole(userRole, [role, 'admin']);

    const widgets: WidgetData[] = [];

    switch (role) {
      case 'construction_manager':
        widgets.push(
          await this.widgetService.getProjectProgressChart(companyId, userId!, storeId),
          await this.widgetService.getTodayTasksList(companyId, userId!, storeId),
          await this.widgetService.getResourceUtilizationGauge(companyId, storeId),
          await this.widgetService.getAlertsWidget(companyId, role, userId, storeId)
        );
        break;

      case 'accounting':
        widgets.push(
          await this.widgetService.getCashFlowChart(companyId, storeId),
          await this.widgetService.getReceivablesTable(companyId, storeId),
          await this.widgetService.getProfitMarginChart(companyId, storeId),
          await this.widgetService.getAlertsWidget(companyId, role, userId, storeId)
        );
        break;

      case 'aftercare':
        widgets.push(
          await this.widgetService.getInspectionSchedule(companyId, storeId),
          await this.widgetService.getSatisfactionTrend(companyId, storeId),
          await this.widgetService.getDefectCategoryChart(companyId, storeId),
          await this.widgetService.getAlertsWidget(companyId, role, userId, storeId)
        );
        break;
    }

    return widgets;
  }

  /**
   * 個別ウィジェットデータ取得
   */
  @Get('widgets/:companyId/:role/:widgetId')
  async getWidget(
    @Param('companyId') companyId: string,
    @Param('role') role: string,
    @Param('widgetId') widgetId: string,
    @Query('storeId') storeId?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<WidgetData | null> {
    this.validateRole(userRole, [role, 'admin']);

    // ウィジェットIDに基づいて適切なウィジェットデータを返す
    switch (widgetId) {
      case 'project-progress-chart':
        return this.widgetService.getProjectProgressChart(companyId, userId!, storeId);
      case 'today-tasks-list':
        return this.widgetService.getTodayTasksList(companyId, userId!, storeId);
      case 'resource-utilization-gauge':
        return this.widgetService.getResourceUtilizationGauge(companyId, storeId);
      case 'cashflow-chart':
        return this.widgetService.getCashFlowChart(companyId, storeId);
      case 'receivables-table':
        return this.widgetService.getReceivablesTable(companyId, storeId);
      case 'profit-margin-chart':
        return this.widgetService.getProfitMarginChart(companyId, storeId);
      case 'inspection-schedule':
        return this.widgetService.getInspectionSchedule(companyId, storeId);
      case 'satisfaction-trend':
        return this.widgetService.getSatisfactionTrend(companyId, storeId);
      case 'defect-category-chart':
        return this.widgetService.getDefectCategoryChart(companyId, storeId);
      case 'alerts-widget':
        return this.widgetService.getAlertsWidget(companyId, role, userId, storeId);
      default:
        return null;
    }
  }
}