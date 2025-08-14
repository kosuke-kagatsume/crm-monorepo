import { Module } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { HomeService } from './home.service';
import { HomeController } from './home.controller';
import { HomeStubsController } from './home-stubs.controller';

@Module({
  controllers: [HomeController, HomeStubsController],
  providers: [HomeService, PrismaService],
  exports: [HomeService],
})
export class HomeModule {}