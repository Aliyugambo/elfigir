import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantUseCase } from './restaurant.use-case';
import { CreateRestaurantDto, RestaurantFilterDto, MenuItemFilterDto } from './restaurant.dto';

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

  @Get('/menu-items')
  @ApiOperation({ summary: 'Browse menu items by category' })
  async getMenuItemsByCategory(@Query() filters: MenuItemFilterDto) {
    return this.restaurantUseCase.getMenuItemsByCategory(filters);
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

  @Post('/by-slugs')
  @ApiOperation({ summary: 'Get multiple restaurants by slugs' })
  async getBySlugs(@Body() body: { slugs: string[] }) {
    return this.restaurantUseCase.getRestaurantsBySlugs(body.slugs);
  }
}
