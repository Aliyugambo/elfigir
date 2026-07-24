'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order.service';
import { AdminOrder } from '@/services/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { FaUtensils, FaCheckCircle, FaClock } from 'react-icons/fa';

const statusStyles: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
};

export default function ChefPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role !== 'RESTAURANT') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['chef-orders'],
    queryFn: () => orderService.getStaffOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'RESTAURANT',
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) =>
      orderService.updateStatus(id, { status, cancelReason }),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['chef-orders'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const orders: AdminOrder[] = data?.orders ?? [];

  const startPreparing = (id: string) => updateMutation.mutate({ id, status: 'PREPARING' });
  const markReady = (id: string) => updateMutation.mutate({ id, status: 'READY_FOR_PICKUP' });

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Chef Portal</h1>
            <p className="text-gray-600 mt-1">Prepare orders approved by the admin.</p>
          </div>
          <Link href="/" className="btn-outline px-4 py-2 rounded-lg">
            Back to Home
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-white animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg bg-white border border-gray-200 p-10 text-center text-gray-500">
            No approved orders to prepare right now.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Order {order.orderNumber}</p>
                    <p className="font-semibold text-gray-900">
                      {order.user.firstName} {order.user.lastName} · {order.user.email}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{order.restaurant.name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      statusStyles[order.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status === 'READY_FOR_PICKUP' ? (
                      <FaCheckCircle />
                    ) : (
                      <FaClock />
                    )}
                    <span>{order.status.replace(/_/g, ' ')}</span>
                  </span>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <ul className="space-y-1 text-sm text-gray-700">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.menuItem.name} x{item.quantity}
                        </span>
                        <span className="text-gray-500">₦{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-bold text-primary">
                    ₦{order.totalAmount.toFixed(0)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => startPreparing(order.id)}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FaUtensils /> Start Preparing
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => markReady(order.id)}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FaCheckCircle /> Mark Ready for Pickup
                    </button>
                  )}
                  {order.status === 'READY_FOR_PICKUP' && (
                    <span className="text-sm text-purple-700 font-semibold">
                      Waiting for a rider to pick up.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
