import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

export interface ConstructionManagerDashboard {
  activeProjects: number;
  todayTasks: number;
  upcomingDeadlines: Array<{
    projectId: string;
    projectName: string;
    taskName: string;
    dueDate: Date;
    priority: string;
  }>;
  progressAlerts: Array<{
    projectId: string;
    projectName: string;
    expectedProgress: number;
    actualProgress: number;
    variance: number;
  }>;
  qualityIssues: Array<{
    projectId: string;
    issue: string;
    severity: string;
    reportedAt: Date;
  }>;
  resourceUtilization: {
    staff: number;
    equipment: number;
    vehicles: number;
  };
  weatherAlerts: Array<{
    date: string;
    condition: string;
    impact: string;
  }>;
  safetyMetrics: {
    daysWithoutIncident: number;
    totalIncidents: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface AccountingDashboard {
  totalReceivables: number;
  totalPayables: number;
  overdueInvoices: number;
  cashFlowForecast: Array<{
    date: string;
    inflow: number;
    outflow: number;
    balance: number;
  }>;
  budgetVariance: Array<{
    projectId: string;
    projectName: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
  }>;
  profitMargins: Array<{
    projectId: string;
    projectName: string;
    revenue: number;
    costs: number;
    margin: number;
    marginPercent: number;
  }>;
  taxDeadlines: Array<{
    type: string;
    dueDate: Date;
    amount: number;
    status: string;
  }>;
  reconciliationStatus: {
    bankAccounts: number;
    pendingEntries: number;
    lastReconciled: Date;
  };
}

export interface AftercareDashboard {
  upcomingInspections: number;
  overdueInspections: number;
  activeDefects: number;
  warrantyExpirations: Array<{
    customerId: string;
    customerName: string;
    warrantyType: string;
    expirationDate: Date;
    daysRemaining: number;
  }>;
  satisfactionMetrics: {
    averageNPS: number;
    averageSatisfaction: number;
    totalResponses: number;
    responseRate: number;
  };
  maintenanceContracts: {
    active: number;
    expiringSoon: number;
    revenue: number;
  };
  defectsByCategory: Record<string, number>;
  customerCommunication: Array<{
    customerId: string;
    customerName: string;
    lastContact: Date;
    nextScheduled: Date;
    priority: string;
  }>;
}

@Injectable()
export class RoleDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 施工管理ダッシュボード ====================

  async getConstructionManagerDashboard(
    companyId: string,
    userId: string,
    storeId?: string
  ): Promise<ConstructionManagerDashboard> {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    // アクティブプロジェクト数
    const activeProjects = await this.prisma.project.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['planning', 'in_progress'] },
        // 担当者フィルター
        OR: [
          { managerId: userId },
          { assignedUsers: { some: { userId } } },
        ],
      },
    });

    // 今日のタスク
    const todayTasks = await this.prisma.task.count({
      where: {
        project: {
          companyId,
          ...(storeId && { storeId }),
        },
        assignedTo: userId,
        dueDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        status: { not: 'completed' },
      },
    });

    // 近日中の期限
    const upcomingDeadlines = await this.prisma.task.findMany({
      where: {
        project: {
          companyId,
          ...(storeId && { storeId }),
        },
        assignedTo: userId,
        dueDate: {
          gte: today,
          lte: nextWeek,
        },
        status: { not: 'completed' },
      },
      include: {
        project: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 10,
    });

    // 進捗アラート
    const progressAlerts = await this.getProgressAlerts(companyId, userId, storeId);

    // 品質問題
    const qualityIssues = await this.prisma.qualityIssue.findMany({
      where: {
        project: {
          companyId,
          ...(storeId && { storeId }),
        },
        status: { not: 'resolved' },
        reportedAt: {
          gte: subWeeks(today, 2),
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: 5,
    });

    // リソース利用状況
    const resourceUtilization = await this.getResourceUtilization(companyId, storeId);

    // 安全指標
    const safetyMetrics = await this.getSafetyMetrics(companyId, storeId);

    return {
      activeProjects,
      todayTasks,
      upcomingDeadlines: upcomingDeadlines.map(task => ({
        projectId: task.projectId,
        projectName: task.project.name,
        taskName: task.name,
        dueDate: task.dueDate,
        priority: task.priority || 'medium',
      })),
      progressAlerts,
      qualityIssues: qualityIssues.map(issue => ({
        projectId: issue.projectId,
        issue: issue.description,
        severity: issue.severity,
        reportedAt: issue.reportedAt,
      })),
      resourceUtilization,
      weatherAlerts: [], // 外部API連携で実装
      safetyMetrics,
    };
  }

  // ==================== 事務・経理ダッシュボード ====================

  async getAccountingDashboard(
    companyId: string,
    storeId?: string
  ): Promise<AccountingDashboard> {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // 売掛金総額
    const totalReceivables = await this.prisma.invoice.aggregate({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['sent', 'partial'] },
      },
      _sum: {
        amount: true,
      },
    });

    // 買掛金総額
    const totalPayables = await this.prisma.bill.aggregate({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['received', 'partial'] },
      },
      _sum: {
        amount: true,
      },
    });

    // 延滞請求書
    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        dueDate: { lt: today },
        status: { in: ['sent', 'partial'] },
      },
    });

    // キャッシュフロー予測
    const cashFlowForecast = await this.generateCashFlowForecast(companyId, storeId);

    // 予算差異
    const budgetVariance = await this.getBudgetVarianceReport(companyId, storeId);

    // 利益率
    const profitMargins = await this.getProfitMarginReport(companyId, storeId);

    // 税務期限
    const taxDeadlines = await this.getTaxDeadlines(companyId);

    // 帳簿調整状況
    const reconciliationStatus = await this.getReconciliationStatus(companyId, storeId);

    return {
      totalReceivables: totalReceivables._sum.amount || 0,
      totalPayables: totalPayables._sum.amount || 0,
      overdueInvoices,
      cashFlowForecast,
      budgetVariance,
      profitMargins,
      taxDeadlines,
      reconciliationStatus,
    };
  }

  // ==================== アフターケアダッシュボード ====================

  async getAftercareDashboard(
    companyId: string,
    userId: string,
    storeId?: string
  ): Promise<AftercareDashboard> {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    // 近日点検
    const upcomingInspections = await this.prisma.afterCareSchedule.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
        status: { in: ['scheduled', 'reminded'] },
      },
    });

    // 遅延点検
    const overdueInspections = await this.prisma.afterCareSchedule.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: { lt: today },
        status: { in: ['scheduled', 'reminded'] },
      },
    });

    // 未解決不具合
    const activeDefects = await this.prisma.defectCase.count({
      where: {
        schedule: {
          companyId,
          ...(storeId && { storeId }),
        },
        status: { not: 'completed' },
      },
    });

    // 保証期限切れ間近
    const warrantyExpirations = await this.prisma.warrantyRecord.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        endDate: {
          gte: today,
          lte: addDays(today, 90),
        },
        isActive: true,
      },
      include: {
        customer: true,
      },
      orderBy: {
        endDate: 'asc',
      },
      take: 10,
    });

    // 満足度指標
    const satisfactionMetrics = await this.getSatisfactionMetrics(companyId, storeId);

    // メンテナンス契約
    const maintenanceContracts = await this.getMaintenanceContractStats(companyId, storeId);

    // カテゴリ別不具合
    const defectsByCategory = await this.getDefectsByCategory(companyId, storeId);

    // 顧客コミュニケーション
    const customerCommunication = await this.getCustomerCommunicationStatus(companyId, storeId);

    return {
      upcomingInspections,
      overdueInspections,
      activeDefects,
      warrantyExpirations: warrantyExpirations.map(warranty => ({
        customerId: warranty.customerId,
        customerName: warranty.customer.name,
        warrantyType: warranty.warrantyType,
        expirationDate: warranty.endDate,
        daysRemaining: Math.ceil((warranty.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      satisfactionMetrics,
      maintenanceContracts,
      defectsByCategory,
      customerCommunication,
    };
  }

  // ==================== ヘルパーメソッド ====================

  private async getProgressAlerts(companyId: string, userId: string, storeId?: string) {
    // 進捗遅延プロジェクトを検出
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: 'in_progress',
        OR: [
          { managerId: userId },
          { assignedUsers: { some: { userId } } },
        ],
      },
      include: {
        tasks: {
          where: { status: 'completed' },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return projects
      .map(project => {
        const totalTasks = project._count.tasks;
        const completedTasks = project.tasks.length;
        const actualProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        
        // 予定進捗率を計算（簡易版）
        const expectedProgress = this.calculateExpectedProgress(project.startDate, project.endDate);
        const variance = actualProgress - expectedProgress;
        
        return {
          projectId: project.id,
          projectName: project.name,
          expectedProgress,
          actualProgress,
          variance,
        };
      })
      .filter(alert => alert.variance < -10) // 10%以上遅延
      .slice(0, 5);
  }

  private calculateExpectedProgress(startDate: Date, endDate: Date): number {
    const now = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return (elapsed / totalDuration) * 100;
  }

  private async getResourceUtilization(companyId: string, storeId?: string) {
    const today = new Date();
    
    // スタッフ利用率
    const totalStaff = await this.prisma.user.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        isActive: true,
      },
    });

    const assignedStaff = await this.prisma.user.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        isActive: true,
        projectAssignments: {
          some: {
            project: {
              status: 'in_progress',
            },
          },
        },
      },
    });

    // 機材・車両利用率
    const totalEquipment = await this.prisma.resource.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        type: 'equipment',
        isActive: true,
      },
    });

    const usedEquipment = await this.prisma.resource.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        type: 'equipment',
        isActive: true,
        bookings: {
          some: {
            startTime: { lte: today },
            endTime: { gte: today },
            status: 'confirmed',
          },
        },
      },
    });

    const totalVehicles = await this.prisma.resource.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        type: 'vehicle',
        isActive: true,
      },
    });

    const usedVehicles = await this.prisma.resource.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        type: 'vehicle',
        isActive: true,
        bookings: {
          some: {
            startTime: { lte: today },
            endTime: { gte: today },
            status: 'confirmed',
          },
        },
      },
    });

    return {
      staff: totalStaff > 0 ? Math.round((assignedStaff / totalStaff) * 100) : 0,
      equipment: totalEquipment > 0 ? Math.round((usedEquipment / totalEquipment) * 100) : 0,
      vehicles: totalVehicles > 0 ? Math.round((usedVehicles / totalVehicles) * 100) : 0,
    };
  }

  private async getSafetyMetrics(companyId: string, storeId?: string) {
    const today = new Date();
    const lastIncident = await this.prisma.safetyIncident.findFirst({
      where: {
        companyId,
        ...(storeId && { storeId }),
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    const totalIncidents = await this.prisma.safetyIncident.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        incidentDate: {
          gte: subMonths(today, 12),
        },
      },
    });

    const daysWithoutIncident = lastIncident
      ? Math.floor((today.getTime() - lastIncident.incidentDate.getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalIncidents > 10) riskLevel = 'high';
    else if (totalIncidents > 3) riskLevel = 'medium';

    return {
      daysWithoutIncident,
      totalIncidents,
      riskLevel,
    };
  }

  private async generateCashFlowForecast(companyId: string, storeId?: string) {
    // 今後30日間のキャッシュフロー予測
    const forecasts = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 入金予定
      const inflow = await this.prisma.invoice.aggregate({
        where: {
          companyId,
          ...(storeId && { storeId }),
          dueDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
          status: { in: ['sent', 'partial'] },
        },
        _sum: { amount: true },
      });

      // 支払予定
      const outflow = await this.prisma.bill.aggregate({
        where: {
          companyId,
          ...(storeId && { storeId }),
          dueDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
          status: { in: ['received', 'partial'] },
        },
        _sum: { amount: true },
      });

      forecasts.push({
        date: dateStr,
        inflow: inflow._sum.amount || 0,
        outflow: outflow._sum.amount || 0,
        balance: (inflow._sum.amount || 0) - (outflow._sum.amount || 0),
      });
    }

    return forecasts;
  }

  private async getBudgetVarianceReport(companyId: string, storeId?: string) {
    // プロジェクト別予算差異
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['in_progress', 'completed'] },
      },
      include: {
        expenses: true,
      },
    });

    return projects.map(project => {
      const budgeted = project.budget || 0;
      const actual = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const variance = actual - budgeted;
      const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        budgeted,
        actual,
        variance,
        variancePercent,
      };
    });
  }

  private async getProfitMarginReport(companyId: string, storeId?: string) {
    // プロジェクト別利益率
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['in_progress', 'completed'] },
      },
      include: {
        expenses: true,
        contract: true,
      },
    });

    return projects.map(project => {
      const revenue = project.contract?.amount || 0;
      const costs = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const margin = revenue - costs;
      const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        revenue,
        costs,
        margin,
        marginPercent,
      };
    });
  }

  private async getTaxDeadlines(companyId: string) {
    // 税務期限（簡易版）
    const today = new Date();
    const thisYear = today.getFullYear();
    
    return [
      {
        type: '消費税',
        dueDate: new Date(thisYear, 2, 31), // 3月31日
        amount: 0, // 実際の計算が必要
        status: 'pending',
      },
      {
        type: '法人税',
        dueDate: new Date(thisYear, 4, 31), // 5月31日
        amount: 0,
        status: 'pending',
      },
    ];
  }

  private async getReconciliationStatus(companyId: string, storeId?: string) {
    // 帳簿調整状況（簡易版）
    return {
      bankAccounts: 3,
      pendingEntries: 0,
      lastReconciled: subDays(new Date(), 1),
    };
  }

  private async getSatisfactionMetrics(companyId: string, storeId?: string) {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const surveys = await this.prisma.customerSatisfaction.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        surveyDate: { gte: thirtyDaysAgo },
      },
    });

    if (surveys.length === 0) {
      return {
        averageNPS: 0,
        averageSatisfaction: 0,
        totalResponses: 0,
        responseRate: 0,
      };
    }

    const totalNPS = surveys.reduce((sum, s) => sum + s.npsScore, 0);
    const totalSatisfaction = surveys.reduce((sum, s) => sum + s.satisfactionScore, 0);

    return {
      averageNPS: totalNPS / surveys.length,
      averageSatisfaction: totalSatisfaction / surveys.length,
      totalResponses: surveys.length,
      responseRate: 75, // 仮の値
    };
  }

  private async getMaintenanceContractStats(companyId: string, storeId?: string) {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);

    const active = await this.prisma.maintenanceContract.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: 'active',
        endDate: { gte: today },
      },
    });

    const expiringSoon = await this.prisma.maintenanceContract.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: 'active',
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
    });

    const revenueSum = await this.prisma.maintenanceContract.aggregate({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: 'active',
      },
      _sum: { amount: true },
    });

    return {
      active,
      expiringSoon,
      revenue: revenueSum._sum.amount || 0,
    };
  }

  private async getDefectsByCategory(companyId: string, storeId?: string) {
    const defects = await this.prisma.defectCase.groupBy({
      by: ['category'],
      where: {
        schedule: {
          companyId,
          ...(storeId && { storeId }),
        },
        status: { not: 'completed' },
      },
      _count: true,
    });

    const result = {};
    defects.forEach(defect => {
      result[defect.category] = defect._count;
    });

    return result;
  }

  private async getCustomerCommunicationStatus(companyId: string, storeId?: string) {
    // 顧客コミュニケーション状況（簡易版）
    const customers = await this.prisma.customer.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
      },
      include: {
        afterCareSchedules: {
          where: {
            status: { in: ['scheduled', 'reminded'] },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 1,
        },
      },
      take: 5,
    });

    return customers.map(customer => ({
      customerId: customer.id,
      customerName: customer.name,
      lastContact: subDays(new Date(), Math.floor(Math.random() * 30)), // 仮の値
      nextScheduled: customer.afterCareSchedules[0]?.scheduledDate || addDays(new Date(), 30),
      priority: 'medium',
    }));
  }
}