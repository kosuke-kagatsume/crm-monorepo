import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { RoleDashboardService } from './role-dashboard.service';
import { RoleDashboardController } from './role-dashboard.controller';
import { WidgetService } from './widget.service';

@Module({
  controllers: [RoleDashboardController],
  providers: [RoleDashboardService, WidgetService, PrismaService],
  exports: [RoleDashboardService, WidgetService],
})
export class DashboardModule {}