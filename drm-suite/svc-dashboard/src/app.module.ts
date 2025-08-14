import { Module } from '@nestjs/common';
import { DashboardModule } from './app/dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
})
export class AppModule {}