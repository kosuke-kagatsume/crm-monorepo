import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma } from '@prisma/client';
import { addMonths, addYears, subDays, subWeeks, subMonths } from 'date-fns';
import { DWClient } from '@drm-suite/dw-adapter';
import { 
  DWMaintenanceRequest, 
  DWInspectionResult, 
  DWNotificationRequest 
} from '@drm-suite/dw-adapter';

export interface CreateInspectionScheduleDto {
  projectId: string;
  customerId: string;
  completionDate: Date;
  warrantyDetails?: {
    structure?: string;
    waterproof?: string;
    equipment?: string;
  };
  reminderSettings?: {
    oneMonth?: boolean;
    oneWeek?: boolean;
    oneDay?: boolean;
  };
}

export interface CreateDefectCaseDto {
  scheduleId: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'structural' | 'waterproof' | 'equipment' | 'cosmetic';
  location?: string;
  photos?: string[];
  identifiedBy: string;
}

export interface CreateQuickEstimateDto {
  customerId: string;
  defectId?: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  laborHours?: number;
  laborRate?: number;
  photos?: string[];
}

export interface CreateSatisfactionSurveyDto {
  customerId: string;
  projectId?: string;
  scheduleId?: string;
  npsScore: number;
  satisfactionScore: number;
  categories?: Record<string, number>;
  feedback?: string;
  surveyType: 'post_project' | 'post_inspection' | 'annual';
  surveyMethod: 'email' | 'phone' | 'in_person';
}

export interface InspectionChecklistDto {
  scheduleId: string;
  items: Array<{
    category: string;
    itemName: string;
    checkResult: 'OK' | 'NG' | 'NA';
    notes?: string;
    photoUrl?: string;
  }>;
  completedBy: string;
}

// ==================== v1.0 新機能: 保守契約管理 ====================

export interface CreateMaintenanceContractDto {
  customerId: string;
  projectId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  contractType: 'basic' | 'premium' | 'extended';
  amount: number;
  terms?: string;
  coverageDetails?: Record<string, any>;
}

export interface CreateInspectionDto {
  contractId: string;
  inspectionType: 'regular' | 'emergency' | 'warranty';
  scheduledDate: Date;
  inspector: string;
}

export interface CreateDefectRecordDto {
  inspectionId: string;
  category: 'structural' | 'waterproof' | 'equipment' | 'cosmetic';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
  photos?: string[];
  estimatedCost?: number;
}

export interface CreateMaintenanceRecordDto {
  contractId: string;
  maintenanceType: 'routine' | 'emergency' | 'repair';
  description: string;
  performedDate: Date;
  performedBy: string;
  duration?: number;
  cost?: number;
  materials?: string[];
  notes?: string;
}

export interface CreateInstantEstimateDto {
  customerId: string;
  contractId?: string;
  defectId?: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    unit?: string;
  }>;
  laborHours?: number;
  laborRate?: number;
  photos?: string[];
  location?: string;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
}

