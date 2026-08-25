import { IsString, IsNumber, IsArray, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class CreateOrderItemDto {
  @IsString()
  menuItemId!: string;

  @IsNumber()
  quantity!: number;

  @IsArray()
  @IsOptional()
  addOns?: string[];

  @IsString()
  @IsOptional()
  specialNote?: string;
}

export class CreateOrderDto {
  @IsString()
  restaurantId!: string;

  @IsArray()
  items!: CreateOrderItemDto[];

  @IsString()
  deliveryAddress!: string;

  @IsNumber()
  @IsOptional()
  deliveryLat?: number;

  @IsNumber()
  @IsOptional()
  deliveryLng?: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsString()
  @IsOptional()
  specialInstructions?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class VerifyPaystackDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;
}
