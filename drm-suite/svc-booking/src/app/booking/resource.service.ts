import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma } from '@prisma/client';

export interface CreateResourceDto {
  type: 'MEETING_ROOM' | 'CONSULTATION_ROOM' | 'VEHICLE';
  subType?: string;
  name: string;
  capacity?: number;
  location?: string;
  equipment?: string[];
  plateNumber?: string;
}

export interface UpdateResourceDto extends Partial<CreateResourceDto> {
  maintenanceStatus?: 'available' | 'in_use' | 'maintenance' | 'cleaning';
  isActive?: boolean;
}

export interface CheckAvailabilityDto {
  resourceId?: string;
  type?: string;
  startTime: Date;
  endTime: Date;
  capacity?: number;
}

export interface CreateBookingDto {
  resourceId: string;
  userId: string;
  customerId?: string;
  title: string;
  purpose?: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  priority?: number;
}

export interface ConflictResolutionDto {
  bookingId: string;
  resolution: 'cancel_existing' | 'reschedule' | 'find_alternative';
  alternativeResourceId?: string;
  newStartTime?: Date;
  newEndTime?: Date;
}

@Injectable()
export class ResourceService {
  constructor(private readonly prisma: PrismaService) {}

  // Resource Management
  async createResource(data: CreateResourceDto, companyId: string) {
    return await this.prisma.resource.create({
      data: {
        ...data,
        equipment: data.equipment || [],
        metadata: JSON.stringify({ companyId }),
      },
    });
  }

