import apiClient from '@/lib/api-client';
import { Order } from '@/types';

export const orderService = {
  createOrder: async (data: any) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  getUserOrders: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get('/orders', {
      params: { page, limit },
    });
    return response.data;
  },

  getStaffOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/orders/staff', { params });
    return response.data;
  },

  updateStatus: async (id: string, data: { status: string; cancelReason?: string }) => {
    const response = await apiClient.patch(`/orders/${id}/status`, data);
    return response.data;
  },

  confirmTransfer: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/confirm-transfer`);
    return response.data;
  },

  confirmPayment: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/confirm-payment`);
    return response.data;
  },

  confirmReceived: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/confirm-received`);
    return response.data;
  },
};
