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
  BadRequestException,
} from '@nestjs/common';
import { HomeService } from './home.service';

export interface UserSettings {
  widgetOrder: string[];
  shortcuts: Record<string, string>;
  preferences: Record<string, any>;
}

export interface ToDoItem {
  id: string;
  title: string;
  description: string;
  type: 'deadline' | 'approval' | 'action_required' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  status: 'overdue' | 'due_soon' | 'normal';
  actionUrl?: string;
  projectId?: string;
  customerId?: string;
}

export interface HomeData {
  todos: ToDoItem[];
  widgets: Record<string, any>;
  planLevel: 'LITE' | 'STANDARD' | 'PRO';
  availableFeatures: string[];
  shortcuts: Record<string, string>;
}

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * 役職別ホームダッシュボードデータ取得
   */
  @Get(':companyId')
  async getHomeDashboard(
    @Param('companyId') companyId: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<HomeData> {
    if (!userId || !userRole) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    return this.homeService.getHomeDashboard(companyId, userId, userRole);
  }

  /**
   * 今日のスケジュール取得（施工管理者用）
   */
  @Get(':companyId/schedule/today')
  async getTodaySchedule(
    @Param('companyId') companyId: string,
    @Query('me') meOnly?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateForeman(userRole);

    const assignments = meOnly === 'true' ? userId : undefined;
    return this.homeService.getTodaySchedule(companyId, assignments);
  }

  /**
   * 台帳概要取得（施工管理者用）
   */
  @Get(':companyId/ledgers/overview')
  async getLedgerOverview(
    @Param('companyId') companyId: string,
    @Query('assignee') assignee?: string,
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateForeman(userRole);

    const assigneeId = assignee === 'me' ? userId : assignee;
    return this.homeService.getLedgerOverview(companyId, assigneeId);
  }

  /**
   * 出来高進捗登録（施工管理者用・ショートカット E）
   */
  @Post(':companyId/ledgers/:ledgerId/progress')
  async submitProgress(
    @Param('companyId') companyId: string,
    @Param('ledgerId') ledgerId: string,
    @Body() progressData: {
      progressPercent: number;
      approvedAmount: number;
      photos?: string[];
      notes?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateForeman(userRole);

    return this.homeService.submitProgress(
      companyId,
      ledgerId,
      progressData.progressPercent,
      progressData.approvedAmount,
      userId!,
      progressData.photos,
      progressData.notes
    );
  }

  /**
   * 変更工事起票（施工管理者用・ショートカット C）
   */
  @Post(':companyId/ledgers/:ledgerId/change-orders')
  async createChangeOrder(
    @Param('companyId') companyId: string,
    @Param('ledgerId') ledgerId: string,
    @Body() changeOrderData: {
      description: string;
      amount: number;
      reason: string;
      category: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateForeman(userRole);

    return this.homeService.createChangeOrder(
      companyId,
      ledgerId,
      changeOrderData.description,
      changeOrderData.amount,
      changeOrderData.reason,
      changeOrderData.category,
      userId!
    );
  }

  /**
   * 請求案作成（施工管理者用・ショートカット B）
   */
  @Post(':companyId/ledgers/:ledgerId/bill')
  async createBillDraft(
    @Param('companyId') companyId: string,
    @Param('ledgerId') ledgerId: string,
    @Body() billData: {
      billType: string;
      amount: number;
      dueDate: Date;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateForeman(userRole);

    return this.homeService.createBillDraft(
      companyId,
      ledgerId,
      billData.billType,
      billData.amount,
      billData.dueDate,
      billData.items,
      userId!
    );
  }

  /**
   * 来店受付作成（事務用）
   */
  @Post(':companyId/reception/cards')
  async createReceptionCard(
    @Param('companyId') companyId: string,
    @Body() receptionData: {
      visitorName: string;
      visitorPhone?: string;
      purpose: string;
      priority?: number;
      notes?: string;
      assignedTo?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateClerk(userRole);

    return this.homeService.createReceptionCard(companyId, receptionData, userId!);
  }

  /**
   * 問い合わせバックログ取得（事務用）
   */
  @Get(':companyId/inquiries/backlog')
  async getInquiryBacklog(
    @Param('companyId') companyId: string,
    @Query('sort') sort?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateClerk(userRole);

    return this.homeService.getInquiryBacklog(companyId, sort);
  }

  /**
   * 新規顧客作成（事務用・ショートカット N）
   */
  @Post(':companyId/customers')
  async createCustomer(
    @Param('companyId') companyId: string,
    @Body() customerData: {
      name: string;
      phone?: string;
      addr1?: string;
      email?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateClerk(userRole);

    return this.homeService.createCustomer(companyId, customerData, userId!);
  }

  /**
   * 顧客重複チェック（事務用）
   */
  @Post(':companyId/customers/check-dup')
  async checkCustomerDuplicate(
    @Param('companyId') companyId: string,
    @Body() checkData: {
      name: string;
      phone?: string;
      address?: string;
    },
  ) {
    return this.homeService.checkCustomerDuplicate(companyId, checkData);
  }

  /**
   * 今週の点検スケジュール取得（アフター用）
   */
  @Get(':companyId/aftercare/schedules')
  async getAftercareSchedules(
    @Param('companyId') companyId: string,
    @Query('range') range?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAftercare(userRole);

    const days = range === '7d' ? 7 : 30;
    return this.homeService.getAftercareSchedules(companyId, days);
  }

  /**
   * 点検結果登録（アフター用）
   */
  @Post(':companyId/aftercare/inspection/:inspectionId/result')
  async submitInspectionResult(
    @Param('companyId') companyId: string,
    @Param('inspectionId') inspectionId: string,
    @Body() resultData: {
      isDefect: boolean;
      notes?: string;
      createEstimate?: boolean;
      photos?: string[];
      checklistResults?: Array<{
        item: string;
        result: 'OK' | 'NG' | 'NA';
        notes?: string;
      }>;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAftercare(userRole);

    return this.homeService.submitInspectionResult(
      companyId,
      inspectionId,
      resultData,
      userId!
    );
  }

  /**
   * 見積を台帳に合流（アフター用・ショートカット M）
   */
  @Post(':companyId/aftercare/merge-to-ledger')
  async mergeEstimateToLedger(
    @Param('companyId') companyId: string,
    @Body() mergeData: {
      estimateId: string;
      projectId?: string;
      createNewProject?: boolean;
      projectData?: {
        name: string;
        customerId: string;
        description: string;
      };
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAftercare(userRole);

    return this.homeService.mergeEstimateToLedger(companyId, mergeData, userId!);
  }

  /**
   * ユーザー設定保存
   */
  @Put(':companyId/user-settings')
  async saveUserSettings(
    @Param('companyId') companyId: string,
    @Body() settings: UserSettings,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    return this.homeService.saveUserSettings(userId, companyId, settings);
  }

  /**
   * ユーザー設定取得
   */
  @Get(':companyId/user-settings')
  async getUserSettings(
    @Param('companyId') companyId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    return this.homeService.getUserSettings(userId, companyId);
  }

  /**
   * ToDoアクション実行
   */
  @Post(':companyId/todos/:todoId/action')
  async executeTodoAction(
    @Param('companyId') companyId: string,
    @Param('todoId') todoId: string,
    @Body() actionData: { action: string; data?: any },
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('ユーザーIDが必要です');
    }

    return this.homeService.executeTodoAction(companyId, todoId, actionData.action, actionData.data, userId);
  }

  // ==================== バリデーションメソッド ====================

  private validateForeman(userRole?: string) {
    if (!userRole || !['construction_manager', 'project_manager', 'site_supervisor', 'foreman', 'admin'].includes(userRole)) {
      throw new UnauthorizedException('施工管理者権限が必要です');
    }
  }

  private validateClerk(userRole?: string) {
    if (!userRole || !['office_manager', 'clerk', 'receptionist', 'admin'].includes(userRole)) {
      throw new UnauthorizedException('事務権限が必要です');
    }
  }

  private validateAftercare(userRole?: string) {
    if (!userRole || !['aftercare', 'customer_service', 'maintenance', 'admin'].includes(userRole)) {
      throw new UnauthorizedException('アフターケア権限が必要です');
    }
  }
}