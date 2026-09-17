export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: 'CUSTOMER' | 'RESTAURANT' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | 'DELIVERY';
  createdAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  cuisineType: string[];
  rating: number;
  reviewCount: number;
  minDeliveryTime: number;
  maxDeliveryTime: number;
  deliveryFee: number;
  minOrderValue: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  menus: Menu[];
};

export type Menu = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  originalPrice?: number;
  category: string;
  isAvailable: boolean;
  prepTime?: number;
  addOns?: AddOn[];
};

export type AddOn = {
  id: string;
  name: string;
  price: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  specialInstructions?: string;
  createdAt: string;
  restaurant: Restaurant;
};

export type DeliveryTracking = {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  restaurant: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  tracking?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    distanceMeters?: number | null;
    etaSeconds?: number | null;
    arrivedAt?: string | null;
    lastUpdatedAt: string;
  } | null;
};

export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  addOns: string[];
};

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';

export type CartItem = {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  addOns: AddOn[];
  specialNote?: string;
};
