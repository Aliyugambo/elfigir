import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantUseCase } from './restaurant.use-case';
import { RestaurantRepository } from './restaurant.repository';

@Module({
  imports: [CommonModule],
  controllers: [RestaurantController],
  providers: [RestaurantUseCase, RestaurantRepository],
  exports: [RestaurantUseCase],
})
export class RestaurantModule {}
