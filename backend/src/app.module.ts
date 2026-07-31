import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { RestaurantModule } from './modules/restaurants/restaurant.module';
import { OrderModule } from './modules/orders/order.module';
import { StaffModule } from './modules/staff/staff.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CommonModule,
    AuthModule,
    AdminModule,
    RestaurantModule,
    OrderModule,
    StaffModule,
  ],
})
export class AppModule {}
