import { Module } from '@nestjs/common';
import { AftercareController } from './aftercare.controller';
import { AftercareService } from './aftercare.service';
import { ContractService } from './contract.service';
import { InspectionService } from './inspection.service';
import { ClaimService } from './claim.service';
import { SurveyService } from './survey.service';
import { PrismaModule } from '@drm-suite/prisma';
import { EventBusModule } from '@drm-suite/event-bus';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [AftercareController],
  providers: [
    AftercareService,
    ContractService,
    InspectionService,
    ClaimService,
    SurveyService,
  ],
  exports: [AftercareService],
})
export class AftercareModule {}