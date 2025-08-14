import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * APIスタブコントローラー
 * UI開発用のモックデータを返す
 */
@ApiTags('home-stubs')
@Controller('api')
export class HomeStubsController {

  @Get('home/:companyId')
  @ApiOperation({ summary: 'Get home dashboard data (stub)' })
  async getHomeDashboard(@Param('companyId') companyId: string) {
    return {
      todos: [
        {
          id: '1',
          title: '見積書承認待ち',
          description: '山田様邸の見積書承認が必要です',
          priority: 'high',
          status: 'due_soon',
          actionUrl: '/estimates/123',
        },
        {
          id: '2',
          title: '請求書発行',
          description: '田中様邸の請求書を今週中に発行',
          priority: 'medium',
          status: 'normal',
          actionUrl: '/invoices/new',
        },
        {
          id: '3',
          title: '安全点検実施',
          description: '佐藤様邸の定期安全点検',
          priority: 'low',
          status: 'normal',
        },
      ],
      stats: {
        monthlyRevenue: 12450000,
        pendingInvoices: 5,
        activeProjects: 8,
        completionRate: 75,
      },
    };
  }

  @Get('companies/:companyId/plan')
  @ApiOperation({ summary: 'Get company plan (stub)' })
  async getCompanyPlan(@Param('companyId') companyId: string) {
    return {
      plan: 'STANDARD',
      features: [
        'basic_ledger',
        'progress_tracking',
        'invoice_management',
        'customer_management',
        'change_order',
        'rag_search',
      ],
    };
  }

  @Get('ledgers/overview')
  @ApiOperation({ summary: 'Get ledger overview (stub)' })
  async getLedgerOverview(@Query('assignee') assignee?: string) {
    return {
      projects: [
        {
          projectId: 'proj_1',
          projectName: '山田様邸新築工事',
          progressPercent: 65,
          contractAmount: 15000000,
          approvedAmount: 9750000,
          pendingInvoices: 2,
          isDelayed: false,
        },
        {
          projectId: 'proj_2',
          projectName: '田中様邸リフォーム',
          progressPercent: 30,
          contractAmount: 5000000,
          approvedAmount: 1500000,
          pendingInvoices: 1,
          isDelayed: true,
        },
      ],
    };
  }

  @Get('schedule/today')
  @ApiOperation({ summary: 'Get today schedule (stub)' })
  async getTodaySchedule(@Query('me') me?: boolean) {
    return {
      schedules: [
        {
          id: 'sch_1',
          projectName: '山田様邸',
          customerName: '山田太郎',
          location: '東京都渋谷区',
          status: '作業中',
          startTime: '09:00',
          endTime: '17:00',
        },
        {
          id: 'sch_2',
          projectName: '田中様邸',
          customerName: '田中花子',
          location: '東京都新宿区',
          status: '予定',
          startTime: '13:00',
          endTime: '16:00',
        },
      ],
    };
  }

  @Get('reception/cards')
  @ApiOperation({ summary: 'Get reception cards (stub)' })
  async getReceptionCards(@Query('status') status?: string) {
    return {
      cards: [
        {
          id: 'card_1',
          customerName: '佐藤様',
          phone: '090-1234-5678',
          inquiry: 'キッチンリフォームの相談',
          status: 'new',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'card_2',
          customerName: '鈴木様',
          phone: '080-9876-5432',
          inquiry: '外壁塗装の見積依頼',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          assignee: '営業担当A',
        },
      ],
    };
  }

  @Get('documents/pending')
  @ApiOperation({ summary: 'Get pending documents (stub)' })
  async getPendingDocuments() {
    return {
      documents: [
        {
          id: 'doc_1',
          type: 'estimate',
          projectName: '山田様邸改修',
          customerName: '山田太郎',
          amount: 3500000,
          status: 'draft',
        },
        {
          id: 'doc_2',
          type: 'invoice',
          projectName: '田中様邸',
          customerName: '田中花子',
          amount: 1200000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending_approval',
        },
      ],
    };
  }

