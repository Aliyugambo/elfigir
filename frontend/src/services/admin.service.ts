import apiClient from '@/lib/api-client';

export type Role = 'CUSTOMER' | 'RESTAURANT' | 'ADMIN' | 'DELIVERY';

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  accessToken?: string;
  refreshToken?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type StaffRole = 'RESTAURANT' | 'DELIVERY';

export type StaffMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: StaffRole;
  isActive: boolean;
  emailVerified: boolean;
  restaurantId?: string;
  restaurant?: {
    id: string;
    name: string;
  };
  createdAt: string;
};

export type AdminMenuItem = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  prepTime?: number;
  menuId: string;
  addOns?: {
    id: string;
    name: string;
    price: number;
  }[];
  menu?: {
    id: string;
    name: string;
  };
};

export type AdminMenu = {
  id: string;
  name: string;
  description?: string;
  restaurant: { id: string; name: string };
  _count?: { items: number };
};

export type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineType: string[];
  city: string;
  state: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryFee: number;
  minDeliveryTime: number;
  maxDeliveryTime: number;
  isOpen: boolean;
  isActive: boolean;
  isVerified: boolean;
  banner?: string;
  createdAt: string;
  menus: { id: string; name: string }[];
};

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type DashboardStats = {
  counts: {
    customers: number;
    chefs: number;
    riders: number;
    restaurants: number;
    orders: number;
  };
  pendingRiderApprovals: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  specialInstructions?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  cancelReason?: string;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      id: string;
      name: string;
      image?: string;
    };
  }[];
};

export const adminService = {
  login: async (data: { email: string; password: string }): Promise<AdminUser> => {
    const res = await apiClient.post('/admin/login', data);
    return res.data;
  },

  registerAdmin: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<AdminUser> => {
    const res = await apiClient.post('/admin/register', data);
    return res.data;
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  listStaff: async (role: StaffRole): Promise<StaffMember[]> => {
    const res = await apiClient.get(`/admin/staff/${role}`);
    return res.data;
  },

  createStaff: async (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: StaffRole;
    phone?: string;
    restaurantId?: string;
  }): Promise<StaffMember> => {
    const res = await apiClient.post('/auth/staff', data);
    return res.data;
  },

  updateStaff: async (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: StaffRole;
      restaurantId?: string;
      password?: string;
    },
  ): Promise<StaffMember> => {
    const res = await apiClient.patch(`/admin/staff/${id}`, data);
    return res.data;
  },

  deleteStaff: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete(`/admin/staff/${id}`);
    return res.data;
  },

  approveStaff: async (id: string): Promise<StaffMember> => {
    const res = await apiClient.post(`/admin/staff/${id}/approve`);
    return res.data;
  },

  listOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/admin/orders', { params });
    return res.data;
  },

  listPendingTransfers: async () => {
    const res = await apiClient.get('/admin/orders/pending-transfers');
    return res.data;
  },

  getOrder: async (id: string): Promise<AdminOrder> => {
    const res = await apiClient.get(`/admin/orders/${id}`);
    return res.data;
  },

  updateOrderStatus: async (id: string, data: { status: string; cancelReason?: string }) => {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, data);
    return res.data;
  },

  confirmPayment: async (orderId: string) => {
    const res = await apiClient.post(`/admin/orders/${orderId}/confirm-payment`);
    return res.data;
  },

  listUsers: async (params?: { role?: Role; isActive?: boolean; page?: number; limit?: number }) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id: string, data: { isActive: boolean }) => {
    const res = await apiClient.patch(`/admin/users/${id}/status`, data);
    return res.data;
  },

  updateUser: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: Role;
    isActive?: boolean;
    password?: string;
  }) => {
    const res = await apiClient.patch(`/admin/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },

  listMenuItems: async (params?: { menuId?: string }): Promise<AdminMenuItem[]> => {
    const res = await apiClient.get('/admin/menu-items', { params });
    return res.data;
  },

  createMenuItem: async (data: {
    menuId: string;
    name: string;
    description?: string;
    image?: string;
    price: number;
    category: string;
    isAvailable?: boolean;
    prepTime?: number;
  }) => {
    const res = await apiClient.post('/admin/menu-items', data);
    return res.data;
  },

  updateMenuItem: async (id: string, data: {
    menuId?: string;
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    category?: string;
    isAvailable?: boolean;
    prepTime?: number;
  }) => {
    const res = await apiClient.patch(`/admin/menu-items/${id}`, data);
    return res.data;
  },

  deleteMenuItem: async (id: string) => {
    const res = await apiClient.delete(`/admin/menu-items/${id}`);
    return res.data;
  },

  uploadMenuItemImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/admin/menu-items/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteOrder: async (id: string) => {
    const res = await apiClient.delete(`/admin/orders/${id}`);
    return res.data;
  },

  listMenus: async (): Promise<AdminMenu[]> => {
    const res = await apiClient.get('/admin/menus');
    return res.data;
  },

  listRestaurants: async (): Promise<AdminRestaurant[]> => {
    const res = await apiClient.get('/admin/restaurants');
    return res.data;
  },

  createRestaurant: async (data: {
    name: string;
    description?: string;
    cuisineType: string[];
    city: string;
    state: string;
    phone: string;
    address: string;
    deliveryFee: number;
    minDeliveryTime: number;
    maxDeliveryTime: number;
    image?: string;
    isOpen?: boolean;
    isActive?: boolean;
  }): Promise<AdminRestaurant> => {
    const res = await apiClient.post('/admin/restaurants', data);
    return res.data;
  },

  getRestaurant: async (id: string): Promise<AdminRestaurant> => {
    const res = await apiClient.get(`/admin/restaurants/${id}`);
    return res.data;
  },

  updateRestaurant: async (id: string, data: {
    name?: string;
    description?: string;
    cuisineType?: string[];
    isOpen?: boolean;
    isActive?: boolean;
    image?: string;
  }): Promise<AdminRestaurant> => {
    const res = await apiClient.patch(`/admin/restaurants/${id}`, data);
    return res.data;
  },

  uploadRestaurantImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post('/admin/restaurants/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteRestaurant: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete(`/admin/restaurants/${id}`);
    return res.data;
  },

  createMenu: async (data: {
    restaurantId: string;
    name: string;
    description?: string;
  }): Promise<AdminMenu> => {
    const res = await apiClient.post('/admin/menus', data);
    return res.data;
  },

  updateMenu: async (id: string, data: {
    name?: string;
    description?: string;
  }): Promise<AdminMenu> => {
    const res = await apiClient.patch(`/admin/menus/${id}`, data);
    return res.data;
  },

  deleteMenu: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete(`/admin/menus/${id}`);
    return res.data;
  },

  listNotifications: async (): Promise<AdminNotification[]> => {
    const res = await apiClient.get('/admin/notifications');
    return res.data;
  },

  markNotificationRead: async (id: string): Promise<AdminNotification> => {
    const res = await apiClient.patch(`/admin/notifications/${id}/read`);
    return res.data;
  },
};
