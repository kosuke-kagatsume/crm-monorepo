import { Module } from '@nestjs/common';
import { PermissionModule } from './app/permission/permission.module';

@Module({
  imports: [PermissionModule],
})
export class AppModule {}