import { Module } from '@nestjs/common';
import { NotificationModule } from './app/notification/notification.module';

@Module({
  imports: [NotificationModule],
})
export class AppModule {}