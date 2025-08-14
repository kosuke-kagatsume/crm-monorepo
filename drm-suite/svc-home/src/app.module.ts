import { Module } from '@nestjs/common';
import { HomeModule } from './app/home/home.module';

@Module({
  imports: [HomeModule],
})
export class AppModule {}