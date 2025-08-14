import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AccountingService } from './accounting.service';
import { AccountingAdapterService } from '@drm-suite/accounting-adapter';

@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly adapterService: AccountingAdapterService,
  ) {}

  @Post('export')
  async exportAccountingData(
    @Query('companyId') companyId: string,
    @Query('period') period: string,
    @Query('format') format: string = 'csv',
    @Res() res: Response,
  ) {
    if (!companyId || !period) {
      throw new BadRequestException('companyId and period are required');
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException('Period must be in YYYY-MM format');
    }

    const [year, month] = period.split('-').map(Number);
    
    // Get ledger data for the period
    const ledgerData = await this.accountingService.getMonthlyLedgerData(
      companyId,
      year,
      month,
    );

    // Get company-specific mapping
    const mapping = await this.adapterService.getCompanyMapping(companyId);

    // Generate CSV with mapped data
    const csvData = await this.adapterService.generateCSV(
      ledgerData,
      mapping,
      format,
    );

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="accounting_${companyId}_${period}.csv"`,
    );
    res.status(HttpStatus.OK).send(csvData);
  }

  @Get('mapping')
  async getAccountingMapping(@Query('companyId') companyId: string) {
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }

    return this.adapterService.getCompanyMapping(companyId);
  }

  @Post('mapping')
  async updateAccountingMapping(
    @Query('companyId') companyId: string,
    @Query('system') system: string,
    mapping: any,
  ) {
    if (!companyId || !system) {
      throw new BadRequestException('companyId and system are required');
    }

    return this.adapterService.updateCompanyMapping(companyId, system, mapping);
  }

  @Get('summary')
  async getAccountingSummary(
    @Query('companyId') companyId: string,
    @Query('period') period: string,
  ) {
    if (!companyId || !period) {
      throw new BadRequestException('companyId and period are required');
    }

    const [year, month] = period.split('-').map(Number);

    return this.accountingService.getAccountingSummary(companyId, year, month);
  }
}