  async updateResource(id: string, data: UpdateResourceDto) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return await this.prisma.resource.update({
      where: { id },
      data: {
        ...data,
        equipment: data.equipment || resource.equipment,
      },
    });
  }

  async getResources(type?: string, isActive = true) {
    return await this.prisma.resource.findMany({
      where: {
        ...(type && { type }),
        isActive,
      },
      include: {
        bookings: {
          where: {
            startTime: {
              gte: new Date(),
            },
            status: 'confirmed',
          },
          orderBy: {
            startTime: 'asc',
          },
          take: 5,
        },
      },
    });
  }

  // Availability Check
  async checkAvailability(dto: CheckAvailabilityDto) {
    const { resourceId, type, startTime, endTime, capacity } = dto;

    // Build query conditions
    const whereConditions: Prisma.ResourceWhereInput = {
      isActive: true,
      maintenanceStatus: 'available',
      ...(resourceId && { id: resourceId }),
      ...(type && { type }),
      ...(capacity && { capacity: { gte: capacity } }),
    };

    // Find available resources
    const resources = await this.prisma.resource.findMany({
      where: whereConditions,
      include: {
        bookings: {
          where: {
            status: { in: ['confirmed'] },
            OR: [
              {
                // Booking starts during requested time
                startTime: {
                  gte: startTime,
                  lt: endTime,
                },
              },
              {
                // Booking ends during requested time
                endTime: {
                  gt: startTime,
                  lte: endTime,
                },
              },
              {
                // Booking encompasses requested time
                startTime: {
                  lte: startTime,
                },
                endTime: {
                  gte: endTime,
                },
              },
            ],
          },
        },
      },
    });

    // Filter out resources with conflicting bookings
    const availableResources = resources.filter((resource) => resource.bookings.length === 0);

    return {
      available: availableResources,
      unavailable: resources.filter((resource) => resource.bookings.length > 0),
    };
  }

  // Booking Management with Conflict Detection
  async createBooking(dto: CreateBookingDto, companyId: string, storeId?: string) {
    const { resourceId, startTime, endTime } = dto;

    // Check for conflicts (先勝ちルール)
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        resourceId,
        status: 'confirmed',
        OR: [
          {
            startTime: {
              gte: startTime,
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
              lte: endTime,
            },
          },
          {
            startTime: {
              lte: startTime,
            },
            endTime: {
              gte: endTime,
            },
          },
        ],
      },
    });

    if (existingBookings.length > 0) {
      // Find alternative resources
      const alternatives = await this.checkAvailability({
        type: (await this.prisma.resource.findUnique({ where: { id: resourceId } }))?.type,
        startTime,
        endTime,
      });

      throw new ConflictException({
        message: 'Resource is already booked for this time',
        existingBookings,
        alternatives: alternatives.available,
      });
    }

    // Create booking with confirmed status (先勝ち)
    const booking = await this.prisma.booking.create({
      data: {
        ...dto,
        companyId,
        storeId,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: JSON.stringify({
          createdBy: dto.userId,
          createdAt: new Date(),
        }),
      },
      include: {
        resource: true,
        user: true,
        customer: true,
      },
    });

    // Update resource status if it's a vehicle
    if (booking.resource.type === 'VEHICLE') {
      const now = new Date();
      if (startTime <= now && endTime >= now) {
        await this.prisma.resource.update({
          where: { id: resourceId },
          data: { maintenanceStatus: 'in_use' },
        });
      }
    }

    return booking;
  }

  // Handle Double Booking Conflicts
  async resolveConflict(dto: ConflictResolutionDto) {
    const { bookingId, resolution } = dto;

    switch (resolution) {
      case 'cancel_existing':
        return await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'cancelled',
            conflictResolution: 'cancelled_for_priority',
          },
        });

      case 'reschedule':
        if (!dto.newStartTime || !dto.newEndTime) {
          throw new Error('New time slots required for rescheduling');
        }
        return await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            startTime: dto.newStartTime,
            endTime: dto.newEndTime,
            conflictResolution: 'rescheduled',
          },
        });

      case 'find_alternative':
        if (!dto.alternativeResourceId) {
          throw new Error('Alternative resource required');
        }
        return await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            resourceId: dto.alternativeResourceId,
            conflictResolution: 'moved_to_alternative',
          },
        });

      default:
        throw new Error('Invalid resolution type');
    }
  }

  // Cancel Booking
  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { resource: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Update booking status
    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        metadata: JSON.stringify({
          ...JSON.parse(booking.metadata),
          cancelledBy: userId,
          cancelledAt: new Date(),
        }),
      },
    });

    // Update resource status if needed
    if (booking.resource.type === 'VEHICLE' && booking.resource.maintenanceStatus === 'in_use') {
      const activeBookings = await this.prisma.booking.count({
        where: {
          resourceId: booking.resourceId,
          status: 'confirmed',
          startTime: { lte: new Date() },
          endTime: { gte: new Date() },
        },
      });

      if (activeBookings === 0) {
        await this.prisma.resource.update({
          where: { id: booking.resourceId },
          data: { maintenanceStatus: 'available' },
        });
      }
    }

    return cancelled;
  }

  // Get upcoming bookings for a resource
  async getResourceSchedule(resourceId: string, days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.prisma.booking.findMany({
      where: {
        resourceId,
        status: 'confirmed',
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: true,
        customer: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  // Auto-release overdue bookings
  async releaseOverdueBookings() {
    const now = new Date();
    const overdueBookings = await this.prisma.booking.updateMany({
      where: {
        status: 'confirmed',
        endTime: {
          lt: now,
        },
      },
      data: {
        status: 'completed',
      },
    });

    // Update vehicle statuses
    const vehicleResources = await this.prisma.resource.findMany({
      where: {
        type: 'VEHICLE',
        maintenanceStatus: 'in_use',
      },
    });

    for (const vehicle of vehicleResources) {
      const activeBookings = await this.prisma.booking.count({
        where: {
          resourceId: vehicle.id,
          status: 'confirmed',
          startTime: { lte: now },
          endTime: { gte: now },
        },
      });

      if (activeBookings === 0) {
        await this.prisma.resource.update({
          where: { id: vehicle.id },
          data: { maintenanceStatus: 'available' },
        });
      }
    }

    return overdueBookings;
  }

  // Calendar Integration Helper
  async getCalendarEvents(userId: string, startDate: Date, endDate: Date) {
    return await this.prisma.booking.findMany({
      where: {
        userId,
        status: { in: ['confirmed'] },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        resource: true,
        customer: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }
}