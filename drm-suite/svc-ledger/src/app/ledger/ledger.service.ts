import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma } from '@prisma/client';
import { DWClient } from '@drm-suite/dw-adapter';
import { AccountingAdapterService } from '@drm-suite/accounting-adapter';
import { 
  DWLedgerSyncRequest, 
  DWCreateChangeOrderRequest, 
  DWApproveProgressRequest 
} from '@drm-suite/dw-adapter';
import { 
  ProjectLedgerData, 
  ProjectCostData,
  JournalEntry 
} from '@drm-suite/accounting-adapter';

export interface CreateLedgerDto {
  projectId: string;
  contractAmount: number;
  billingMode: 'MILESTONE' | 'PERCENT_COMPLETE';
  retainagePct?: number;
  retainageReleaseRule?: 'ON_FINAL' | 'ON_INSPECTION';
}

export interface CreateSubLedgerDto {
  ledgerId: string;
  tradeCode: string;
  name: string;
}

export interface CreateBudgetDto {
  subId: string;
  costCode: string;
  costName: string;
  plannedQty?: number;
  unit?: string;
  plannedAmt: number;
  taxCode?: string;
}

export interface CreateCostDto {
  subId: string;
  docType: 'MATERIAL' | 'OUTSOURCE' | 'LABOR';
  vendorId?: string;
  vendorName: string;
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
  taxCode?: string;
  invoiceNo?: string;
  invoiceDate?: Date;
  source?: string;
  sourceRef?: string;
}

export interface CreateProgressDto {
  subId: string;
  date: Date;
  progressPct: number;
  earnedValueAmt: number;
  notes?: string;
}

export interface CreateChangeOrderDto {
  ledgerId: string;
  code: string;
  description: string;
  deltaAmt: number;
  reason: string;
  requestedBy?: string;
}

export interface CreateMilestoneDto {
  ledgerId: string;
  type: 'START' | 'MID' | 'FINAL' | 'CUSTOM';
  name: string;
  sequence: number;
  plannedDate: Date;
  plannedAmt: number;
}