  @Get('maintenance/schedules')
  @ApiOperation({ summary: 'Get maintenance schedules (stub)' })
  async getMaintenanceSchedules(@Query('upcoming') upcoming?: boolean) {
    return {
      schedules: [
        {
          id: 'maint_1',
          projectId: 'proj_1',
          projectName: '山田様邸',
          customerName: '山田太郎',
          address: '東京都渋谷区1-2-3',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'regular',
          status: 'scheduled',
        },
        {
          id: 'maint_2',
          projectId: 'proj_2',
          projectName: '田中様邸',
          customerName: '田中花子',
          address: '東京都新宿区4-5-6',
          scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'warranty',
          status: 'scheduled',
          notes: '1年点検',
        },
      ],
    };
  }

  @Get('service/requests')
  @ApiOperation({ summary: 'Get service requests (stub)' })
  async getServiceRequests(@Query('status') status?: string) {
    return {
      requests: [
        {
          id: 'req_1',
          customerName: '佐藤様',
          phone: '090-1111-2222',
          issueType: '水漏れ',
          description: 'キッチンの蛇口から水漏れ',
          priority: 'high',
          status: 'new',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'req_2',
          customerName: '鈴木様',
          phone: '080-3333-4444',
          issueType: '建具調整',
          description: 'ドアの開閉が固い',
          priority: 'medium',
          status: 'assigned',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };
  }

  @Get('estimates/merge-candidates')
  @ApiOperation({ summary: 'Get merge candidates for estimates (stub)' })
  async getMergeCandidates() {
    return {
      candidates: [
        {
          id: 'cand_1',
          estimateId: 'est_1',
          projectName: '山田様邸 - キッチン',
          amount: 1500000,
          items: 8,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'cand_2',
          estimateId: 'est_2',
          projectName: '山田様邸 - バスルーム',
          amount: 1200000,
          items: 6,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'cand_3',
          estimateId: 'est_3',
          projectName: '山田様邸 - 外壁',
          amount: 2300000,
          items: 11,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };
  }

  @Post('ledgers/:ledgerId/progress')
  @ApiOperation({ summary: 'Submit progress (stub)' })
  async submitProgress(
    @Param('ledgerId') ledgerId: string,
    @Body() progressData: any,
  ) {
    return {
      success: true,
      progress: {
        id: 'prog_' + Date.now(),
        ledgerId,
        progressPercent: progressData.progressPercent || 50,
        approvedAmount: progressData.approvedAmount || 1000000,
        notes: progressData.notes || '',
        createdAt: new Date().toISOString(),
        status: 'pending_approval',
      },
      message: '出来高が正常に登録されました',
    };
  }

  @Post('ledgers/:ledgerId/bill')
  @ApiOperation({ summary: 'Create bill draft (stub)' })
  async createBillDraft(
    @Param('ledgerId') ledgerId: string,
    @Body() billData: any,
  ) {
    return {
      success: true,
      invoice: {
        id: 'inv_' + Date.now(),
        ledgerId,
        billType: billData.billType || 'milestone',
        amount: billData.amount || 2000000,
        dueDate: billData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: billData.items || [],
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      message: '請求案が作成されました',
    };
  }

  @Post('companies/:companyId/customers')
  @ApiOperation({ summary: 'Create customer (stub)' })
  async createCustomer(
    @Param('companyId') companyId: string,
    @Body() customerData: any,
  ) {
    return {
      success: true,
      customer: {
        id: 'cust_' + Date.now(),
        companyId,
        name: customerData.name,
        kana: customerData.kana,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
        source: customerData.source || 'direct',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
      message: '新規客カードが作成されました',
    };
  }

  @Post('companies/:companyId/estimates/merge')
  @ApiOperation({ summary: 'Merge estimates (stub)' })
  async mergeEstimates(
    @Param('companyId') companyId: string,
    @Body() mergeData: any,
  ) {
    return {
      success: true,
      estimate: {
        id: 'est_merged_' + Date.now(),
        companyId,
        projectName: mergeData.projectName,
        customerName: mergeData.customerName,
        totalAmount: 5000000,
        itemCount: 25,
        sourceEstimates: mergeData.estimateIds,
        notes: mergeData.notes,
        createdAt: new Date().toISOString(),
        status: 'draft',
      },
      message: `${mergeData.estimateIds.length}件の見積が統合されました`,
    };
  }

  @Post('telemetry/*')
  @ApiOperation({ summary: 'Telemetry endpoint (stub)' })
  async trackTelemetry(@Body() data: any) {
    console.log('Telemetry event:', data);
    return { success: true };
  }

  @Post('rag/:companyId/search')
  @ApiOperation({ summary: 'RAG search (stub)' })
  async ragSearch(
    @Param('companyId') companyId: string,
    @Body() searchData: any,
  ) {
    const responses: Record<string, any> = {
      'foreman-progress-check': {
        content: '現在進行中の3案件の進捗状況：\n・山田様邸（65%）：基礎工事完了、上棟済み\n・田中様邸（30%）：基礎工事中、天候による2日遅延\n・佐藤様邸（85%）：内装工事中、予定通り進行',
        citations: [
          {
            id: 'cit_1',
            type: 'record',
            title: '工事台帳 - 山田様邸',
            excerpt: '基礎工事完了（2024/1/15）、上棟完了（2024/1/28）',
            pageNumber: 15,
            relevanceScore: 0.95,
          },
        ],
      },
      'foreman-budget-status': {
        content: '予算消化状況：\n・山田様邸：予算1500万円、消化975万円（65%）\n・田中様邸：予算500万円、消化150万円（30%）\n・今月合計：予算3200万円、消化2100万円（65.6%）',
        citations: [
          {
            id: 'cit_2',
            type: 'data',
            title: '月次予算管理表',
            excerpt: '2024年1月度予算消化率65.6%',
            relevanceScore: 0.92,
          },
        ],
      },
      'clerk-customer-search': {
        content: searchData.query ? `「${searchData.query}」に関する顧客情報：\n該当する顧客が3件見つかりました。` : '最近の顧客対応履歴を表示します。',
        citations: [
          {
            id: 'cit_3',
            type: 'database',
            title: '顧客マスタ',
            excerpt: '検索結果3件',
            relevanceScore: 0.88,
          },
        ],
      },
    };

    const presetResponse = responses[searchData.presetId];
    if (presetResponse) {
      return presetResponse;
    }

    return {
      content: searchData.query ? `「${searchData.query}」についての検索結果です。` : 'データを検索しています。',
      citations: [
        {
          id: 'cit_default',
          type: 'document',
          title: '検索結果',
          excerpt: '関連情報',
          relevanceScore: 0.75,
        },
      ],
    };
  }

  @Post('reception/cards/:cardId/:action')
  @ApiOperation({ summary: 'Reception card action (stub)' })
  async receptionCardAction(
    @Param('cardId') cardId: string,
    @Param('action') action: string,
  ) {
    return {
      success: true,
      message: `カードが${action === 'complete' ? '完了' : '処理'}されました`,
    };
  }

  @Post('maintenance/schedules/:scheduleId/complete')
  @ApiOperation({ summary: 'Complete maintenance (stub)' })
  async completeMaintenanceaync(
    @Param('scheduleId') scheduleId: string,
  ) {
    return {
      success: true,
      message: 'メンテナンスが完了しました',
    };
  }

  @Post('service/requests/:requestId/:action')
  @ApiOperation({ summary: 'Service request action (stub)' })
  async serviceRequestAction(
    @Param('requestId') requestId: string,
    @Param('action') action: string,
  ) {
    return {
      success: true,
      message: `リクエストが${action === 'assign' ? '割当' : '解決'}されました`,
    };
  }
}