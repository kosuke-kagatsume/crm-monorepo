import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, isAfter, isBefore, format } from 'date-fns';
import { HomeData, ToDoItem, UserSettings } from './home.controller';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 役職別ホームダッシュボードデータ取得
   */
  async getHomeDashboard(companyId: string, userId: string, userRole: string): Promise<HomeData> {
    // プランレベル取得
    const companyPlan = await this.prisma.companyPlan.findUnique({
      where: { companyId },
    });

    const planLevel = (companyPlan?.plan as 'LITE' | 'STANDARD' | 'PRO') || 'LITE';
    const availableFeatures = this.getAvailableFeatures(planLevel);

    // ユーザー設定取得
    const userSettings = await this.getUserSettings(userId, companyId);

    // 役職別ToDoリスト生成
    const todos = await this.generateTodos(companyId, userId, userRole, planLevel);

    // 役職別ウィジェットデータ取得
    const widgets = await this.getWidgetData(companyId, userId, userRole, planLevel);

    return {
      todos,
      widgets,
      planLevel,
      availableFeatures,
      shortcuts: userSettings.shortcuts || this.getDefaultShortcuts(userRole),
    };
  }

  /**
   * 今日のスケジュール取得
   */
  async getTodaySchedule(companyId: string, assigneeId?: string) {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    const schedules = await this.prisma.task.findMany({
      where: {
        project: { companyId },
        ...(assigneeId && { assignedTo: assigneeId }),
        dueDate: {
          gte: startToday,
          lte: endToday,
        },
        status: { not: 'completed' },
      },
      include: {
        project: {
          include: {
            customer: true,
            contract: true,
          },
        },
        assignedUser: true,
      },
      orderBy: [
        { priority: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    return {
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        title: schedule.name,
        projectName: schedule.project.name,
        customerName: schedule.project.customer?.name,
        location: schedule.project.location,
        startTime: schedule.dueDate,
        assignee: schedule.assignedUser?.name,
        priority: schedule.priority,
        status: schedule.status,
        progress: this.calculateTaskProgress(schedule),
      })),
      summary: {
        total: schedules.length,
        high_priority: schedules.filter(s => s.priority === 'high').length,
        behind_schedule: schedules.filter(s => s.dueDate < today && s.status !== 'completed').length,
      },
    };
  }

  /**
   * 台帳概要取得
   */
  async getLedgerOverview(companyId: string, assigneeId?: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        companyId,
        status: { in: ['planning', 'in_progress'] },
        ...(assigneeId && {
          OR: [
            { managerId: assigneeId },
            { assignedUsers: { some: { userId: assigneeId } } },
          ],
        }),
      },
      include: {
        contract: true,
        tasks: true,
        expenses: true,
        progressApprovals: {
          orderBy: { approvedAt: 'desc' },
          take: 1,
        },
        invoices: {
          where: { status: { in: ['draft', 'pending_approval'] } },
        },
      },
    });

    const overview = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
      const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const contractAmount = project.contract?.amount || 0;
      const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const latestProgress = project.progressApprovals[0];
      const approvedAmount = latestProgress?.approvedAmount || 0;

      return {
        projectId: project.id,
        projectName: project.name,
        progressPercent: Math.round(progressPercent),
        contractAmount,
        approvedAmount,
        totalExpenses,
        profitEstimate: approvedAmount - totalExpenses,
        pendingInvoices: project.invoices.length,
        status: project.status,
        endDate: project.endDate,
        isDelayed: project.endDate < new Date() && project.status !== 'completed',
      };
    });

    return {
      projects: overview,
      summary: {
        totalProjects: overview.length,
        totalContractValue: overview.reduce((sum, p) => sum + p.contractAmount, 0),
        totalApprovedAmount: overview.reduce((sum, p) => sum + p.approvedAmount, 0),
        totalPendingInvoices: overview.reduce((sum, p) => sum + p.pendingInvoices, 0),
        averageProgress: overview.length > 0 
          ? Math.round(overview.reduce((sum, p) => sum + p.progressPercent, 0) / overview.length)
          : 0,
      },
    };
  }

  /**
   * 出来高進捗登録
   */
  async submitProgress(
    companyId: string,
    contractId: string,
    progressPercent: number,
    approvedAmount: number,
    approverId: string,
    photos?: string[],
    notes?: string
  ) {
    // 権限チェック
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, companyId },
      include: { project: true },
    });

    if (!contract) {
      throw new NotFoundException('契約が見つかりません');
    }

    // 進捗承認レコード作成
    const progressApproval = await this.prisma.progressApprovalLog.create({
      data: {
        contractId,
        progressPercent,
        approvedAmount,
        approver: approverId,
        photos: JSON.stringify(photos || []),
        notes,
        approvedAt: new Date(),
        status: 'approved',
      },
    });

    // プロジェクト進捗更新
    await this.prisma.project.update({
      where: { id: contract.projectId },
      data: {
        progress: progressPercent,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      progressApproval,
      nextSteps: this.generateNextSteps(progressPercent),
    };
  }

  /**
   * 変更工事起票
   */
  async createChangeOrder(
    companyId: string,
    contractId: string,
    description: string,
    amount: number,
    reason: string,
    category: string,
    requestedBy: string
  ) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, companyId },
    });

    if (!contract) {
      throw new NotFoundException('契約が見つかりません');
    }

    const changeOrder = await this.prisma.contractHistory.create({
      data: {
        contractId,
        revisionType: 'change_order',
        amount,
        reason: `${category}: ${description}\n理由: ${reason}`,
        approvedBy: '', // 未承認
        createdAt: new Date(),
        status: 'pending_approval',
        metadata: JSON.stringify({
          category,
          description,
          requestedBy,
        }),
      },
    });

    return {
      success: true,
      changeOrder,
      approvalUrl: `/contracts/${contractId}/change-orders/${changeOrder.id}/approve`,
    };
  }

  /**
   * 請求案作成
   */
  async createBillDraft(
    companyId: string,
    contractId: string,
    billType: string,
    amount: number,
    dueDate: Date,
    items: Array<{ description: string; quantity: number; unitPrice: number }>,
    createdBy: string
  ) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, companyId },
      include: { customer: true },
    });

    if (!contract) {
      throw new NotFoundException('契約が見つかりません');
    }

    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        contractId,
        customerId: contract.customerId,
        invoiceNumber,
        billType,
        amount,
        dueDate,
        status: 'draft',
        createdBy,
      },
    });

    // 明細行作成
    for (const item of items) {
      await this.prisma.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        },
      });
    }

    return {
      success: true,
      invoice,
      previewUrl: `/invoices/${invoice.id}/preview`,
      sendUrl: `/invoices/${invoice.id}/send`,
    };
  }

  /**
   * 来店受付作成
   */
  async createReceptionCard(companyId: string, receptionData: any, createdBy: string) {
    // 商談室/車両の自動確保
    const availableRoom = await this.findAvailableRoom(companyId);
    const availableVehicle = await this.findAvailableVehicle(companyId);

    const receptionCard = await this.prisma.receptionCard.create({
      data: {
        companyId,
        visitorName: receptionData.visitorName,
        visitorPhone: receptionData.visitorPhone,
        purpose: receptionData.purpose,
        priority: receptionData.priority || 3,
        notes: receptionData.notes,
        assignedTo: receptionData.assignedTo,
        roomId: availableRoom?.id,
        status: 'waiting',
        arrivedAt: new Date(),
        createdBy,
      },
      include: {
        assignedUser: true,
      },
    });

    // 車両予約（必要に応じて）
    if (availableVehicle && receptionData.purpose.includes('現地')) {
      await this.prisma.booking.create({
        data: {
          companyId,
          resourceId: availableVehicle.id,
          userId: receptionData.assignedTo || createdBy,
          title: `${receptionData.visitorName}様 現地案内`,
          startTime: new Date(),
          endTime: addDays(new Date(), 0.5), // 半日
          status: 'confirmed',
          purpose: 'customer_visit',
        },
      });
    }

    return {
      success: true,
      receptionCard,
      assignedRoom: availableRoom,
      assignedVehicle: availableVehicle,
      estimatedWaitTime: this.calculateWaitTime(availableRoom),
    };
  }

  /**
   * 問い合わせバックログ取得
   */
  async getInquiryBacklog(companyId: string, sort?: string) {
    const sortOrder = sort === 'sla' ? { createdAt: 'asc' as const } : { priority: 'asc' as const };

    const inquiries = await this.prisma.inquiry.findMany({
      where: {
        companyId,
        status: { in: ['new', 'in_progress'] },
      },
      include: {
        customer: true,
        assignedUser: true,
      },
      orderBy: sortOrder,
      take: 20,
    });

    return {
      inquiries: inquiries.map(inquiry => ({
        id: inquiry.id,
        title: inquiry.subject,
        customerName: inquiry.customer?.name || 'Unknown',
        type: inquiry.type,
        priority: inquiry.priority,
        status: inquiry.status,
        slaStatus: this.calculateSLAStatus(inquiry.createdAt, inquiry.priority),
        assignedTo: inquiry.assignedUser?.name,
        createdAt: inquiry.createdAt,
        responseDeadline: this.calculateResponseDeadline(inquiry.createdAt, inquiry.priority),
      })),
      summary: {
        total: inquiries.length,
        slaViolations: inquiries.filter(i => this.calculateSLAStatus(i.createdAt, i.priority) === 'violated').length,
        unassigned: inquiries.filter(i => !i.assignedTo).length,
      },
    };
  }

  /**
   * 新規顧客作成
   */
  async createCustomer(companyId: string, customerData: any, createdBy: string) {
    // 重複チェック
    const duplicateCheck = await this.checkCustomerDuplicate(companyId, {
      name: customerData.name,
      phone: customerData.phone,
    });

    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: 'duplicate_found',
        duplicates: duplicateCheck.matches,
        customerData,
      };
    }

    const customer = await this.prisma.customer.create({
      data: {
        companyId,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.addr1,
        createdBy,
      },
    });

    return {
      success: true,
      customer,
      nextSteps: [
        '初回面談の予約',
        '要望ヒアリングシートの準備',
        '現地調査日程の調整',
      ],
    };
  }

  /**
   * 顧客重複チェック
   */
  async checkCustomerDuplicate(companyId: string, checkData: { name: string; phone?: string; address?: string }) {
    const matches = [];

    // 名前での検索
    if (checkData.name) {
      const nameMatches = await this.prisma.customer.findMany({
        where: {
          companyId,
          name: { contains: checkData.name },
        },
        take: 5,
      });

      nameMatches.forEach(customer => {
        const similarity = this.calculateStringSimilarity(checkData.name, customer.name);
        if (similarity > 0.7) {
          matches.push({
            type: 'name',
            customer,
            similarity,
          });
        }
      });
    }

    // 電話番号での検索
    if (checkData.phone) {
      const phoneMatches = await this.prisma.customer.findMany({
        where: {
          companyId,
          OR: [
            { phone: checkData.phone },
            { mobile: checkData.phone },
          ],
        },
      });

      phoneMatches.forEach(customer => {
        matches.push({
          type: 'phone',
          customer,
          similarity: 1.0,
        });
      });
    }

    return {
      isDuplicate: matches.length > 0,
      matches: matches.slice(0, 3),
    };
  }

  /**
   * アフターケアスケジュール取得
   */
  async getAftercareSchedules(companyId: string, days: number = 7) {
    const startDate = new Date();
    const endDate = addDays(startDate, days);

    const schedules = await this.prisma.afterCareSchedule.findMany({
      where: {
        companyId,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['scheduled', 'reminded'] },
      },
      include: {
        customer: true,
        project: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    return {
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        customerName: schedule.customer.name,
        projectName: schedule.project?.name,
        inspectionType: schedule.inspectionType,
        scheduledDate: schedule.scheduledDate,
        location: schedule.customer.address,
        phone: schedule.customer.phone,
        priority: this.calculateInspectionPriority(schedule),
        estimatedDuration: this.getInspectionDuration(schedule.inspectionType),
      })),
      summary: {
        total: schedules.length,
        thisWeek: schedules.filter(s => s.scheduledDate <= endOfWeek(startDate)).length,
        overdue: 0, // 今回は未来のスケジュールのみ
      },
    };
  }

  /**
   * 点検結果登録
   */
  async submitInspectionResult(companyId: string, inspectionId: string, resultData: any, performedBy: string) {
    const inspection = await this.prisma.afterCareSchedule.findFirst({
      where: { id: inspectionId, companyId },
      include: { customer: true },
    });

    if (!inspection) {
      throw new NotFoundException('点検スケジュールが見つかりません');
    }

    // 点検完了更新
    await this.prisma.afterCareSchedule.update({
      where: { id: inspectionId },
      data: {
        status: resultData.isDefect ? 'defect_found' : 'completed',
        completedAt: new Date(),
        completedBy: performedBy,
      },
    });

    // チェックリスト結果保存
    if (resultData.checklistResults) {
      for (const [index, result] of resultData.checklistResults.entries()) {
        await this.prisma.checklistItem.create({
          data: {
            scheduleId: inspectionId,
            category: 'inspection',
            itemName: result.item,
            checkResult: result.result,
            notes: result.notes,
            sequence: index + 1,
            checkedAt: new Date(),
            checkedBy: performedBy,
          },
        });
      }
    }

    // 不具合があった場合
    let defectCase = null;
    let estimate = null;

    if (resultData.isDefect) {
      defectCase = await this.prisma.defectCase.create({
        data: {
          scheduleId: inspectionId,
          description: resultData.notes || '点検時に発見された不具合',
          severity: 'medium',
          category: 'general',
          location: inspection.customer.address,
          photos: JSON.stringify(resultData.photos || []),
          identifiedBy: performedBy,
          identifiedAt: new Date(),
          status: 'identified',
        },
      });

      // 即座に見積作成する場合
      if (resultData.createEstimate) {
        estimate = await this.createQuickEstimate(companyId, defectCase.id, inspection.customerId);
      }
    }

    return {
      success: true,
      inspection: {
        id: inspectionId,
        status: resultData.isDefect ? 'defect_found' : 'completed',
        completedAt: new Date(),
      },
      defect: defectCase,
      estimate,
      nextSteps: this.generateInspectionNextSteps(resultData.isDefect, resultData.createEstimate),
    };
  }

  /**
   * 見積を台帳に合流
   */
  async mergeEstimateToLedger(companyId: string, mergeData: any, userId: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id: mergeData.estimateId, companyId },
      include: { customer: true },
    });

    if (!estimate) {
      throw new NotFoundException('見積が見つかりません');
    }

    let projectId = mergeData.projectId;

    // 新規プロジェクト作成する場合
    if (mergeData.createNewProject && mergeData.projectData) {
      const project = await this.prisma.project.create({
        data: {
          companyId,
          name: mergeData.projectData.name,
          customerId: mergeData.projectData.customerId,
          description: mergeData.projectData.description,
          status: 'planning',
          managerId: userId,
          startDate: new Date(),
          endDate: addDays(new Date(), 30), // デフォルト1ヶ月
          budget: estimate.totalAmount,
          createdBy: userId,
        },
      });
      projectId = project.id;
    }

    // 契約作成
    const contractNumber = await this.generateContractNumber(companyId);
    const contract = await this.prisma.contract.create({
      data: {
        companyId,
        projectId,
        customerId: estimate.customerId,
        contractNumber,
        amount: estimate.totalAmount,
        startDate: new Date(),
        endDate: addDays(new Date(), 30),
        status: 'draft',
        description: `アフターケア見積 ${estimate.estimateNumber} からの受注`,
        createdBy: userId,
      },
    });

    // 見積ステータス更新
    await this.prisma.estimate.update({
      where: { id: mergeData.estimateId },
      data: {
        status: 'converted_to_contract',
        contractId: contract.id,
      },
    });

    return {
      success: true,
      contract,
      projectId,
      ledgerUrl: `/ledgers/${contract.id}`,
      nextSteps: [
        '契約書の作成・送付',
        '工事スケジュールの調整',
        '必要資材の発注',
      ],
    };
  }

  /**
   * ユーザー設定保存
   */
  async saveUserSettings(userId: string, companyId: string, settings: UserSettings) {
    return await this.prisma.userSettings.upsert({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
      update: {
        widgetOrder: JSON.stringify(settings.widgetOrder),
        shortcuts: JSON.stringify(settings.shortcuts),
        preferences: JSON.stringify(settings.preferences),
        updatedAt: new Date(),
      },
      create: {
        userId,
        companyId,
        widgetOrder: JSON.stringify(settings.widgetOrder),
        shortcuts: JSON.stringify(settings.shortcuts),
        preferences: JSON.stringify(settings.preferences),
      },
    });
  }

  /**
   * ユーザー設定取得
   */
  async getUserSettings(userId: string, companyId: string): Promise<UserSettings> {
    const settings = await this.prisma.userSettings.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!settings) {
      return {
        widgetOrder: [],
        shortcuts: {},
        preferences: {},
      };
    }

    return {
      widgetOrder: JSON.parse(settings.widgetOrder || '[]'),
      shortcuts: JSON.parse(settings.shortcuts || '{}'),
      preferences: JSON.parse(settings.preferences || '{}'),
    };
  }

  /**
   * ToDoアクション実行
   */
  async executeTodoAction(companyId: string, todoId: string, action: string, data: any, userId: string) {
    // ToDoアクションのルーティング
    switch (action) {
      case 'approve_progress':
        return this.approveProgress(todoId, userId);
      case 'send_invoice':
        return this.sendInvoice(todoId, userId);
      case 'schedule_inspection':
        return this.scheduleInspection(todoId, data, userId);
      case 'respond_inquiry':
        return this.respondToInquiry(todoId, data, userId);
      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }
  }

  // ==================== プライベートメソッド ====================

  private async generateTodos(companyId: string, userId: string, userRole: string, planLevel: string): Promise<ToDoItem[]> {
    const todos: ToDoItem[] = [];
    const today = new Date();

    switch (userRole) {
      case 'construction_manager':
      case 'project_manager':
      case 'foreman':
        // 承認待ち進捗
        const pendingProgress = await this.prisma.progressApprovalLog.findMany({
          where: {
            contract: { companyId },
            status: 'pending_approval',
          },
          include: { contract: { include: { project: true } } },
          take: 3,
        });

        todos.push(...pendingProgress.map(progress => ({
          id: `progress_${progress.id}`,
          title: '出来高承認待ち',
          description: `${progress.contract.project.name} - ${progress.progressPercent}%`,
          type: 'approval' as const,
          priority: 'high' as const,
          status: 'normal' as const,
          actionUrl: `/projects/${progress.contract.projectId}/progress/${progress.id}`,
          projectId: progress.contract.projectId,
        })));

        // 期限間近のタスク
        const upcomingTasks = await this.prisma.task.findMany({
          where: {
            project: { companyId },
            assignedTo: userId,
            dueDate: { gte: today, lte: addDays(today, 3) },
            status: { not: 'completed' },
          },
          include: { project: true },
          take: 3,
        });

        todos.push(...upcomingTasks.map(task => ({
          id: `task_${task.id}`,
          title: task.name,
          description: `${task.project.name} - 期限: ${format(task.dueDate, 'M/d')}`,
          type: 'deadline' as const,
          priority: task.priority as 'high' | 'medium' | 'low',
          dueDate: task.dueDate,
          status: task.dueDate < addDays(today, 1) ? 'due_soon' as const : 'normal' as const,
          actionUrl: `/tasks/${task.id}`,
          projectId: task.projectId,
        })));
        break;

      case 'office_manager':
      case 'clerk':
        // 未対応の問い合わせ
        const pendingInquiries = await this.prisma.inquiry.findMany({
          where: {
            companyId,
            status: 'new',
          },
          include: { customer: true },
          take: 3,
          orderBy: { createdAt: 'asc' },
        });

        todos.push(...pendingInquiries.map(inquiry => ({
          id: `inquiry_${inquiry.id}`,
          title: '問い合わせ対応',
          description: `${inquiry.customer?.name} - ${inquiry.subject}`,
          type: 'action_required' as const,
          priority: inquiry.priority as 'high' | 'medium' | 'low',
          status: this.calculateSLAStatus(inquiry.createdAt, inquiry.priority) === 'violated' ? 'overdue' as const : 'normal' as const,
          actionUrl: `/inquiries/${inquiry.id}`,
          customerId: inquiry.customerId,
        })));
        break;

      case 'aftercare':
        // 今週の点検予定
        const upcomingInspections = await this.prisma.afterCareSchedule.findMany({
          where: {
            companyId,
            scheduledDate: { gte: today, lte: endOfWeek(today) },
            status: { in: ['scheduled', 'reminded'] },
          },
          include: { customer: true },
          take: 3,
        });

        todos.push(...upcomingInspections.map(inspection => ({
          id: `inspection_${inspection.id}`,
          title: `${inspection.inspectionType}点検`,
          description: `${inspection.customer.name} - ${format(inspection.scheduledDate, 'M/d')}`,
          type: 'reminder' as const,
          priority: 'medium' as const,
          dueDate: inspection.scheduledDate,
          status: inspection.scheduledDate < today ? 'overdue' as const : 'normal' as const,
          actionUrl: `/aftercare/inspections/${inspection.id}`,
          customerId: inspection.customerId,
        })));
        break;
    }

    return todos.slice(0, 6); // 最大6件
  }

  private async getWidgetData(companyId: string, userId: string, userRole: string, planLevel: string) {
    // 役職別のウィジェットデータを返す
    // 実際の実装では各ウィジェット用のデータを取得
    return {
      role: userRole,
      planLevel,
      lastUpdated: new Date(),
    };
  }

  private getAvailableFeatures(planLevel: string): string[] {
    const features = {
      LITE: ['basic_ledger', 'simple_invoicing', 'basic_aftercare'],
      STANDARD: ['basic_ledger', 'simple_invoicing', 'basic_aftercare', 'approval_workflow', 'change_orders'],
      PRO: ['basic_ledger', 'simple_invoicing', 'basic_aftercare', 'approval_workflow', 'change_orders', 'budget_revision', 'detailed_reports'],
    };

    return features[planLevel] || features.LITE;
  }

  private getDefaultShortcuts(userRole: string): Record<string, string> {
    const shortcuts = {
      construction_manager: { E: 'progress', C: 'change_order', B: 'bill' },
      office_manager: { N: 'new_customer', R: 'reception' },
      aftercare: { M: 'merge_estimate', I: 'inspection' },
    };

    return shortcuts[userRole] || {};
  }

  // その他のヘルパーメソッドは実装を簡略化
  private calculateTaskProgress(task: any): number { return 50; }
  private generateNextSteps(progress: number): string[] { return ['次の作業段階に進む']; }
  private generateInvoiceNumber(companyId: string): Promise<string> { return Promise.resolve(`INV-${Date.now()}`); }
  private findAvailableRoom(companyId: string): Promise<any> { return Promise.resolve({ id: 'room1', name: '商談室A' }); }
  private findAvailableVehicle(companyId: string): Promise<any> { return Promise.resolve({ id: 'vehicle1', name: '営業車1号' }); }
  private calculateWaitTime(room: any): number { return 15; }
  private calculateSLAStatus(createdAt: Date, priority: string): string { return 'normal'; }
  private calculateResponseDeadline(createdAt: Date, priority: string): Date { return addDays(createdAt, 1); }
  private calculateStringSimilarity(str1: string, str2: string): number { return 0.8; }
  private calculateInspectionPriority(schedule: any): string { return 'medium'; }
  private getInspectionDuration(type: string): number { return 60; }
  private createQuickEstimate(companyId: string, defectId: string, customerId: string): Promise<any> { 
    return Promise.resolve({ id: 'est1', totalAmount: 50000 }); 
  }
  private generateInspectionNextSteps(hasDefect: boolean, createEstimate: boolean): string[] { 
    return hasDefect ? ['不具合対応の検討'] : ['完了報告書の作成']; 
  }
  private generateContractNumber(companyId: string): Promise<string> { return Promise.resolve(`CTR-${Date.now()}`); }
  
  // ToDoアクション実装（簡略化）
  private async approveProgress(todoId: string, userId: string) { return { success: true }; }
  private async sendInvoice(todoId: string, userId: string) { return { success: true }; }
  private async scheduleInspection(todoId: string, data: any, userId: string) { return { success: true }; }
  private async respondToInquiry(todoId: string, data: any, userId: string) { return { success: true }; }
}