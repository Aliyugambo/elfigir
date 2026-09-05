import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { OrderController } from './order.controller';
import { OrderUseCase } from './order.use-case';
import { OrderRepository } from './order.repository';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [OrderController],
  providers: [OrderUseCase, OrderRepository],
  exports: [OrderUseCase, OrderRepository],
})
export class OrderModule {}
