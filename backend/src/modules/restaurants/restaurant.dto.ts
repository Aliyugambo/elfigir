import { IsString, IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRestaurantDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  cuisineType!: string[];

  @IsNumber()
  minDeliveryTime!: number;

  @IsNumber()
  maxDeliveryTime!: number;

  @IsNumber()
  deliveryFee!: number;

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  phone!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;
}

export class UpdateRestaurantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  cuisineType?: string[];

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;
}

export class RestaurantFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsArray()
  @IsOptional()
  cuisineType?: string[];

  @IsNumber()
  @IsOptional()
  minRating?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
