'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const statusOptions: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function StaffOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-orders', statusFilter],
    queryFn: async () => {
      const url = new URL('/api/staff/orders', window.location.origin);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isAuthenticated && (user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN'),
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch(`/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ status }),
      });
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    }
  };

  const orders = data?.orders || [];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">Manage orders for your restaurant</p>
          </div>
          <Link href="/staff" className="btn-outline px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="input-field w-full max-w-xs"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-white animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Order</p>
                  <p className="font-semibold text-sm sm:text-base text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900">{order.user?.firstName} {order.user?.lastName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-primary">₦{order.totalAmount.toFixed(0)}</p>
                </div>
              </div>

                <div className="mt-3 sm:mt-6 grid gap-3 sm:gap-4 md:grid-cols-2 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                      {order.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <select
                      defaultValue={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                      className="input-field w-full"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
