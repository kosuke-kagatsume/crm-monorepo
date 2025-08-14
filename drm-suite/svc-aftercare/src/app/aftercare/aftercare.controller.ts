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
import { AftercareService } from './aftercare.service';
import { ContractService } from './contract.service';
import { InspectionService } from './inspection.service';
import { ClaimService } from './claim.service';
import { SurveyService } from './survey.service';
import {
  CreateContractDto,
  UpdateContractDto,
  ContractFilterDto,
  CreateInspectionDto,
  CompleteInspectionDto,
  CreateClaimDto,
  ResolveClaimDto,
  CreateSurveyDto,
  CreateMaintenanceDto,
} from './dto';

@Controller('aftercare')
export class AftercareController {
  constructor(
    private readonly aftercareService: AftercareService,
    private readonly contractService: ContractService,
    private readonly inspectionService: InspectionService,
    private readonly claimService: ClaimService,
    private readonly surveyService: SurveyService,
  ) {}

  // 保守契約エンドポイント
  @Post('contracts')
  @HttpCode(HttpStatus.CREATED)
  async createContract(@Body() dto: CreateContractDto) {
    return this.contractService.create(dto);
  }

  @Get('contracts')
  async getContracts(@Query() filter: ContractFilterDto) {
    return this.contractService.findAll(filter);
  }

  @Get('contracts/:id')
  async getContract(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Put('contracts/:id')
  async updateContract(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractService.update(id, dto);
  }

  @Delete('contracts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContract(@Param('id') id: string) {
    return this.contractService.remove(id);
  }

  // 定期点検エンドポイント
  @Post('inspections')
  @HttpCode(HttpStatus.CREATED)
  async createInspection(@Body() dto: CreateInspectionDto) {
    return this.inspectionService.create(dto);
  }

  @Get('inspections')
  async getInspections(@Query() filter: any) {
    return this.inspectionService.findAll(filter);
  }

  @Put('inspections/:id/complete')
  async completeInspection(
    @Param('id') id: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.inspectionService.complete(id, dto);
  }

  // メンテナンス記録エンドポイント
  @Post('maintenance')
  @HttpCode(HttpStatus.CREATED)
  async createMaintenance(@Body() dto: CreateMaintenanceDto) {
    return this.aftercareService.createMaintenanceRecord(dto);
  }

  @Get('maintenance/history/:customerId')
  async getMaintenanceHistory(@Param('customerId') customerId: string) {
    return this.aftercareService.getMaintenanceHistory(customerId);
  }

  // クレーム管理エンドポイント
  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  async createClaim(@Body() dto: CreateClaimDto) {
    return this.claimService.create(dto);
  }

  @Get('claims')
  async getClaims(@Query() filter: any) {
    return this.claimService.findAll(filter);
  }

  @Put('claims/:id/resolve')
  async resolveClaim(
    @Param('id') id: string,
    @Body() dto: ResolveClaimDto,
  ) {
    return this.claimService.resolve(id, dto);
  }

  // 満足度調査エンドポイント
  @Post('surveys')
  @HttpCode(HttpStatus.CREATED)
  async createSurvey(@Body() dto: CreateSurveyDto) {
    return this.surveyService.create(dto);
  }

  @Get('surveys/results')
  async getSurveyResults(@Query() filter: any) {
    return this.surveyService.getResults(filter);
  }

  // ダッシュボード用集計データ
  @Get('dashboard')
  async getDashboardData() {
    return this.aftercareService.getDashboardData();
  }
}