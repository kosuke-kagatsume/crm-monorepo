import { Module } from '@nestjs/common';
import { RAGModule } from './app/rag/rag.module';

@Module({
  imports: [RAGModule],
})
export class AppModule {}