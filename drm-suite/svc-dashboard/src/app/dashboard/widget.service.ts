import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, subDays, subWeeks, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export interface WidgetData {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'list' | 'gauge' | 'table';
  data: any;
  config?: {
    chartType?: 'line' | 'bar' | 'pie' | 'donut';
    colors?: string[];
    showLegend?: boolean;
    refreshInterval?: number; // seconds
  };
}

@Injectable()
export class WidgetService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== 施工管理用ウィジェット ====================

  /**
   * プロジェクト進捗チャート
   */
  async getProjectProgressChart(companyId: string, userId: string, storeId?: string): Promise<WidgetData> {
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
        tasks: true,
        _count: {
          select: { tasks: true },
        },
      },
      take: 10,
    });

    const chartData = projects.map(project => {
      const totalTasks = project._count.tasks;
      const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        progress: Math.round(progress),
        status: progress < 30 ? 'red' : progress < 70 ? 'yellow' : 'green',
      };
    });

    return {
      id: 'project-progress-chart',
      title: 'プロジェクト進捗',
      type: 'chart',
      data: chartData,
      config: {
        chartType: 'bar',
        colors: ['#10B981', '#F59E0B', '#EF4444'],
        refreshInterval: 300, // 5分
      },
    };
  }

  /**
   * 今日のタスクリスト
   */
  async getTodayTasksList(companyId: string, userId: string, storeId?: string): Promise<WidgetData> {
    const today = new Date();
    const tasks = await this.prisma.task.findMany({
      where: {
        project: {
          companyId,
          ...(storeId && { storeId }),
        },
        assignedTo: userId,
        dueDate: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
        status: { not: 'completed' },
      },
      include: {
        project: true,
      },
      orderBy: {
        priority: 'asc',
      },
      take: 8,
    });

    const listData = tasks.map(task => ({
      id: task.id,
      title: task.name,
      project: task.project.name,
      priority: task.priority || 'medium',
      dueTime: task.dueDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      status: task.status,
    }));

    return {
      id: 'today-tasks-list',
      title: '今日のタスク',
      type: 'list',
      data: listData,
      config: {
        refreshInterval: 60, // 1分
      },
    };
  }

  /**
   * リソース利用率ゲージ
   */
  async getResourceUtilizationGauge(companyId: string, storeId?: string): Promise<WidgetData> {
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

    const staffUtilization = totalStaff > 0 ? Math.round((assignedStaff / totalStaff) * 100) : 0;

    return {
      id: 'resource-utilization-gauge',
      title: 'スタッフ利用率',
      type: 'gauge',
      data: {
        value: staffUtilization,
        max: 100,
        unit: '%',
        thresholds: [
          { value: 60, color: '#EF4444' }, // 低稼働
          { value: 85, color: '#F59E0B' }, // 適正
          { value: 100, color: '#10B981' }, // 高稼働
        ],
      },
      config: {
        refreshInterval: 600, // 10分
      },
    };
  }

  // ==================== 事務・経理用ウィジェット ====================

  /**
   * キャッシュフロー推移
   */
  async getCashFlowChart(companyId: string, storeId?: string): Promise<WidgetData> {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // 日別のキャッシュフロー
    const cashFlowData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = date.toISOString().split('T')[0];

      // 入金
      const inflow = await this.prisma.payment.aggregate({
        where: {
          companyId,
          ...(storeId && { storeId }),
          paymentDate: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
        _sum: { amount: true },
      });

      // 支払
      const outflow = await this.prisma.expense.aggregate({
        where: {
          companyId,
          ...(storeId && { storeId }),
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lte: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
        _sum: { amount: true },
      });

      cashFlowData.push({
        date: dateStr,
        inflow: inflow._sum.amount || 0,
        outflow: outflow._sum.amount || 0,
        net: (inflow._sum.amount || 0) - (outflow._sum.amount || 0),
      });
    }

    return {
      id: 'cashflow-chart',
      title: 'キャッシュフロー推移（30日間）',
      type: 'chart',
      data: cashFlowData,
      config: {
        chartType: 'line',
        colors: ['#10B981', '#EF4444', '#3B82F6'],
        showLegend: true,
        refreshInterval: 3600, // 1時間
      },
    };
  }

  /**
   * 売掛金一覧
   */
  async getReceivablesTable(companyId: string, storeId?: string): Promise<WidgetData> {
    const receivables = await this.prisma.invoice.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: { in: ['sent', 'partial'] },
      },
      include: {
        customer: true,
        contract: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 10,
    });

    const tableData = receivables.map(invoice => {
      const daysOverdue = invoice.dueDate < new Date() 
        ? Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer?.name || '未設定',
        amount: invoice.amount,
        dueDate: invoice.dueDate.toLocaleDateString('ja-JP'),
        daysOverdue,
        status: daysOverdue > 0 ? 'overdue' : 'current',
      };
    });

    return {
      id: 'receivables-table',
      title: '売掛金一覧',
      type: 'table',
      data: {
        headers: ['請求書番号', '顧客', '金額', '期日', '遅延日数'],
        rows: tableData,
      },
      config: {
        refreshInterval: 1800, // 30分
      },
    };
  }

  /**
   * 利益率ドーナツチャート
   */
  async getProfitMarginChart(companyId: string, storeId?: string): Promise<WidgetData> {
    const thisMonth = new Date();
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        status: 'completed',
        endDate: {
          gte: startOfMonth(thisMonth),
          lte: endOfMonth(thisMonth),
        },
      },
      include: {
        contract: true,
        expenses: true,
      },
    });

    const marginCategories = { high: 0, medium: 0, low: 0, loss: 0 };

    projects.forEach(project => {
      const revenue = project.contract?.amount || 0;
      const costs = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const marginPercent = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

      if (marginPercent >= 20) marginCategories.high++;
      else if (marginPercent >= 10) marginCategories.medium++;
      else if (marginPercent >= 0) marginCategories.low++;
      else marginCategories.loss++;
    });

    const chartData = [
      { name: '高利益率(20%+)', value: marginCategories.high, color: '#10B981' },
      { name: '中利益率(10-20%)', value: marginCategories.medium, color: '#F59E0B' },
      { name: '低利益率(0-10%)', value: marginCategories.low, color: '#EF4444' },
      { name: '赤字', value: marginCategories.loss, color: '#DC2626' },
    ].filter(item => item.value > 0);

    return {
      id: 'profit-margin-chart',
      title: '今月の利益率分布',
      type: 'chart',
      data: chartData,
      config: {
        chartType: 'donut',
        colors: chartData.map(item => item.color),
        showLegend: true,
        refreshInterval: 3600, // 1時間
      },
    };
  }

  // ==================== アフターケア用ウィジェット ====================

  /**
   * 点検スケジュールカレンダー
   */
  async getInspectionSchedule(companyId: string, storeId?: string): Promise<WidgetData> {
    const today = new Date();
    const nextMonth = addDays(today, 30);

    const inspections = await this.prisma.afterCareSchedule.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: {
          gte: today,
          lte: nextMonth,
        },
        status: { in: ['scheduled', 'reminded'] },
      },
      include: {
        customer: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    const scheduleData = inspections.map(inspection => ({
      id: inspection.id,
      title: `${inspection.customer.name} - ${inspection.inspectionType}点検`,
      date: inspection.scheduledDate.toISOString().split('T')[0],
      customer: inspection.customer.name,
      type: inspection.inspectionType,
      status: inspection.status,
    }));

    return {
      id: 'inspection-schedule',
      title: '点検スケジュール（30日間）',
      type: 'list',
      data: scheduleData,
      config: {
        refreshInterval: 3600, // 1時間
      },
    };
  }

  /**
   * 顧客満足度トレンド
   */
  async getSatisfactionTrend(companyId: string, storeId?: string): Promise<WidgetData> {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 6);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const surveys = await this.prisma.customerSatisfaction.findMany({
        where: {
          companyId,
          ...(storeId && { storeId }),
          surveyDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const avgSatisfaction = surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.satisfactionScore, 0) / surveys.length
        : 0;

      const avgNPS = surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.npsScore, 0) / surveys.length
        : 0;

      monthlyData.push({
        month: month.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' }),
        satisfaction: Math.round(avgSatisfaction * 10) / 10,
        nps: Math.round(avgNPS * 10) / 10,
        responses: surveys.length,
      });
    }

    return {
      id: 'satisfaction-trend',
      title: '顧客満足度推移',
      type: 'chart',
      data: monthlyData,
      config: {
        chartType: 'line',
        colors: ['#3B82F6', '#10B981'],
        showLegend: true,
        refreshInterval: 7200, // 2時間
      },
    };
  }

  /**
   * 不具合カテゴリ別分析
   */
  async getDefectCategoryChart(companyId: string, storeId?: string): Promise<WidgetData> {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);

    const defects = await this.prisma.defectCase.groupBy({
      by: ['category'],
      where: {
        schedule: {
          companyId,
          ...(storeId && { storeId }),
        },
        identifiedAt: {
          gte: threeMonthsAgo,
        },
      },
      _count: true,
      _avg: {
        estimateAmount: true,
      },
    });

    const chartData = defects.map(defect => ({
      category: this.translateDefectCategory(defect.category),
      count: defect._count,
      averageCost: Math.round(defect._avg.estimateAmount || 0),
    }));

    return {
      id: 'defect-category-chart',
      title: '不具合カテゴリ別分析（3ヶ月）',
      type: 'chart',
      data: chartData,
      config: {
        chartType: 'bar',
        colors: ['#3B82F6', '#EF4444'],
        showLegend: true,
        refreshInterval: 3600, // 1時間
      },
    };
  }

  // ==================== 共通ウィジェット ====================

  /**
   * アラート一覧
   */
  async getAlertsWidget(companyId: string, role: string, userId?: string, storeId?: string): Promise<WidgetData> {
    const alerts = [];
    const today = new Date();

    switch (role) {
      case 'construction_manager':
        // 進捗遅延アラート
        const delayedProjects = await this.prisma.project.count({
          where: {
            companyId,
            ...(storeId && { storeId }),
            endDate: { lt: today },
            status: 'in_progress',
          },
        });

        if (delayedProjects > 0) {
          alerts.push({
            type: 'warning',
            message: `${delayedProjects}件のプロジェクトが予定より遅れています`,
            timestamp: today,
          });
        }
        break;

      case 'accounting':
        // 延滞請求書アラート
        const overdueCount = await this.prisma.invoice.count({
          where: {
            companyId,
            ...(storeId && { storeId }),
            dueDate: { lt: today },
            status: { in: ['sent', 'partial'] },
          },
        });

        if (overdueCount > 0) {
          alerts.push({
            type: 'error',
            message: `${overdueCount}件の請求書が支払い期限を過ぎています`,
            timestamp: today,
          });
        }
        break;

      case 'aftercare':
        // 点検遅延アラート
        const overdueInspections = await this.prisma.afterCareSchedule.count({
          where: {
            companyId,
            ...(storeId && { storeId }),
            scheduledDate: { lt: today },
            status: { in: ['scheduled', 'reminded'] },
          },
        });

        if (overdueInspections > 0) {
          alerts.push({
            type: 'warning',
            message: `${overdueInspections}件の点検が予定日を過ぎています`,
            timestamp: today,
          });
        }
        break;
    }

    return {
      id: 'alerts-widget',
      title: 'アラート',
      type: 'list',
      data: alerts,
      config: {
        refreshInterval: 300, // 5分
      },
    };
  }

  // ==================== ヘルパーメソッド ====================

  private translateDefectCategory(category: string): string {
    const translations = {
      'structural': '構造系',
      'waterproof': '防水系',
      'equipment': '設備系',
      'cosmetic': '外観系',
    };
    return translations[category] || category;
  }
}