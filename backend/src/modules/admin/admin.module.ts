import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrderModule } from '@/modules/orders/order.module';
import { AdminController } from './admin.controller';
import { AdminUseCase } from './admin.use-case';
import { AdminRepository } from './admin.repository';

@Module({
  imports: [CommonModule, AuthModule, OrderModule],
  controllers: [AdminController],
  providers: [AdminUseCase, AdminRepository],
  exports: [AdminUseCase],
})
export class AdminModule {}