export interface LedgerMetrics {
  budgetTotal: number;
  costTotal: number;
  variance: number;
  variancePct: number;
  progressPct: number;
  earnedValue: number;
  changeOrderTotal: number;
  retainageHeld: number;
  billedAmount: number;
  unbilledAmount: number;
  profitMargin: number;
  profitMarginPct: number;
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dwClient: DWClient,
    private readonly accountingAdapter: AccountingAdapterService,
  ) {}

  // ==================== Ledger Management ====================
  
  async createLedger(dto: CreateLedgerDto, companyId: string, storeId?: string) {
    // Check if ledger already exists for project
    const existing = await this.prisma.projectLedger.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existing) {
      throw new BadRequestException('Ledger already exists for this project');
    }

    const ledger = await this.prisma.projectLedger.create({
      data: {
        ...dto,
        companyId,
        storeId,
        retainagePct: dto.retainagePct ?? 5.0,
        retainageReleaseRule: dto.retainageReleaseRule ?? 'ON_FINAL',
      },
      include: {
        subLedgers: true,
        changeOrders: true,
        retainage: true,
        milestoneBilling: true,
      },
    });

    // Create retainage record
    await this.prisma.retainage.create({
      data: {
        ledgerId: ledger.id,
        pct: ledger.retainagePct,
        rule: ledger.retainageReleaseRule,
      },
    });

    // Create default milestones for MILESTONE billing mode
    if (dto.billingMode === 'MILESTONE') {
      await this.createDefaultMilestones(ledger.id, dto.contractAmount);
    }

    return ledger;
  }

  async createSubLedger(dto: CreateSubLedgerDto) {
    // Auto-generate sequence number
    const maxSeq = await this.prisma.ledgerSub.findFirst({
      where: {
        ledgerId: dto.ledgerId,
        tradeCode: dto.tradeCode,
      },
      orderBy: {
        seq: 'desc',
      },
    });

    const seq = (maxSeq?.seq ?? 0) + 1;

    return await this.prisma.ledgerSub.create({
      data: {
        ...dto,
        seq,
      },
      include: {
        budgets: true,
        costs: true,
        progress: true,
      },
    });
  }

  // ==================== Budget Management ====================

  async createBudget(dto: CreateBudgetDto) {
    return await this.prisma.ledgerBudget.create({
      data: {
        ...dto,
        taxCode: dto.taxCode ?? '10',
      },
    });
  }

  async updateBudget(id: string, amount: number) {
    return await this.prisma.ledgerBudget.update({
      where: { id },
      data: { plannedAmt: amount },
    });
  }

  // ==================== Cost Management ====================

  async createCost(dto: CreateCostDto) {
    // Calculate tax amount
    const taxRate = dto.taxCode === '10' ? 0.1 : dto.taxCode === '8' ? 0.08 : 0;
    const taxAmount = dto.amount * taxRate;

    return await this.prisma.ledgerCost.create({
      data: {
        ...dto,
        taxCode: dto.taxCode ?? '10',
        taxAmount,
        source: dto.source ?? 'MANUAL',
      },
    });
  }

  async importCostsFromDW(ledgerId: string, dwData: any[]) {
    // Process DW data and create cost records
    const costs = [];
    for (const item of dwData) {
      const subLedger = await this.prisma.ledgerSub.findFirst({
        where: {
          ledgerId,
          tradeCode: item.tradeCode,
        },
      });

      if (subLedger) {
        costs.push({
          subId: subLedger.id,
          docType: item.docType,
          vendorName: item.vendorName,
          description: item.description,
          amount: item.amount,
          invoiceNo: item.invoiceNo,
          invoiceDate: new Date(item.invoiceDate),
          source: 'DW',
          sourceRef: item.dwId,
        });
      }
    }

    return await this.prisma.ledgerCost.createMany({
      data: costs,
    });
  }

  // ==================== Progress Management ====================

  async createProgress(dto: CreateProgressDto, userId: string) {
    const progress = await this.prisma.ledgerProgress.create({
      data: dto,
    });

    // Update DW if integrated
    await this.updateDWProgress(progress.id, dto.progressPct, dto.earnedValueAmt);

    return progress;
  }

  async approveProgress(id: string, userId: string) {
    return await this.prisma.ledgerProgress.update({
      where: { id },
      data: {
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }

  // ==================== Change Order Management ====================

  async createChangeOrder(dto: CreateChangeOrderDto, userId: string) {
    const changeOrder = await this.prisma.changeOrder.create({
      data: {
        ...dto,
        requestedBy: userId,
        requestedAt: new Date(),
        status: 'draft',
      },
    });

    // Notify DW system
    await this.notifyDWChangeOrder(changeOrder.id, dto);

    return changeOrder;
  }

  async approveChangeOrder(id: string, userId: string) {
    const changeOrder = await this.prisma.changeOrder.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        ledger: true,
      },
    });

    // Update contract amount
    await this.prisma.projectLedger.update({
      where: { id: changeOrder.ledgerId },
      data: {
        contractAmount: changeOrder.ledger.contractAmount + changeOrder.deltaAmt,
      },
    });

    // Update DW
    await this.updateDWChangeOrder(changeOrder.id, 'approved');

    return changeOrder;
  }

  // ==================== Billing Management ====================

  async createMilestone(dto: CreateMilestoneDto) {
    return await this.prisma.milestoneBilling.create({
      data: dto,
    });
  }

  async processBilling(milestoneId: string, invoiceNo: string) {
    const milestone = await this.prisma.milestoneBilling.findUnique({
      where: { id: milestoneId },
      include: { ledger: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Calculate billed amount considering retainage
    const retainage = await this.prisma.retainage.findUnique({
      where: { ledgerId: milestone.ledgerId },
    });

    const billedAmt = milestone.plannedAmt * (1 - (retainage?.pct ?? 0) / 100);
    const retainageAmt = milestone.plannedAmt * ((retainage?.pct ?? 0) / 100);

    // Update milestone
    const updated = await this.prisma.milestoneBilling.update({
      where: { id: milestoneId },
      data: {
        billedAmt,
        billedDate: new Date(),
        invoiceNo,
        status: 'billed',
      },
    });

    // Update retainage
    if (retainage) {
      await this.prisma.retainage.update({
        where: { id: retainage.id },
        data: {
          heldAmt: retainage.heldAmt + retainageAmt,
        },
      });
    }

    return updated;
  }

  async releaseRetainage(ledgerId: string, userId: string) {
    const retainage = await this.prisma.retainage.findUnique({
      where: { ledgerId },
    });

    if (!retainage) {
      throw new NotFoundException('Retainage not found');
    }

    return await this.prisma.retainage.update({
      where: { id: retainage.id },
      data: {
        releasedAmt: retainage.heldAmt,
        releasedAt: new Date(),
        releasedBy: userId,
      },
    });
  }

  // ==================== Metrics & Reporting ====================

  async getLedgerMetrics(ledgerId: string): Promise<LedgerMetrics> {
    const ledger = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: true,
            progress: true,
          },
        },
        changeOrders: {
          where: { status: 'approved' },
        },
        retainage: true,
        milestoneBilling: true,
      },
    });

    if (!ledger) {
      throw new NotFoundException('Ledger not found');
    }

    // Calculate totals
    const budgetTotal = ledger.subLedgers.reduce(
      (sum, sub) => sum + sub.budgets.reduce((s, b) => s + b.plannedAmt, 0),
      0,
    );

    const costTotal = ledger.subLedgers.reduce(
      (sum, sub) => sum + sub.costs.reduce((s, c) => s + c.amount + c.taxAmount, 0),
      0,
    );

    const changeOrderTotal = ledger.changeOrders.reduce((sum, co) => sum + co.deltaAmt, 0);

    const progressPct =
      ledger.subLedgers.reduce(
        (sum, sub) => {
          const latest = sub.progress.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          return sum + (latest?.progressPct ?? 0);
        },
        0,
      ) / (ledger.subLedgers.length || 1);

    const earnedValue =
      ledger.subLedgers.reduce(
        (sum, sub) => {
          const latest = sub.progress.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          return sum + (latest?.earnedValueAmt ?? 0);
        },
        0,
      );

    const billedAmount = ledger.milestoneBilling.reduce((sum, m) => sum + m.billedAmt, 0);

    const contractAmount = ledger.contractAmount + changeOrderTotal;
    const unbilledAmount = contractAmount - billedAmount;

    const profitMargin = contractAmount - costTotal;
    const profitMarginPct = (profitMargin / contractAmount) * 100;

    return {
      budgetTotal,
      costTotal,
      variance: budgetTotal - costTotal,
      variancePct: ((budgetTotal - costTotal) / budgetTotal) * 100,
      progressPct,
      earnedValue,
      changeOrderTotal,
      retainageHeld: ledger.retainage?.heldAmt ?? 0,
      billedAmount,
      unbilledAmount,
      profitMargin,
      profitMarginPct,
    };
  }

  async exportToAccounting(ledgerId: string, startDate: Date, endDate: Date, format: string) {
    const ledger = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: {
              where: {
                invoiceDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            progress: true,
          },
        },
        changeOrders: {
          where: {
            status: 'approved',
          },
        },
        milestoneBilling: true,
        retainage: true,
      },
    });

    if (!ledger) {
      throw new NotFoundException('Ledger not found');
    }

    // Convert to standardized format
    const projectData: ProjectLedgerData = {
      projectId: ledger.projectId,
      contractAmount: Number(ledger.contractAmount),
      billedAmount: ledger.milestoneBilling.reduce((sum, m) => sum + Number(m.billedAmt), 0),
      paidAmount: 0, // Would need payment tracking
      costs: ledger.subLedgers.flatMap(sub => 
        sub.costs.map(cost => ({
          date: cost.invoiceDate || cost.createdAt,
          docType: cost.docType as 'MATERIAL' | 'OUTSOURCE' | 'LABOR',
          vendorName: cost.vendorName,
          description: cost.description,
          amount: Number(cost.amount),
          taxRate: cost.taxCode === '10' ? 0.1 : cost.taxCode === '8' ? 0.08 : 0,
          invoiceNo: cost.invoiceNo,
          costCode: sub.tradeCode,
          department: 'construction',
        }))
      ),
      progress: ledger.subLedgers.flatMap(sub =>
        sub.progress.map(p => ({
          date: p.date,
          progressPct: Number(p.progressPct),
          earnedValueAmt: Number(p.earnedValueAmt),
          billedAmt: 0, // Would need billing tracking
          description: p.notes || '',
        }))
      ),
      changeOrders: ledger.changeOrders.map(co => ({
        date: co.createdAt,
        code: co.code,
        description: co.description,
        deltaAmt: Number(co.deltaAmt),
        reason: co.reason,
        status: co.status,
      })),
      retainage: {
        totalRetainage: Number(ledger.retainage?.heldAmt || 0),
        releasedRetainage: Number(ledger.retainage?.releasedAmt || 0),
        pendingRetainage: Number(ledger.retainage?.heldAmt || 0) - Number(ledger.retainage?.releasedAmt || 0),
        releaseRule: (ledger.retainage?.rule as 'ON_FINAL' | 'ON_INSPECTION') || 'ON_FINAL',
      },
    };

    // Get company accounting mapping
    const mapping = await this.accountingAdapter.getCompanyMapping(ledger.companyId);

    // Convert project data to ledger entries
    const ledgerEntries = this.convertToLedgerEntries(projectData);

    // Generate CSV using the accounting adapter
    return this.accountingAdapter.generateCSV(ledgerEntries, mapping, format);
  }

  private convertToLedgerEntries(projectData: ProjectLedgerData): any[] {
    const entries = [];

    // Convert costs to ledger entries
    projectData.costs.forEach(cost => {
      entries.push({
        date: cost.date,
        accountType: this.mapDocTypeToAccount(cost.docType),
        amount: cost.amount,
        taxRate: cost.taxRate,
        taxAmount: cost.amount * cost.taxRate,
        description: cost.description,
        isDebit: true,
        subAccount: cost.vendorName,
        department: cost.department,
        projectCode: projectData.projectId,
        reference: cost.invoiceNo,
        voucherNo: `COST-${projectData.projectId}-${cost.invoiceNo}`,
      });
    });

    // Convert progress billing to entries
    projectData.progress.forEach((progress, index) => {
      if (progress.billedAmt > 0) {
        entries.push({
          date: progress.date,
          accountType: 'sales',
          amount: progress.billedAmt,
          taxRate: 0.1,
          taxAmount: progress.billedAmt * 0.1,
          description: `出来高請求 ${progress.progressPct}%`,
          isDebit: false,
          department: 'construction',
          projectCode: projectData.projectId,
          voucherNo: `BILL-${projectData.projectId}-${index + 1}`,
        });
      }
    });

    // Convert change orders to entries
    projectData.changeOrders.forEach(co => {
      if (co.status === 'approved') {
        entries.push({
          date: co.date,
          accountType: co.deltaAmt > 0 ? 'sales' : 'sales_return',
          amount: Math.abs(co.deltaAmt),
          taxRate: 0.1,
          taxAmount: Math.abs(co.deltaAmt) * 0.1,
          description: `変更工事 ${co.code}: ${co.description}`,
          isDebit: co.deltaAmt < 0,
          department: 'construction',
          projectCode: projectData.projectId,
          reference: co.reason,
          voucherNo: `CO-${co.code}`,
        });
      }
    });

    return entries;
  }

  private mapDocTypeToAccount(docType: string): string {
    switch (docType) {
      case 'MATERIAL':
        return 'material_cost';
      case 'OUTSOURCE':
        return 'outsource_cost';
      case 'LABOR':
        return 'labor_cost';
      default:
        return 'overhead';
    }
  }

  // ==================== v1.0 新機能: DW統合とBulk操作 ====================

  /**
   * 工事台帳全体をDWと同期
   */
  async syncLedgerWithDW(ledgerId: string) {
    const ledger = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: true,
            progress: true,
          },
        },
        changeOrders: true,
      },
    });

    if (!ledger) {
      throw new NotFoundException('Ledger not found');
    }

    const dwRequest: DWLedgerSyncRequest = {
      ledgerId: ledger.id,
      projectId: ledger.projectId,
      contractAmount: Number(ledger.contractAmount),
      billingMode: ledger.billingMode as 'MILESTONE' | 'PERCENT_COMPLETE',
      subLedgers: ledger.subLedgers.map(sub => ({
        tradeCode: sub.tradeCode,
        name: sub.name,
        budgets: sub.budgets.map(b => ({
          costCode: b.costCode,
          costName: b.costName,
          plannedQty: b.plannedQty ? Number(b.plannedQty) : undefined,
          unit: b.unit || undefined,
          plannedAmt: Number(b.plannedAmt),
          taxCode: b.taxCode,
        })),
        costs: sub.costs.map(c => ({
          docType: c.docType as 'MATERIAL' | 'OUTSOURCE' | 'LABOR',
          vendorName: c.vendorName,
          description: c.description,
          quantity: c.quantity ? Number(c.quantity) : undefined,
          unit: c.unit || undefined,
          unitPrice: c.unitPrice ? Number(c.unitPrice) : undefined,
          amount: Number(c.amount),
          taxCode: c.taxCode,
          invoiceNo: c.invoiceNo || undefined,
          invoiceDate: c.invoiceDate?.toISOString() || undefined,
        })),
      })),
    };

    try {
      await this.dwClient.syncLedger(dwRequest);
      
      // Update sync status
      await this.prisma.projectLedger.update({
        where: { id: ledgerId },
        data: {
          dwSyncStatus: 'synced',
          dwSyncAt: new Date(),
        },
      });

      return { success: true, message: 'Ledger synced with DW successfully' };
    } catch (error) {
      await this.prisma.projectLedger.update({
        where: { id: ledgerId },
        data: {
          dwSyncStatus: 'failed',
        },
      });
      throw error;
    }
  }

  /**
   * 複数プロジェクトの月次会計エクスポート
   */
  async bulkExportToAccounting(
    companyId: string,
    year: number,
    month: number,
    format: string
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const ledgers = await this.prisma.projectLedger.findMany({
      where: {
        companyId,
        createdAt: {
          lte: endDate,
        },
      },
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: {
              where: {
                invoiceDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
            progress: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            },
          },
        },
        changeOrders: {
          where: {
            status: 'approved',
            approvedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        milestoneBilling: {
          where: {
            billedDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        retainage: true,
      },
    });

    const allEntries = [];

    for (const ledger of ledgers) {
      const projectData: ProjectLedgerData = {
        projectId: ledger.projectId,
        contractAmount: Number(ledger.contractAmount),
        billedAmount: ledger.milestoneBilling.reduce((sum, m) => sum + Number(m.billedAmt), 0),
        paidAmount: 0,
        costs: ledger.subLedgers.flatMap(sub => 
          sub.costs.map(cost => ({
            date: cost.invoiceDate || cost.createdAt,
            docType: cost.docType as 'MATERIAL' | 'OUTSOURCE' | 'LABOR',
            vendorName: cost.vendorName,
            description: cost.description,
            amount: Number(cost.amount),
            taxRate: cost.taxCode === '10' ? 0.1 : cost.taxCode === '8' ? 0.08 : 0,
            invoiceNo: cost.invoiceNo,
            costCode: sub.tradeCode,
            department: 'construction',
          }))
        ),
        progress: ledger.subLedgers.flatMap(sub =>
          sub.progress.map(p => ({
            date: p.date,
            progressPct: Number(p.progressPct),
            earnedValueAmt: Number(p.earnedValueAmt),
            billedAmt: 0,
            description: p.notes || '',
          }))
        ),
        changeOrders: ledger.changeOrders.map(co => ({
          date: co.createdAt,
          code: co.code,
          description: co.description,
          deltaAmt: Number(co.deltaAmt),
          reason: co.reason,
          status: co.status,
        })),
        retainage: {
          totalRetainage: Number(ledger.retainage?.heldAmt || 0),
          releasedRetainage: Number(ledger.retainage?.releasedAmt || 0),
          pendingRetainage: Number(ledger.retainage?.heldAmt || 0) - Number(ledger.retainage?.releasedAmt || 0),
          releaseRule: (ledger.retainage?.rule as 'ON_FINAL' | 'ON_INSPECTION') || 'ON_FINAL',
        },
      };

      const entries = this.convertToLedgerEntries(projectData);
      allEntries.push(...entries);
    }

    // Get company accounting mapping
    const mapping = await this.accountingAdapter.getCompanyMapping(companyId);

    // Generate consolidated CSV
    return this.accountingAdapter.generateCSV(allEntries, mapping, format);
  }

  /**
   * プロジェクト台帳のダッシュボード用サマリー
   */
  async getProjectSummary(companyId: string, storeId?: string) {
    const where: any = { companyId };
    if (storeId) where.storeId = storeId;

    const ledgers = await this.prisma.projectLedger.findMany({
      where,
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: true,
            progress: true,
          },
        },
        changeOrders: {
          where: { status: 'approved' },
        },
        milestoneBilling: true,
        retainage: true,
      },
    });

    const summary = {
      totalProjects: ledgers.length,
      activeProjects: ledgers.filter(l => l.status === 'active').length,
      completedProjects: ledgers.filter(l => l.status === 'completed').length,
      totalContractValue: ledgers.reduce((sum, l) => sum + Number(l.contractAmount), 0),
      totalBilledAmount: ledgers.reduce((sum, l) => 
        sum + l.milestoneBilling.reduce((ms, m) => ms + Number(m.billedAmt), 0), 0),
      totalCostAmount: ledgers.reduce((sum, l) => 
        sum + l.subLedgers.reduce((ss, s) => 
          ss + s.costs.reduce((cs, c) => cs + Number(c.amount), 0), 0), 0),
      totalChangeOrders: ledgers.reduce((sum, l) => 
        sum + l.changeOrders.reduce((co, c) => co + Number(c.deltaAmt), 0), 0),
      totalRetainageHeld: ledgers.reduce((sum, l) => sum + Number(l.retainage?.heldAmt || 0), 0),
      averageProgressPct: ledgers.reduce((sum, l) => {
        const projectProgress = l.subLedgers.reduce((ss, s) => {
          const latestProgress = s.progress.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
          return ss + Number(latestProgress?.progressPct || 0);
        }, 0) / (l.subLedgers.length || 1);
        return sum + projectProgress;
      }, 0) / (ledgers.length || 1),
    };

    // Calculate profit margins
    const grossProfit = summary.totalBilledAmount - summary.totalCostAmount;
    const profitMarginPct = (grossProfit / summary.totalBilledAmount) * 100;

    return {
      ...summary,
      grossProfit,
      profitMarginPct: isNaN(profitMarginPct) ? 0 : profitMarginPct,
    };
  }

  // ==================== 業界標準プラン別機能 ====================

  /**
   * プラン別機能初期化（1分ウィザード）
   */
  async initializeCompanyPlan(
    companyId: string,
    plan: 'LITE' | 'STANDARD' | 'PRO',
    preferences: {
      billingMode: 'MILESTONE' | 'PERCENT_COMPLETE';
      retainagePct: number;
      hasAdvancePayment: boolean;
    }
  ) {
    // プラン設定作成
    await this.prisma.companyPlan.upsert({
      where: { companyId },
      create: {
        companyId,
        plan,
        features: JSON.stringify({
          retention: plan !== 'LITE',
          changeOrders: plan !== 'LITE',
          approvalFlow: plan === 'PRO',
          detailedExport: plan === 'PRO',
          budgetRevision: plan === 'PRO',
          contractHistory: plan !== 'LITE',
        }),
      },
      update: {
        plan,
        features: JSON.stringify({
          retention: plan !== 'LITE',
          changeOrders: plan !== 'LITE', 
          approvalFlow: plan === 'PRO',
          detailedExport: plan === 'PRO',
          budgetRevision: plan === 'PRO',
          contractHistory: plan !== 'LITE',
        }),
      },
    });

    // 初期プリセット作成
    await this.createInitialPresets(companyId, preferences);

    return {
      plan,
      features: await this.getCompanyFeatures(companyId),
      message: 'プラン設定が完了しました',
    };
  }

  /**
   * 会社のプラン・機能設定取得
   */
  async getCompanyFeatures(companyId: string) {
    const companyPlan = await this.prisma.companyPlan.findUnique({
      where: { companyId },
    });

    if (!companyPlan) {
      // デフォルトLITE
      return {
        plan: 'LITE',
        features: {
          retention: false,
          changeOrders: false,
          approvalFlow: false,
          detailedExport: false,
          budgetRevision: false,
          contractHistory: false,
        },
      };
    }

    return {
      plan: companyPlan.plan,
      features: JSON.parse(companyPlan.features),
    };
  }

  /**
   * 契約履歴管理（Standard/Pro）
   */
  async createContractHistory(
    ledgerId: string,
    contractAmt: number,
    reason: string,
    durationDays?: number,
    approvedBy?: string
  ) {
    const ledger = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: { company: { include: { companyPlan: true } } },
    });

    if (!ledger?.company.companyPlan?.features) {
      throw new BadRequestException('プラン設定が見つかりません');
    }

    const features = JSON.parse(ledger.company.companyPlan.features);
    if (!features.contractHistory) {
      throw new BadRequestException('このプランでは契約履歴機能は利用できません');
    }

    // 最新バージョン取得
    const latestHistory = await this.prisma.contractHistory.findFirst({
      where: { ledgerId },
      orderBy: { version: 'desc' },
    });

    const newVersion = (latestHistory?.version || 0) + 1;

    // 契約履歴作成
    const history = await this.prisma.contractHistory.create({
      data: {
        ledgerId,
        version: newVersion,
        contractAmt,
        durationDays,
        reason,
        approvedBy,
        ...(approvedBy && { approvedAt: new Date() }),
      },
    });

    // プロジェクト台帳の契約金額更新
    await this.prisma.projectLedger.update({
      where: { id: ledgerId },
      data: { contractAmount: contractAmt },
    });

    return history;
  }

  /**
   * 実行予算リビジョン管理（Pro）
   */
  async createBudgetRevision(ledgerId: string, note: string, createdBy: string) {
    const ledger = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: { company: { include: { companyPlan: true } } },
    });

    if (!ledger?.company.companyPlan?.features) {
      throw new BadRequestException('プラン設定が見つかりません');
    }

    const features = JSON.parse(ledger.company.companyPlan.features);
    if (!features.budgetRevision) {
      throw new BadRequestException('このプランでは予算リビジョン機能は利用できません');
    }

    // 最新リビジョン番号取得
    const latestRevision = await this.prisma.budgetRevision.findFirst({
      where: { ledgerId },
      orderBy: { revisionNo: 'desc' },
    });

    const newRevisionNo = (latestRevision?.revisionNo || 0) + 1;

    return await this.prisma.budgetRevision.create({
      data: {
        ledgerId,
        revisionNo: newRevisionNo,
        note,
        createdBy,
      },
    });
  }

  /**
   * 出来高承認ログ（Pro承認フロー）
   */
  async createProgressApprovalLog(
    progressId: string,
    approvedBy: string,
    level: number,
    comment?: string
  ) {
    return await this.prisma.progressApprovalLog.create({
      data: {
        progressId,
        approvedBy,
        level,
        comment,
      },
    });
  }

  /**
   * 請求書作成（ヘッダー・明細）
   */
  async createInvoice(
    ledgerId: string,
    billType: 'MILESTONE' | 'PERCENT' | 'RETAINAGE_RELEASE',
    invoiceNo: string,
    lines: Array<{
      subId?: string;
      description?: string;
      qty?: number;
      unitPrice?: number;
      amount: number;
      taxCode?: string;
    }>,
    billPeriod?: string
  ) {
    const totalAmt = lines.reduce((sum, line) => sum + line.amount, 0);
    const taxAmt = lines.reduce((sum, line) => {
      const taxRate = line.taxCode === '10' ? 0.1 : line.taxCode === '8' ? 0.08 : 0;
      return sum + line.amount * taxRate;
    }, 0);

    // 請求書ヘッダー作成
    const invoice = await this.prisma.invoice.create({
      data: {
        ledgerId,
        invoiceNo,
        billType,
        billPeriod,
        totalAmt,
        taxAmt,
        status: 'DRAFT',
        dueDate: this.calculateDueDate(new Date()),
      },
    });

    // 請求明細作成
    const invoiceLines = await Promise.all(
      lines.map(line =>
        this.prisma.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            ...line,
          },
        })
      )
    );

    return { invoice, invoiceLines };
  }

  /**
   * 入金記録
   */
  async recordPayment(
    invoiceId: string,
    paidAmt: number,
    paidAt: Date,
    method?: string,
    note?: string
  ) {
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        paidAmt,
        paidAt,
        method,
        note,
      },
    });

    // 請求書ステータス更新
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.paidAmt), 0);
      let newStatus = 'ISSUED';

      if (totalPaid >= Number(invoice.totalAmt)) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });
    }

    return payment;
  }

  /**
   * 保留金解放記録
   */
  async releaseRetention(
    ledgerId: string,
    releaseAmt: number,
    reason?: string
  ) {
    return await this.prisma.retentionRelease.create({
      data: {
        ledgerId,
        releaseAmt,
        reason,
        releasedAt: new Date(),
      },
    });
  }

  /**
   * プラン別台帳画面データ取得
   */
  async getLedgerDataByPlan(ledgerId: string, companyId: string) {
    const features = await this.getCompanyFeatures(companyId);
    
    const baseData = await this.prisma.projectLedger.findUnique({
      where: { id: ledgerId },
      include: {
        subLedgers: {
          include: {
            budgets: true,
            costs: true,
            progress: features.features.approvalFlow 
              ? { include: { approvalLogs: true } }
              : true,
          },
        },
        milestoneBilling: true,
        ...(features.features.changeOrders && { changeOrders: true }),
        ...(features.features.retention && { retainage: true }),
        ...(features.features.contractHistory && { contractHistory: true }),
        ...(features.features.budgetRevision && { budgetRevisions: true }),
        invoices: {
          include: {
            invoiceLines: true,
            payments: true,
          },
        },
        retentionReleases: true,
      },
    });

    return {
      ...baseData,
      planFeatures: features,
      uiMode: features.plan, // LITE | STANDARD | PRO
    };
  }

  // ==================== Helper Methods ====================

  private async createInitialPresets(
    companyId: string,
    preferences: {
      billingMode: 'MILESTONE' | 'PERCENT_COMPLETE';
      retainagePct: number;
      hasAdvancePayment: boolean;
    }
  ) {
    // 原価コードプリセット
    const defaultCostCodes = [
      { code: '01', name: '材料費', category: 'MATERIAL' },
      { code: '02', name: '労務費', category: 'LABOR' },
      { code: '03', name: '外注費', category: 'OUTSOURCE' },
      { code: '04', name: '経費', category: 'OVERHEAD' },
    ];

    // 勘定科目マッピングプリセット
    const defaultAccountMapping = {
      material_cost: '5110',
      labor_cost: '5120', 
      outsource_cost: '5130',
      overhead: '5140',
      sales: '4110',
      accounts_receivable: '1130',
      accounts_payable: '2110',
      retention: '1140',
    };

    // TODO: 実際の設定保存処理
    console.log('初期プリセット設定:', {
      companyId,
      costCodes: defaultCostCodes,
      accountMapping: defaultAccountMapping,
      preferences,
    });
  }

  private calculateDueDate(issueDate: Date): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30日後
    return dueDate;
  }

  private async createDefaultMilestones(ledgerId: string, contractAmount: number) {
    const milestones = [
      { type: 'START', name: '着工時', sequence: 1, plannedAmt: contractAmount * 0.3 },
      { type: 'MID', name: '中間時', sequence: 2, plannedAmt: contractAmount * 0.4 },
      { type: 'FINAL', name: '完工時', sequence: 3, plannedAmt: contractAmount * 0.3 },
    ];

    for (const milestone of milestones) {
      await this.prisma.milestoneBilling.create({
        data: {
          ledgerId,
          ...milestone,
          plannedDate: new Date(), // Should be calculated based on project schedule
        },
      });
    }
  }

  private async updateDWProgress(progressId: string, progressPct: number, earnedValue: number) {
    try {
      const progress = await this.prisma.ledgerProgress.findUnique({
        where: { id: progressId },
        include: {
          sub: {
            include: {
              ledger: true,
            },
          },
        },
      });

      if (!progress) return;

      const dwRequest: DWApproveProgressRequest = {
        siteId: progress.sub.ledger.projectId,
        projectId: progress.sub.ledger.projectId,
        progressPct: progressPct,
        earnedValueAmt: earnedValue,
        approvedBy: progress.approvedBy || 'system',
        approvalDate: new Date().toISOString(),
        notes: progress.notes || undefined,
      };

      await this.dwClient.approveProgress(dwRequest);
      
      // Update sync status
      await this.prisma.ledgerProgress.update({
        where: { id: progressId },
        data: {
          dwSyncStatus: 'synced',
          dwSyncAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update DW progress:', error);
      await this.prisma.ledgerProgress.update({
        where: { id: progressId },
        data: {
          dwSyncStatus: 'failed',
        },
      });
    }
  }

  private async notifyDWChangeOrder(changeOrderId: string, dto: CreateChangeOrderDto) {
    try {
      const dwRequest: DWCreateChangeOrderRequest = {
        projectId: dto.ledgerId, // Will be mapped to actual project ID
        code: dto.code,
        description: dto.description,
        deltaAmt: dto.deltaAmt,
        reason: dto.reason,
        requestedBy: dto.requestedBy || 'system',
        requestedAt: new Date().toISOString(),
      };

      await this.dwClient.createChangeOrder(dwRequest);
      
      // Update sync status
      await this.prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          dwSyncStatus: 'synced',
          dwSyncAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to notify DW of change order:', error);
      await this.prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          dwSyncStatus: 'failed',
        },
      });
    }
  }

  private async updateDWChangeOrder(changeOrderId: string, status: string) {
    try {
      // Update DW about change order status change
      const changeOrder = await this.prisma.changeOrder.findUnique({
        where: { id: changeOrderId },
        include: { ledger: true },
      });

      if (!changeOrder) return;

      // Create a simplified request to update status
      const dwRequest: DWCreateChangeOrderRequest = {
        projectId: changeOrder.ledger.projectId,
        code: changeOrder.code,
        description: `Status updated to: ${status}`,
        deltaAmt: 0, // Status update only
        reason: `Change order ${status}`,
        requestedBy: changeOrder.approvedBy || 'system',
        requestedAt: new Date().toISOString(),
      };

      await this.dwClient.createChangeOrder(dwRequest);
      
      // Update sync status
      await this.prisma.changeOrder.update({
        where: { id: changeOrderId },
        data: {
          dwSyncStatus: 'synced',
          dwSyncAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update DW change order status:', error);
    }
  }

  private formatForYayoi(costs: any[]) {
    // Yayoi specific CSV format
    return costs.map((cost) => ({
      日付: cost.invoiceDate,
      借方科目: this.mapToYayoiAccount(cost.docType),
      借方金額: cost.amount + cost.taxAmount,
      貸方科目: '買掛金',
      貸方金額: cost.amount + cost.taxAmount,
      摘要: cost.description,
      税区分: cost.taxCode === '10' ? '課税10%' : cost.taxCode === '8' ? '軽減8%' : '非課税',
    }));
  }

  private formatForFreee(costs: any[]) {
    // Freee specific format
    return costs.map((cost) => ({
      issue_date: cost.invoiceDate,
      type: 'expense',
      company_id: cost.sub.ledger.companyId,
      description: cost.description,
      amount: cost.amount + cost.taxAmount,
      tax_code: cost.taxCode,
      account_item_id: this.mapToFreeeAccount(cost.docType),
    }));
  }

  private formatForPCA(costs: any[]) {
    // PCA specific format
    return costs.map((cost) => ({
      伝票日付: cost.invoiceDate,
      借方科目コード: this.mapToPCAAccount(cost.docType),
      借方金額: cost.amount,
      借方税額: cost.taxAmount,
      貸方科目コード: '2100', // 買掛金
      貸方金額: cost.amount + cost.taxAmount,
      摘要: cost.description,
    }));
  }

  private formatGenericCSV(costs: any[]) {
    return costs.map((cost) => ({
      date: cost.invoiceDate,
      type: cost.docType,
      vendor: cost.vendorName,
      description: cost.description,
      amount: cost.amount,
      tax: cost.taxAmount,
      total: cost.amount + cost.taxAmount,
      project: cost.sub.ledger.projectId,
    }));
  }

  private mapToYayoiAccount(docType: string): string {
    switch (docType) {
      case 'MATERIAL':
        return '材料費';
      case 'OUTSOURCE':
        return '外注費';
      case 'LABOR':
        return '労務費';
      default:
        return '雑費';
    }
  }

  private mapToFreeeAccount(docType: string): number {
    // Freee account item IDs
    switch (docType) {
      case 'MATERIAL':
        return 5100;
      case 'OUTSOURCE':
        return 5200;
      case 'LABOR':
        return 5300;
      default:
        return 5900;
    }
  }

  private mapToPCAAccount(docType: string): string {
    switch (docType) {
      case 'MATERIAL':
        return '5100';
      case 'OUTSOURCE':
        return '5200';
      case 'LABOR':
        return '5300';
      default:
        return '5900';
    }
  }
}