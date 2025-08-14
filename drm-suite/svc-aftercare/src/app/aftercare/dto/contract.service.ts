import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@drm-suite/prisma';
import { EventBusService } from '@drm-suite/event-bus';
import { CreateContractDto, UpdateContractDto, ContractFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async create(dto: CreateContractDto) {
    const contract = await this.prisma.maintenanceContract.create({
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        contractType: dto.contractType,
        amount: dto.amount,
        status: dto.status || 'draft',
        description: dto.description,
        coverageDetails: dto.coverageDetails as Prisma.JsonObject,
        terms: dto.terms as Prisma.JsonObject,
      },
      include: {
        customer: true,
        project: true,
      },
    });

    await this.eventBus.emit('contract.created', contract);
    return contract;
  }

  async findAll(filter: ContractFilterDto) {
    const where: Prisma.MaintenanceContractWhereInput = {};

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.contractType) {
      where.contractType = filter.contractType;
    }

    if (filter.startDate || filter.endDate) {
      where.endDate = {};
      if (filter.startDate) {
        where.endDate.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.endDate.lte = new Date(filter.endDate);
      }
    }

    const [contracts, total] = await Promise.all([
      this.prisma.maintenanceContract.findMany({
        where,
        include: {
          customer: true,
          project: true,
          inspections: {
            where: { status: 'pending' },
            orderBy: { scheduledDate: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filter.skip || 0,
        take: filter.take || 20,
      }),
      this.prisma.maintenanceContract.count({ where }),
    ]);

    return {
      data: contracts,
      total,
      hasMore: total > (filter.skip || 0) + contracts.length,
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.maintenanceContract.findUnique({
      where: { id },
      include: {
        customer: true,
        project: true,
        inspections: {
          orderBy: { scheduledDate: 'desc' },
        },
        claims: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async update(id: string, dto: UpdateContractDto) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.maintenanceContract.update({
      where: { id },
      data: {
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.contractType && { contractType: dto.contractType }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description && { description: dto.description }),
        ...(dto.coverageDetails && {
          coverageDetails: dto.coverageDetails as Prisma.JsonObject,
        }),
        ...(dto.terms && { terms: dto.terms as Prisma.JsonObject }),
      },
      include: {
        customer: true,
        project: true,
      },
    });

    await this.eventBus.emit('contract.updated', {
      old: existing,
      new: updated,
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.maintenanceContract.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    await this.eventBus.emit('contract.cancelled', { id });
  }

  async getExpiringContracts(days = 30) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.maintenanceContract.findMany({
      where: {
        status: 'active',
        endDate: {
          gte: new Date(),
          lte: endDate,
        },
      },
      include: {
        customer: true,
        project: true,
      },
      orderBy: { endDate: 'asc' },
    });
  }

  async renewContract(id: string, months = 12) {
    const existing = await this.findOne(id);

    const newContract = await this.prisma.maintenanceContract.create({
      data: {
        customerId: existing.customerId,
        projectId: existing.projectId,
        startDate: existing.endDate,
        endDate: new Date(
          existing.endDate.getTime() + months * 30 * 24 * 60 * 60 * 1000,
        ),
        contractType: existing.contractType,
        amount: existing.amount,
        status: 'draft',
        description: `Renewal of contract ${existing.id}`,
        coverageDetails: existing.coverageDetails,
        terms: existing.terms,
      },
      include: {
        customer: true,
        project: true,
      },
    });

    await this.eventBus.emit('contract.renewed', {
      original: existing,
      renewal: newContract,
    });

    return newContract;
  }
}