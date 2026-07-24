import apiClient from '@/lib/api-client';
import { Restaurant } from '@/types';

export const restaurantService = {
  searchRestaurants: async (params?: {
    search?: string;
    city?: string;
    cuisineType?: string[];
    minRating?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/restaurants', { params });
    return response.data;
  },

  getRestaurantById: async (id: string): Promise<Restaurant> => {
    const response = await apiClient.get(`/restaurants/${id}`);
    return response.data;
  },

  getRestaurantBySlug: async (slug: string): Promise<Restaurant> => {
    const response = await apiClient.get(`/restaurants/slug/${slug}`);
    return response.data;
  },
};
