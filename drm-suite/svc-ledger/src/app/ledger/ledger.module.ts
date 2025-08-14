import { Module } from '@nestjs/common';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { JournalService } from './journal.service';
import { AccountService } from './account.service';
import { ReportService } from './report.service';
import { IntegrationService } from './integration.service';
import { PrismaModule } from '@drm-suite/prisma';
import { EventBusModule } from '@drm-suite/event-bus';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [LedgerController],
  providers: [
    LedgerService,
    JournalService,
    AccountService,
    ReportService,
    IntegrationService,
  ],
  exports: [LedgerService],
})
export class LedgerModule {}