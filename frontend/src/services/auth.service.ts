import apiClient from '@/lib/api-client';
import { User } from '@/types';

export type AuthResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'RESTAURANT' | 'ADMIN' | 'DELIVERY';
  accessToken: string;
  refreshToken: string;
};

export const authService = {
  signUp: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
  }) => {
    const response = await apiClient.post('/auth/sign-up', data);
    return response.data;
  },

  signIn: async (data: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/sign-in', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};