@Injectable()
export class AfterCareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dwClient: DWClient,
  ) {}

  // ==================== Inspection Schedule Management ====================

  async createInspectionSchedules(dto: CreateInspectionScheduleDto, companyId: string, storeId?: string) {
    const schedules = [];
    const baseDate = dto.completionDate;
    
    // Define inspection intervals
    const inspectionIntervals = [
      { type: '1_month', months: 1 },
      { type: '3_month', months: 3 },
      { type: '6_month', months: 6 },
      { type: '1_year', months: 12 },
      { type: '2_year', months: 24 },
      { type: '5_year', months: 60 },
      { type: '10_year', months: 120 },
    ];

    // Create schedules for each interval
    for (const interval of inspectionIntervals) {
      const scheduledDate = addMonths(baseDate, interval.months);
      
      const schedule = await this.prisma.afterCareSchedule.create({
        data: {
          companyId,
          storeId,
          projectId: dto.projectId,
          customerId: dto.customerId,
          inspectionType: interval.type,
          scheduledDate,
          status: 'scheduled',
          reminderSettings: JSON.stringify(dto.reminderSettings || {
            oneMonth: true,
            oneWeek: true,
            oneDay: false,
          }),
          metadata: JSON.stringify({
            warrantyDetails: dto.warrantyDetails,
            completionDate: dto.completionDate,
          }),
        },
      });

      schedules.push(schedule);

      // Create reminders based on settings
      if (dto.reminderSettings?.oneMonth) {
        await this.createReminder(schedule.id, '1_month_before', subMonths(scheduledDate, 1));
      }
      if (dto.reminderSettings?.oneWeek) {
        await this.createReminder(schedule.id, '1_week_before', subWeeks(scheduledDate, 1));
      }
      if (dto.reminderSettings?.oneDay) {
        await this.createReminder(schedule.id, '1_day_before', subDays(scheduledDate, 1));
      }
    }

    return schedules;
  }

  async getUpcomingInspections(companyId: string, days = 30, storeId?: string) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.prisma.afterCareSchedule.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: {
          gte: new Date(),
          lte: endDate,
        },
        status: { in: ['scheduled', 'reminded'] },
      },
      include: {
        customer: true,
        defects: {
          where: { status: { not: 'completed' } },
        },
        reminders: {
          where: { status: 'pending' },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });
  }

  async updateInspectionStatus(scheduleId: string, status: string, userId?: string) {
    const schedule = await this.prisma.afterCareSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Inspection schedule not found');
    }

    const updateData: any = { status };

    if (status === 'completed' && userId) {
      updateData.completedAt = new Date();
      updateData.completedBy = userId;
    }

    return await this.prisma.afterCareSchedule.update({
      where: { id: scheduleId },
      data: updateData,
    });
  }

  // ==================== Defect Management ====================

  async createDefectCase(dto: CreateDefectCaseDto) {
    const defect = await this.prisma.defectCase.create({
      data: {
        ...dto,
        photos: JSON.stringify(dto.photos || []),
        identifiedAt: new Date(),
      },
      include: {
        schedule: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Update inspection status if defects found
    await this.prisma.afterCareSchedule.update({
      where: { id: dto.scheduleId },
      data: { status: 'defect_found' },
    });

    return defect;
  }

  async updateDefectStatus(defectId: string, status: string, estimateId?: string, estimateAmount?: number) {
    return await this.prisma.defectCase.update({
      where: { id: defectId },
      data: {
        status,
        ...(estimateId && { estimateId }),
        ...(estimateAmount && { estimateAmount }),
        ...(status === 'completed' && { resolvedAt: new Date() }),
      },
    });
  }

  async getDefectsBySeverity(companyId: string, severity?: string) {
    return await this.prisma.defectCase.findMany({
      where: {
        schedule: {
          companyId,
        },
        ...(severity && { severity }),
        status: { not: 'completed' },
      },
      include: {
        schedule: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: [
        { severity: 'asc' }, // high comes first (alphabetically)
        { identifiedAt: 'desc' },
      ],
    });
  }

  // ==================== Quick Estimate Creation ====================

  async createQuickEstimate(dto: CreateQuickEstimateDto) {
    // Calculate total amount
    const itemsTotal = dto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const laborTotal = (dto.laborHours || 0) * (dto.laborRate || 0);
    const totalAmount = itemsTotal + laborTotal;

    // Create estimate in estimate service (simplified for demo)
    const estimate = {
      id: `QE-${Date.now()}`,
      customerId: dto.customerId,
      description: dto.description,
      items: dto.items,
      laborHours: dto.laborHours,
      laborRate: dto.laborRate,
      totalAmount,
      photos: dto.photos,
      createdAt: new Date(),
      status: 'draft',
    };

    // If linked to a defect, update the defect
    if (dto.defectId) {
      await this.updateDefectStatus(dto.defectId, 'estimate_created', estimate.id, totalAmount);
    }

    return estimate;
  }

  // ==================== Reminder Management ====================

  private async createReminder(scheduleId: string, timing: string, sendDate: Date) {
    return await this.prisma.inspectionReminder.create({
      data: {
        scheduleId,
        type: 'email', // Default to email
        timing,
        status: 'pending',
        metadata: JSON.stringify({
          scheduledSendDate: sendDate,
        }),
      },
    });
  }

  async processReminders() {
    const now = new Date();
    
    // Find pending reminders that should be sent now
    const reminders = await this.prisma.inspectionReminder.findMany({
      where: {
        status: 'pending',
        // Check metadata for scheduled send date
      },
      include: {
        schedule: {
          include: {
            customer: true,
          },
        },
      },
    });

    const processedReminders = [];

    for (const reminder of reminders) {
      const metadata = JSON.parse(reminder.metadata);
      const scheduledSendDate = new Date(metadata.scheduledSendDate);

      if (scheduledSendDate <= now) {
        // Send reminder (integrate with notification service)
        await this.sendReminder(reminder);

        // Update reminder status
        await this.prisma.inspectionReminder.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: now,
            sentTo: reminder.schedule.customer.email,
          },
        });

        // Update schedule last reminder
        await this.prisma.afterCareSchedule.update({
          where: { id: reminder.scheduleId },
          data: {
            lastReminderAt: now,
            status: 'reminded',
          },
        });

        processedReminders.push(reminder);
      }
    }

    return processedReminders;
  }

  private async sendReminder(reminder: any) {
    // TODO: Integrate with email/SMS/LINE service
    console.log('Sending reminder:', {
      to: reminder.schedule.customer.email,
      type: reminder.type,
      inspection: reminder.schedule.inspectionType,
      date: reminder.schedule.scheduledDate,
    });
  }

  // ==================== Checklist Management ====================

  async completeInspectionChecklist(dto: InspectionChecklistDto) {
    // Create checklist items
    const items = [];
    for (let i = 0; i < dto.items.length; i++) {
      const item = await this.prisma.checklistItem.create({
        data: {
          scheduleId: dto.scheduleId,
          ...dto.items[i],
          sequence: i + 1,
          checkedAt: new Date(),
          checkedBy: dto.completedBy,
        },
      });
      items.push(item);
    }

    // Check if any defects found (NG results)
    const hasDefects = dto.items.some(item => item.checkResult === 'NG');

    // Update inspection status
    await this.updateInspectionStatus(
      dto.scheduleId,
      hasDefects ? 'defect_found' : 'completed',
      dto.completedBy
    );

    return items;
  }

  async getChecklistTemplate(inspectionType: string) {
    // Return standard checklist based on inspection type
    const templates: Record<string, any[]> = {
      '1_month': [
        { category: 'exterior', itemName: '外壁クラック', sequence: 1 },
        { category: 'exterior', itemName: '屋根の状態', sequence: 2 },
        { category: 'equipment', itemName: '設備動作確認', sequence: 3 },
      ],
      '6_month': [
        { category: 'exterior', itemName: '外壁状態', sequence: 1 },
        { category: 'exterior', itemName: '防水性能', sequence: 2 },
        { category: 'interior', itemName: '内装仕上げ', sequence: 3 },
        { category: 'equipment', itemName: '給排水設備', sequence: 4 },
      ],
      '1_year': [
        { category: 'structural', itemName: '構造体の状態', sequence: 1 },
        { category: 'exterior', itemName: '外壁・屋根全般', sequence: 2 },
        { category: 'waterproof', itemName: '防水層の状態', sequence: 3 },
        { category: 'interior', itemName: '内装全般', sequence: 4 },
        { category: 'equipment', itemName: '設備機器全般', sequence: 5 },
      ],
    };

    return templates[inspectionType] || templates['1_year'];
  }

  // ==================== Customer Satisfaction ====================

  async createSatisfactionSurvey(dto: CreateSatisfactionSurveyDto, companyId: string) {
    return await this.prisma.customerSatisfaction.create({
      data: {
        companyId,
        ...dto,
        categories: JSON.stringify(dto.categories || {}),
        surveyDate: new Date(),
        respondedAt: new Date(),
      },
    });
  }

  async getSatisfactionMetrics(companyId: string, period?: { start: Date; end: Date }) {
    const where: any = { companyId };
    
    if (period) {
      where.surveyDate = {
        gte: period.start,
        lte: period.end,
      };
    }

    const surveys = await this.prisma.customerSatisfaction.findMany({
      where,
    });

    if (surveys.length === 0) {
      return {
        averageNPS: 0,
        averageSatisfaction: 0,
        totalResponses: 0,
        npsBreakdown: { promoters: 0, passives: 0, detractors: 0 },
      };
    }

    // Calculate metrics
    const totalNPS = surveys.reduce((sum, s) => sum + s.npsScore, 0);
    const totalSatisfaction = surveys.reduce((sum, s) => sum + s.satisfactionScore, 0);

    const npsBreakdown = {
      promoters: surveys.filter(s => s.npsScore >= 9).length,
      passives: surveys.filter(s => s.npsScore >= 7 && s.npsScore < 9).length,
      detractors: surveys.filter(s => s.npsScore < 7).length,
    };

    const npsScore = ((npsBreakdown.promoters - npsBreakdown.detractors) / surveys.length) * 100;

    return {
      averageNPS: npsScore,
      averageSatisfaction: totalSatisfaction / surveys.length,
      totalResponses: surveys.length,
      npsBreakdown,
      responseRate: 0, // Would need to calculate based on total customers
    };
  }

  // ==================== Warranty Management ====================

  async createWarrantyRecord(projectId: string, customerId: string, companyId: string) {
    const warrantyTypes = [
      { type: 'structure', years: 10, description: '構造体保証' },
      { type: 'waterproof', years: 5, description: '防水保証' },
      { type: 'equipment', years: 1, description: '設備保証' },
    ];

    const warranties = [];
    const startDate = new Date();

    for (const warranty of warrantyTypes) {
      const record = await this.prisma.warrantyRecord.create({
        data: {
          companyId,
          projectId,
          customerId,
          warrantyType: warranty.type,
          startDate,
          endDate: addYears(startDate, warranty.years),
          coverageDetails: JSON.stringify({
            description: warranty.description,
            years: warranty.years,
            coverage: this.getWarrantyCoverage(warranty.type),
          }),
          certificateNo: `W-${projectId}-${warranty.type.toUpperCase()}`,
        },
      });
      warranties.push(record);
    }

    return warranties;
  }

  private getWarrantyCoverage(type: string): string[] {
    const coverage: Record<string, string[]> = {
      structure: ['構造耐力上主要な部分', '基礎', '柱', '梁', '耐力壁'],
      waterproof: ['屋根防水', '外壁防水', 'バルコニー防水', '浴室防水'],
      equipment: ['給排水設備', '電気設備', '換気設備', 'ガス設備'],
    };
    return coverage[type] || [];
  }

  async createWarrantyClaim(warrantyId: string, description: string, userId: string) {
    const warranty = await this.prisma.warrantyRecord.findUnique({
      where: { id: warrantyId },
    });

    if (!warranty) {
      throw new NotFoundException('Warranty record not found');
    }

    if (!warranty.isActive || warranty.endDate < new Date()) {
      throw new BadRequestException('Warranty has expired');
    }

    const claimCount = warranty.claimCount + 1;
    const claimNo = `CL-${warranty.certificateNo}-${String(claimCount).padStart(3, '0')}`;

    const claim = await this.prisma.warrantyClaim.create({
      data: {
        warrantyId,
        claimNo,
        description,
        claimDate: new Date(),
        status: 'submitted',
      },
    });

    // Update warranty claim count
    await this.prisma.warrantyRecord.update({
      where: { id: warrantyId },
      data: { claimCount },
    });

    return claim;
  }

  async getActiveWarranties(customerId: string) {
    const now = new Date();
    
    return await this.prisma.warrantyRecord.findMany({
      where: {
        customerId,
        isActive: true,
        endDate: { gte: now },
      },
      include: {
        claims: {
          where: { status: { not: 'completed' } },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });
  }

  // ==================== Dashboard Metrics ====================

  async getAfterCareDashboardMetrics(companyId: string, storeId?: string) {
    const now = new Date();
    const thirtyDaysFromNow = addMonths(now, 1);

    // Upcoming inspections
    const upcomingInspections = await this.prisma.afterCareSchedule.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        status: { in: ['scheduled', 'reminded'] },
      },
    });

    // Active defects
    const activeDefects = await this.prisma.defectCase.count({
      where: {
        schedule: {
          companyId,
          ...(storeId && { storeId }),
        },
        status: { not: 'completed' },
      },
    });

    // Defects by severity
    const defectsBySeverity = await this.prisma.defectCase.groupBy({
      by: ['severity'],
      where: {
        schedule: {
          companyId,
          ...(storeId && { storeId }),
        },
        status: { not: 'completed' },
      },
      _count: true,
    });

    // Recent satisfaction metrics
    const satisfactionMetrics = await this.getSatisfactionMetrics(companyId, {
      start: subMonths(now, 1),
      end: now,
    });

    // Overdue inspections
    const overdueInspections = await this.prisma.afterCareSchedule.count({
      where: {
        companyId,
        ...(storeId && { storeId }),
        scheduledDate: { lt: now },
        status: { in: ['scheduled', 'reminded'] },
      },
    });

    return {
      upcomingInspections,
      overdueInspections,
      activeDefects,
      defectsBySeverity: {
        high: defectsBySeverity.find(d => d.severity === 'high')?._count || 0,
        medium: defectsBySeverity.find(d => d.severity === 'medium')?._count || 0,
        low: defectsBySeverity.find(d => d.severity === 'low')?._count || 0,
      },
      satisfactionMetrics,
      inspectionCompletionRate: 0, // Would calculate based on completed vs scheduled
    };
  }

  // ==================== v1.0 新機能: 保守契約管理 ====================

  /**
   * 保守契約作成
   */
  async createMaintenanceContract(dto: CreateMaintenanceContractDto, companyId: string) {
    const contract = await this.prisma.maintenanceContract.create({
      data: {
        ...dto,
        companyId,
        status: 'active',
        coverageDetails: JSON.stringify(dto.coverageDetails || {}),
      },
      include: {
        customer: true,
      },
    });

    // DWに保守契約を通知
    try {
      const dwRequest: DWMaintenanceRequest = {
        contractId: contract.id,
        customerId: contract.customerId,
        inspectionType: 'regular',
        scheduledDate: contract.startDate.toISOString(),
        inspector: 'TBD',
      };

      await this.dwClient.createMaintenanceSchedule(dwRequest);
    } catch (error) {
      console.error('Failed to sync maintenance contract with DW:', error);
    }

    return contract;
  }

  /**
   * 定期点検作成・スケジューリング
   */
  async createInspection(dto: CreateInspectionDto, companyId: string) {
    const contract = await this.prisma.maintenanceContract.findUnique({
      where: { id: dto.contractId },
      include: { customer: true },
    });

    if (!contract) {
      throw new NotFoundException('Maintenance contract not found');
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        ...dto,
        status: 'scheduled',
        checklist: JSON.stringify(this.getInspectionChecklist(dto.inspectionType)),
        photos: JSON.stringify([]),
        findings: JSON.stringify({}),
      },
      include: {
        contract: {
          include: {
            customer: true,
          },
        },
      },
    });

    // 自動リマインダー設定
    await this.scheduleInspectionReminders(inspection.id, dto.scheduledDate);

    // DW連携
    try {
      const dwRequest: DWMaintenanceRequest = {
        contractId: dto.contractId,
        customerId: contract.customerId,
        inspectionType: dto.inspectionType,
        scheduledDate: dto.scheduledDate.toISOString(),
        inspector: dto.inspector,
      };

      await this.dwClient.createMaintenanceSchedule(dwRequest);
    } catch (error) {
      console.error('Failed to sync inspection with DW:', error);
    }

    return inspection;
  }

  /**
   * 点検結果登録と是正記録作成
   */
  async completeInspection(
    inspectionId: string,
    findings: Record<string, any>,
    photos: string[],
    inspector: string,
    defects?: CreateDefectRecordDto[]
  ) {
    const inspection = await this.prisma.inspection.update({
      where: { id: inspectionId },
      data: {
        completedDate: new Date(),
        findings: JSON.stringify(findings),
        photos: JSON.stringify(photos),
        status: 'completed',
      },
      include: {
        contract: true,
      },
    });

    // 是正記録の作成
    const createdDefects = [];
    if (defects && defects.length > 0) {
      for (const defectDto of defects) {
        const defect = await this.prisma.defectRecord.create({
          data: {
            ...defectDto,
            inspectionId,
            photos: JSON.stringify(defectDto.photos || []),
            status: 'identified',
            warrantyApplicable: this.isWarrantyApplicable(defectDto.category, inspection.contract),
          },
        });
        createdDefects.push(defect);
      }
    }

    // 次回点検日の自動設定
    const nextInspectionDate = this.calculateNextInspectionDate(
      inspection.inspectionType,
      inspection.completedDate!
    );

    if (nextInspectionDate) {
      await this.prisma.inspection.update({
        where: { id: inspectionId },
        data: { nextInspectionDate },
      });
    }

    // DW結果送信
    try {
      const dwResult: DWInspectionResult = {
        inspectionId,
        completedDate: new Date().toISOString(),
        findings,
        photos,
        defects: createdDefects.map(d => ({
          category: d.category,
          description: d.description,
          severity: d.severity,
          location: d.location || '',
          photos: JSON.parse(d.photos),
          estimatedCost: d.estimatedCost ? Number(d.estimatedCost) : undefined,
        })),
        nextInspectionDate: nextInspectionDate?.toISOString(),
      };

      await this.dwClient.submitInspectionResult(dwResult);
    } catch (error) {
      console.error('Failed to submit inspection result to DW:', error);
    }

    return {
      inspection,
      defects: createdDefects,
    };
  }

  /**
   * 即時見積作成（現場対応）
   */
  async createInstantEstimate(dto: CreateInstantEstimateDto, userId: string) {
    // 見積計算
    const itemsTotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const laborTotal = (dto.laborHours || 0) * (dto.laborRate || 0);
    const subtotal = itemsTotal + laborTotal;
    
    // 緊急度による係数
    const urgencyMultiplier = this.getUrgencyMultiplier(dto.urgency || 'medium');
    const totalAmount = subtotal * urgencyMultiplier;

    // 見積番号自動生成
    const estimateNo = `IE-${Date.now()}`;

    // 見積データ作成（簡易版）
    const estimate = {
      id: estimateNo,
      customerId: dto.customerId,
      contractId: dto.contractId,
      description: dto.description,
      items: dto.items,
      laborHours: dto.laborHours,
      laborRate: dto.laborRate,
      subtotal,
      urgencyMultiplier,
      totalAmount,
      photos: dto.photos || [],
      location: dto.location,
      urgency: dto.urgency,
      createdBy: userId,
      createdAt: new Date(),
      status: 'instant_draft',
      type: 'instant_repair',
    };

    // 是正記録と紐付ける場合
    if (dto.defectId) {
      await this.prisma.defectRecord.update({
        where: { id: dto.defectId },
        data: {
          status: 'repair_scheduled',
          estimatedCost: totalAmount,
        },
      });
    }

    return estimate;
  }

  /**
   * 保守記録作成
   */
  async createMaintenanceRecord(dto: CreateMaintenanceRecordDto) {
    const record = await this.prisma.maintenanceRecord.create({
      data: {
        ...dto,
        materials: JSON.stringify(dto.materials || []),
        nextMaintenance: this.calculateNextMaintenanceDate(
          dto.maintenanceType,
          dto.performedDate
        ),
      },
      include: {
        contract: {
          include: {
            customer: true,
          },
        },
      },
    });

    return record;
  }

  /**
   * クレーム管理
   */
  async createClaim(
    customerId: string,
    category: string,
    description: string,
    severity: string,
    companyId: string,
    projectId?: string
  ) {
    const claimNumber = `CLM-${Date.now()}`;

    const claim = await this.prisma.claim.create({
      data: {
        companyId,
        customerId,
        projectId,
        claimNumber,
        category,
        description,
        severity,
        status: 'open',
        submittedDate: new Date(),
        metadata: JSON.stringify({}),
      },
      include: {
        customer: true,
      },
    });

    return claim;
  }

  // ==================== v1.0 新機能: 受注化プロセス ====================

  /**
   * 是正見積から受注への変換
   */
  async convertEstimateToOrder(estimateId: string, approvedAmount: number, workStartDate: Date) {
    // 通常の工事台帳システムに合流
    // LedgerServiceと連携してプロジェクト台帳を作成

    const orderNo = `REP-${Date.now()}`;
    
    const order = {
      id: orderNo,
      estimateId,
      approvedAmount,
      workStartDate,
      status: 'ordered',
      orderDate: new Date(),
      // 工事台帳への登録は別途実装
    };

    return order;
  }

  // ==================== ヘルパーメソッド ====================

  private getInspectionChecklist(inspectionType: string) {
    const checklists = {
      regular: [
        { category: 'exterior', item: '外壁状態確認', required: true },
        { category: 'roof', item: '屋根状態確認', required: true },
        { category: 'equipment', item: '設備動作確認', required: true },
      ],
      emergency: [
        { category: 'safety', item: '安全性確認', required: true },
        { category: 'structural', item: '構造体確認', required: true },
      ],
      warranty: [
        { category: 'warranty_items', item: '保証対象項目確認', required: true },
      ],
    };

    return checklists[inspectionType] || checklists.regular;
  }

  private async scheduleInspectionReminders(inspectionId: string, scheduledDate: Date) {
    const reminderDates = [
      { days: 7, type: 'one_week_before' },
      { days: 1, type: 'one_day_before' },
    ];

    for (const reminder of reminderDates) {
      const reminderDate = subDays(scheduledDate, reminder.days);
      
      // 通知スケジュール登録（実装は通知サービスに依存）
      await this.scheduleNotification({
        recipientId: 'inspector', // 実際は適切なユーザーIDを設定
        type: 'email',
        title: '点検予定のお知らせ',
        message: `${reminder.days}日後に点検が予定されています。`,
        priority: 3,
        metadata: {
          inspectionId,
          reminderType: reminder.type,
          scheduledDate: scheduledDate.toISOString(),
        },
      });
    }
  }

  private isWarrantyApplicable(category: string, contract: any): boolean {
    const warrantyCategories = ['structural', 'waterproof'];
    return warrantyCategories.includes(category) && contract.endDate > new Date();
  }

  private calculateNextInspectionDate(inspectionType: string, completedDate: Date): Date | null {
    const intervals = {
      regular: { months: 6 },
      emergency: null, // 緊急点検は次回自動設定なし
      warranty: { months: 12 },
    };

    const interval = intervals[inspectionType];
    return interval ? addMonths(completedDate, interval.months) : null;
  }

  private getUrgencyMultiplier(urgency: string): number {
    const multipliers = {
      low: 1.0,
      medium: 1.1,
      high: 1.2,
      emergency: 1.5,
    };

    return multipliers[urgency] || 1.0;
  }

  private calculateNextMaintenanceDate(maintenanceType: string, performedDate: Date): Date | null {
    const intervals = {
      routine: { months: 3 },
      emergency: null,
      repair: { months: 6 },
    };

    const interval = intervals[maintenanceType];
    return interval ? addMonths(performedDate, interval.months) : null;
  }

  private async scheduleNotification(notification: DWNotificationRequest) {
    try {
      await this.dwClient.sendNotification(notification);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }
}