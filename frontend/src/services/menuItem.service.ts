import apiClient from '@/lib/api-client';

export const menuItemService = {
  getMenuItemsByCategory: async (params?: {
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/restaurants/menu-items', { params });
    return response.data;
  },
};