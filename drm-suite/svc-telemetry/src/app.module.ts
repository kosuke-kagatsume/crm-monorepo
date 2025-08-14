import { Module } from '@nestjs/common';
import { TelemetryModule } from './app/telemetry/telemetry.module';

@Module({
  imports: [TelemetryModule],
})
export class AppModule {}