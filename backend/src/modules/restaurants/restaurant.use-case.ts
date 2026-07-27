import { Injectable } from '@nestjs/common';
import { RestaurantRepository } from './restaurant.repository';
import { CreateRestaurantDto, UpdateRestaurantDto, RestaurantFilterDto, MenuItemFilterDto } from './restaurant.dto';

@Injectable()
export class RestaurantUseCase {
  constructor(private restaurantRepository: RestaurantRepository) {}

  async createRestaurant(dto: CreateRestaurantDto) {
    return this.restaurantRepository.create(dto);
  }

  async searchRestaurants(filters: RestaurantFilterDto) {
    return this.restaurantRepository.findAll(filters);
  }

  async getRestaurantById(id: string) {
    return this.restaurantRepository.findById(id);
  }

  async getRestaurantBySlug(slug: string) {
    return this.restaurantRepository.findBySlug(slug);
  }

  async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
    return this.restaurantRepository.update(id, dto);
  }

  async getMenuItemsByCategory(filters: MenuItemFilterDto) {
    return this.restaurantRepository.findMenuItemsByCategory(filters);
  }
}
