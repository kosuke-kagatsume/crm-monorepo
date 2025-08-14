import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JournalService } from './journal.service';
import { AccountService } from './account.service';
import { ReportService } from './report.service';
import { IntegrationService } from './integration.service';
import {
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  JournalFilterDto,
  CreateAccountDto,
  UpdateAccountDto,
  ReportPeriodDto,
  ExportFormatDto,
  ImportDataDto,
} from './dto';

@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly journalService: JournalService,
    private readonly accountService: AccountService,
    private readonly reportService: ReportService,
    private readonly integrationService: IntegrationService,
  ) {}

  // 仕訳エンドポイント
  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  async createJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.journalService.create(dto);
  }

  @Get('entries')
  async getJournalEntries(@Query() filter: JournalFilterDto) {
    return this.journalService.findAll(filter);
  }

  @Get('entries/:id')
  async getJournalEntry(@Param('id') id: string) {
    return this.journalService.findOne(id);
  }

  @Put('entries/:id')
  async updateJournalEntry(
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalService.update(id, dto);
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJournalEntry(@Param('id') id: string) {
    return this.journalService.remove(id);
  }

  // 勘定科目エンドポイント
  @Get('accounts')
  async getAccounts(@Query() filter: any) {
    return this.accountService.findAll(filter);
  }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return this.accountService.findOne(id);
  }

  @Put('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(id, dto);
  }

  // レポートエンドポイント
  @Get('reports/trial-balance')
  async getTrialBalance(@Query() period: ReportPeriodDto) {
    return this.reportService.generateTrialBalance(period);
  }

  @Get('reports/profit-loss')
  async getProfitLoss(@Query() period: ReportPeriodDto) {
    return this.reportService.generateProfitLoss(period);
  }

  @Get('reports/balance-sheet')
  async getBalanceSheet(@Query() period: ReportPeriodDto) {
    return this.reportService.generateBalanceSheet(period);
  }

  @Get('reports/cash-flow')
  async getCashFlow(@Query() period: ReportPeriodDto) {
    return this.reportService.generateCashFlow(period);
  }

  @Get('reports/general-ledger')
  async getGeneralLedger(@Query() filter: any) {
    return this.reportService.generateGeneralLedger(filter);
  }

  // 外部連携エンドポイント
  @Post('export/:format')
  async exportData(
    @Param('format') format: string,
    @Body() dto: ExportFormatDto,
  ) {
    return this.integrationService.exportData(format, dto);
  }

  @Post('import/:format')
  async importData(
    @Param('format') format: string,
    @Body() dto: ImportDataDto,
  ) {
    return this.integrationService.importData(format, dto);
  }

  // 分析エンドポイント
  @Get('analysis/ratios')
  async getFinancialRatios(@Query() period: ReportPeriodDto) {
    return this.ledgerService.calculateFinancialRatios(period);
  }

  @Get('analysis/trends')
  async getTrendAnalysis(@Query() filter: any) {
    return this.ledgerService.analyzeTrends(filter);
  }

  @Get('analysis/budget-variance')
  async getBudgetVariance(@Query() period: ReportPeriodDto) {
    return this.ledgerService.calculateBudgetVariance(period);
  }

  // ==================== v1.0 計画ベース機能 ====================

  // 1分ウィザード - 会社プラン初期化
  @Post('companies/:companyId/init-plan')
  @HttpCode(HttpStatus.CREATED)
  async initializeCompanyPlan(
    @Param('companyId') companyId: string,
    @Body() dto: { 
      plan: 'LITE' | 'STANDARD' | 'PRO';
      preferences: {
        billingMode: 'MILESTONE' | 'PERCENT_COMPLETE';
        retainagePct: number;
        hasAdvancePayment: boolean;
      };
    }
  ) {
    return this.ledgerService.initializeCompanyPlan(companyId, dto.plan, dto.preferences);
  }

  // 会社プラン情報取得
  @Get('companies/:companyId/plan')
  async getCompanyPlan(@Param('companyId') companyId: string) {
    return this.ledgerService.getCompanyPlan(companyId);
  }

  // 契約履歴管理
  @Get('companies/:companyId/contracts/:contractId/history')
  async getContractHistory(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string
  ) {
    return this.ledgerService.getContractHistory(contractId);
  }

  @Post('companies/:companyId/contracts/:contractId/revisions')
  @HttpCode(HttpStatus.CREATED)
  async createContractRevision(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string,
    @Body() dto: {
      revisionType: string;
      amount: number;
      reason: string;
      approvedBy: string;
    }
  ) {
    return this.ledgerService.createContractRevision(contractId, dto.revisionType, dto.amount, dto.reason, dto.approvedBy);
  }

  // 予算変更管理
  @Get('companies/:companyId/contracts/:contractId/budget-revisions')
  async getBudgetRevisions(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string
  ) {
    return this.ledgerService.getBudgetRevisions(contractId);
  }

  @Post('companies/:companyId/contracts/:contractId/budget-revisions')
  @HttpCode(HttpStatus.CREATED)
  async createBudgetRevision(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string,
    @Body() dto: {
      category: string;
      originalAmount: number;
      revisedAmount: number;
      reason: string;
      approvalRequired: boolean;
      requestedBy: string;
    }
  ) {
    return this.ledgerService.createBudgetRevision(contractId, dto.category, dto.originalAmount, dto.revisedAmount, dto.reason, dto.approvalRequired, dto.requestedBy);
  }

  // 請求書管理
  @Get('companies/:companyId/invoices')
  async getInvoices(
    @Param('companyId') companyId: string,
    @Query() filter: { 
      contractId?: string; 
      status?: string; 
      startDate?: string; 
      endDate?: string; 
    }
  ) {
    return this.ledgerService.getInvoices(companyId, filter);
  }

  @Post('companies/:companyId/invoices')
  @HttpCode(HttpStatus.CREATED)
  async createInvoice(
    @Param('companyId') companyId: string,
    @Body() dto: {
      contractId: string;
      billType: string;
      amount: number;
      dueDate: Date;
      items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
      }>;
    }
  ) {
    return this.ledgerService.createInvoice(companyId, dto.contractId, dto.billType, dto.amount, dto.dueDate, dto.items);
  }

  @Put('companies/:companyId/invoices/:invoiceId/status')
  async updateInvoiceStatus(
    @Param('companyId') companyId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: { status: string; paidDate?: Date; notes?: string }
  ) {
    return this.ledgerService.updateInvoiceStatus(invoiceId, dto.status, dto.paidDate, dto.notes);
  }

  // 入金管理
  @Get('companies/:companyId/payments')
  async getPayments(
    @Param('companyId') companyId: string,
    @Query() filter: { 
      invoiceId?: string; 
      startDate?: string; 
      endDate?: string; 
    }
  ) {
    return this.ledgerService.getPayments(companyId, filter);
  }

  @Post('companies/:companyId/payments')
  @HttpCode(HttpStatus.CREATED)
  async recordPayment(
    @Param('companyId') companyId: string,
    @Body() dto: {
      invoiceId: string;
      amount: number;
      paymentDate: Date;
      paymentMethod: string;
      reference?: string;
    }
  ) {
    return this.ledgerService.recordPayment(dto.invoiceId, dto.amount, dto.paymentDate, dto.paymentMethod, dto.reference);
  }

  // 出来高進捗管理
  @Get('companies/:companyId/contracts/:contractId/progress')
  async getProgressApprovals(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string
  ) {
    return this.ledgerService.getProgressApprovals(contractId);
  }

  @Post('companies/:companyId/contracts/:contractId/progress')
  @HttpCode(HttpStatus.CREATED)
  async submitProgressApproval(
    @Param('companyId') companyId: string,
    @Param('contractId') contractId: string,
    @Body() dto: {
      progressPercent: number;
      approvedAmount: number;
      approver: string;
      photos: string[];
      notes?: string;
    }
  ) {
    return this.ledgerService.submitProgressApproval(contractId, dto.progressPercent, dto.approvedAmount, dto.approver, dto.photos, dto.notes);
  }

  // 保留金管理（PRO機能）
  @Get('companies/:companyId/retention')
  async getRetentionReleases(
    @Param('companyId') companyId: string,
    @Query() filter: { contractId?: string; status?: string }
  ) {
    return this.ledgerService.getRetentionReleases(companyId, filter);
  }

  @Post('companies/:companyId/retention/release')
  @HttpCode(HttpStatus.CREATED)
  async createRetentionRelease(
    @Param('companyId') companyId: string,
    @Body() dto: {
      contractId: string;
      releaseType: string;
      amount: number;
      releasedBy: string;
    }
  ) {
    return this.ledgerService.createRetentionRelease(dto.contractId, dto.releaseType, dto.amount, dto.releasedBy);
  }

  // プラン別機能チェック
  @Get('companies/:companyId/features/:feature/check')
  async checkFeatureAccess(
    @Param('companyId') companyId: string,
    @Param('feature') feature: string
  ) {
    return this.ledgerService.checkFeatureAccess(companyId, feature);
  }

  // ダッシュボード用集計データ
  @Get('dashboard')
  async getDashboardData() {
    return this.ledgerService.getDashboardData();
  }

  // 計画ベース統計ダッシュボード
  @Get('companies/:companyId/dashboard/stats')
  async getPlanBasedStats(@Param('companyId') companyId: string) {
    return this.ledgerService.getPlanBasedStats(companyId);
  }

  // 締め処理
  @Post('closing/month')
  async performMonthlyClosing(@Body() dto: { year: number; month: number }) {
    return this.ledgerService.performMonthlyClosing(dto.year, dto.month);
  }

  @Post('closing/year')
  async performYearlyClosing(@Body() dto: { year: number }) {
    return this.ledgerService.performYearlyClosing(dto.year);
  }
}