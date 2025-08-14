import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { EnhancedNotificationService } from './enhanced-notification.service';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [EnhancedNotificationService, PrismaService],
  exports: [EnhancedNotificationService],
})
export class NotificationModule {}