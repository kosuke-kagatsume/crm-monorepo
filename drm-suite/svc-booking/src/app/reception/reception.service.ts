import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { DWClient } from '@drm-suite/dw-adapter';
import { DWVisitorNotification } from '@drm-suite/dw-adapter';

export interface CreateReceptionCardDto {
  companyId: string;
  storeId?: string;
  customerId?: string;
  visitorName: string;
  visitorPhone?: string;
  purpose: string; // '相談', '契約', '支払い', 'クレーム'
  priority?: number;
  notes?: string;
  assignedTo?: string;
  roomId?: string;
}

export interface CreateNotificationDto {
  recipientId: string;
  type: 'email' | 'sms' | 'slack' | 'chatwork' | 'system';
  channel: string;
  title: string;
  message: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matches: Array<{
    type: 'name' | 'phone' | 'address';
    customer: any;
    confidence: number;
  }>;
}

@Injectable()
export class ReceptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dwClient: DWClient,
  ) {}

  // ==================== 受付管理 ====================

  /**
   * 受付カード作成
   */
  async createReceptionCard(dto: CreateReceptionCardDto, createdBy: string) {
    // 重複チェック
    if (dto.visitorName && dto.visitorPhone) {
      const duplicateCheck = await this.checkDuplicateCustomer(dto.visitorName, dto.visitorPhone);
      if (duplicateCheck.isDuplicate && !dto.customerId) {
        // 既存顧客の可能性がある場合は候補を返す
        return {
          type: 'duplicate_warning',
          candidates: duplicateCheck.matches,
          cardData: dto,
        };
      }
    }

    // 商談室自動割り当て
    const assignedRoom = await this.assignAvailableRoom(dto.companyId, dto.storeId);

    const receptionCard = await this.prisma.receptionCard.create({
      data: {
        ...dto,
        roomId: dto.roomId || assignedRoom?.id,
        priority: dto.priority || 3,
        status: 'waiting',
        arrivedAt: new Date(),
        createdBy,
      },
      include: {
        customer: true,
        assignedUser: true,
        createdByUser: true,
      },
    });

    // 担当者への通知
    if (dto.assignedTo) {
      await this.notifyStaffAssignment(dto.assignedTo, receptionCard);
    }

    // DW連携
    try {
      const dwNotification: DWVisitorNotification = {
        visitorName: dto.visitorName,
        purpose: dto.purpose,
        assignedTo: dto.assignedTo,
        roomId: assignedRoom?.id,
        arrivedAt: new Date().toISOString(),
      };

      await this.dwClient.notifyVisitorArrival(dwNotification);
    } catch (error) {
      console.error('Failed to notify DW of visitor arrival:', error);
    }

    return {
      type: 'success',
      receptionCard,
      assignedRoom,
    };
  }

  /**
   * 受付カード更新
   */
  async updateReceptionCard(
    cardId: string,
    updates: Partial<{
      status: string;
      assignedTo: string;
      roomId: string;
      notes: string;
    }>
  ) {
    const card = await this.prisma.receptionCard.update({
      where: { id: cardId },
      data: {
        ...updates,
        ...(updates.status === 'assigned' && { assignedAt: new Date() }),
        ...(updates.status === 'completed' && { completedAt: new Date() }),
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    // ステータス変更時の通知
    if (updates.status && updates.assignedTo) {
      await this.notifyStatusChange(card);
    }

    return card;
  }

  /**
   * 今日の受付一覧
   */
  async getTodayReceptions(companyId: string, storeId?: string, status?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.prisma.receptionCard.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        ...(status && { status }),
        arrivedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        customer: true,
        assignedUser: true,
        createdByUser: true,
      },
      orderBy: [
        { priority: 'asc' },
        { arrivedAt: 'asc' },
      ],
    });
  }

  // ==================== 重複判定機能 ====================

  /**
   * 顧客重複チェック
   */
  async checkDuplicateCustomer(
    name: string,
    phone?: string,
    address?: string
  ): Promise<DuplicateCheckResult> {
    const matches = [];

    // 名前での検索（部分一致）
    if (name) {
      const nameMatches = await this.prisma.customer.findMany({
        where: {
          name: {
            contains: name,
          },
        },
        take: 5,
      });

      nameMatches.forEach(customer => {
        const confidence = this.calculateNameSimilarity(name, customer.name);
        if (confidence > 0.7) {
          matches.push({
            type: 'name' as const,
            customer,
            confidence,
          });
        }
      });
    }

    // 電話番号での検索（完全一致）
    if (phone) {
      const cleanPhone = this.cleanPhoneNumber(phone);
      const phoneMatches = await this.prisma.customer.findMany({
        where: {
          OR: [
            { phone: phone },
            { phone: cleanPhone },
            { mobile: phone },
            { mobile: cleanPhone },
          ],
        },
      });

      phoneMatches.forEach(customer => {
        matches.push({
          type: 'phone' as const,
          customer,
          confidence: 1.0,
        });
      });
    }

    // 住所での検索（部分一致）
    if (address) {
      const addressMatches = await this.prisma.customer.findMany({
        where: {
          address: {
            contains: address,
          },
        },
        take: 3,
      });

      addressMatches.forEach(customer => {
        const confidence = this.calculateAddressSimilarity(address, customer.address || '');
        if (confidence > 0.8) {
          matches.push({
            type: 'address' as const,
            customer,
            confidence,
          });
        }
      });
    }

    // 重複除去とスコア順ソート
    const uniqueMatches = this.deduplicateMatches(matches);
    
    return {
      isDuplicate: uniqueMatches.length > 0,
      matches: uniqueMatches.slice(0, 3), // 上位3件まで
    };
  }

  // ==================== 商談室・車両管理 ====================

  /**
   * 利用可能な商談室の自動割り当て
   */
  async assignAvailableRoom(companyId: string, storeId?: string) {
    const availableRooms = await this.prisma.resource.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        type: 'room',
        subType: 'meeting',
        maintenanceStatus: 'available',
      },
    });

    if (availableRooms.length === 0) {
      return null;
    }

    // 現在利用中でない部屋を探す
    const now = new Date();
    for (const room of availableRooms) {
      const currentBooking = await this.prisma.booking.findFirst({
        where: {
          resourceId: room.id,
          startTime: { lte: now },
          endTime: { gte: now },
          status: { in: ['confirmed', 'in_progress'] },
        },
      });

      if (!currentBooking) {
        // 即座に予約を作成
        await this.prisma.booking.create({
          data: {
            companyId: room.companyId,
            storeId: room.storeId,
            resourceId: room.id,
            userId: 'system', // システム予約
            customerId: null,
            title: '来店受付',
            startTime: now,
            endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2時間後
            status: 'confirmed',
            purpose: 'reception',
          },
        });

        return room;
      }
    }

    return null; // 全て使用中
  }

  /**
   * 商談室・車両の空き状況確認
   */
  async getResourceAvailability(
    companyId: string,
    date: Date,
    storeId?: string,
    resourceType?: string
  ) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const resources = await this.prisma.resource.findMany({
      where: {
        companyId,
        ...(storeId && { storeId }),
        ...(resourceType && { type: resourceType }),
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            startTime: { lte: endOfDay },
            endTime: { gte: startOfDay },
            status: { in: ['confirmed', 'in_progress'] },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      subType: resource.subType,
      capacity: resource.capacity,
      location: resource.location,
      maintenanceStatus: resource.maintenanceStatus,
      bookings: resource.bookings,
      availability: this.calculateAvailabilitySlots(resource.bookings, startOfDay, endOfDay),
    }));
  }

  // ==================== 通知システム ====================

  /**
   * 通知作成・送信
   */
  async createNotification(dto: CreateNotificationDto, createdBy: string) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId: 'system', // システム通知の場合
        recipientId: dto.recipientId,
        type: dto.type,
        channel: dto.channel,
        title: dto.title,
        message: dto.message,
        priority: dto.priority || 3,
        metadata: JSON.stringify(dto.metadata || {}),
        status: 'pending',
        createdBy,
      },
    });

    // 通知送信処理
    await this.sendNotification(notification);

    return notification;
  }

  /**
   * 通知送信処理
   */
  private async sendNotification(notification: any) {
    try {
      // 通知タイプに応じた送信処理
      switch (notification.type) {
        case 'slack':
          await this.sendSlackNotification(notification);
          break;
        case 'chatwork':
          await this.sendChatworkNotification(notification);
          break;
        case 'email':
          await this.sendEmailNotification(notification);
          break;
        case 'sms':
          await this.sendSMSNotification(notification);
          break;
        default:
          console.log('System notification:', notification.title, notification.message);
      }

      // 送信完了を記録
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
        },
      });
    }
  }

  // ==================== ヘルパーメソッド ====================

  private calculateNameSimilarity(name1: string, name2: string): number {
    // シンプルな文字列類似度計算（レーベンシュタイン距離ベース）
    const maxLength = Math.max(name1.length, name2.length);
    const distance = this.levenshteinDistance(name1, name2);
    return 1 - distance / maxLength;
  }

  private calculateAddressSimilarity(address1: string, address2: string): number {
    // 住所の類似度計算（都道府県、市区町村レベルでの一致を重視）
    const normalize = (addr: string) => addr.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    const norm1 = normalize(address1);
    const norm2 = normalize(address2);
    
    const maxLength = Math.max(norm1.length, norm2.length);
    const distance = this.levenshteinDistance(norm1, norm2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[-\s\(\)]/g, '');
  }

  private deduplicateMatches(matches: any[]): any[] {
    const seen = new Set();
    return matches
      .filter(match => {
        const key = match.customer.id;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateAvailabilitySlots(bookings: any[], startOfDay: Date, endOfDay: Date) {
    // 9:00-18:00の営業時間を想定
    const businessStart = new Date(startOfDay);
    businessStart.setHours(9, 0, 0, 0);
    const businessEnd = new Date(startOfDay);
    businessEnd.setHours(18, 0, 0, 0);

    const slots = [];
    let currentTime = businessStart;

    bookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    for (const booking of bookings) {
      if (currentTime < booking.startTime) {
        slots.push({
          start: currentTime,
          end: booking.startTime,
          available: true,
        });
      }
      slots.push({
        start: booking.startTime,
        end: booking.endTime,
        available: false,
        booking: booking,
      });
      currentTime = booking.endTime;
    }

    if (currentTime < businessEnd) {
      slots.push({
        start: currentTime,
        end: businessEnd,
        available: true,
      });
    }

    return slots;
  }

  private async notifyStaffAssignment(userId: string, receptionCard: any) {
    await this.createNotification(
      {
        recipientId: userId,
        type: 'system',
        channel: 'internal',
        title: '新しい来店受付が割り当てられました',
        message: `${receptionCard.visitorName}様が来店されました。目的: ${receptionCard.purpose}`,
        priority: 2,
        metadata: {
          receptionCardId: receptionCard.id,
          roomId: receptionCard.roomId,
        },
      },
      'system'
    );
  }

  private async notifyStatusChange(receptionCard: any) {
    // スタッフ間の情報共有
    console.log('Reception status changed:', {
      cardId: receptionCard.id,
      visitor: receptionCard.visitorName,
      status: receptionCard.status,
      assignedTo: receptionCard.assignedUser?.name,
    });
  }

  private async sendSlackNotification(notification: any) {
    // Slack通知の実装（Webhook URLを使用）
    console.log('Slack notification:', notification.title, notification.message);
  }

  private async sendChatworkNotification(notification: any) {
    // Chatwork通知の実装（API使用）
    console.log('Chatwork notification:', notification.title, notification.message);
  }

  private async sendEmailNotification(notification: any) {
    // Email通知の実装（SMTP使用）
    console.log('Email notification:', notification.title, notification.message);
  }

  private async sendSMSNotification(notification: any) {
    // SMS通知の実装（Twilio等のAPI使用）
    console.log('SMS notification:', notification.title, notification.message);
  }
}