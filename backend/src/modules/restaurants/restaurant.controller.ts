import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantUseCase } from './restaurant.use-case';
import { CreateRestaurantDto, RestaurantFilterDto } from './restaurant.dto';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantController {
  constructor(private restaurantUseCase: RestaurantUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant' })
  async create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantUseCase.createRestaurant(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search restaurants' })
  async search(@Query() filters: RestaurantFilterDto) {
    return this.restaurantUseCase.searchRestaurants(filters);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  async getById(@Param('id') id: string) {
    return this.restaurantUseCase.getRestaurantById(id);
  }

  @Get('/slug/:slug')
  @ApiOperation({ summary: 'Get restaurant by slug' })
  async getBySlug(@Param('slug') slug: string) {
    return this.restaurantUseCase.getRestaurantBySlug(slug);
  }
}
