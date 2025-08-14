import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { LedgerRAGService } from './ledger-rag.service';
import { AftercareRAGService } from './aftercare-rag.service';
import { PresetRAGService } from './preset-rag.service';
import { RAGController } from './rag.controller';

@Module({
  controllers: [RAGController],
  providers: [LedgerRAGService, AftercareRAGService, PresetRAGService, PrismaService],
  exports: [LedgerRAGService, AftercareRAGService, PresetRAGService],
})
export class RAGModule {}