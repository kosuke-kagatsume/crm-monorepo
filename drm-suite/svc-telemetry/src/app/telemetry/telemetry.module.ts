import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';

@Module({
  controllers: [TelemetryController],
  providers: [TelemetryService, PrismaService],
  exports: [TelemetryService],
})
export class TelemetryModule {}