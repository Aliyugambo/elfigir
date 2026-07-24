'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { orderService } from '@/services/order.service';
import { AdminOrder } from '@/services/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { FaMotorcycle, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';

const statusStyles: Record<string, string> = {
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

export default function RiderPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user?.role !== 'DELIVERY') {
      router.replace('/');
    }
  }, [isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['rider-orders'],
    queryFn: () => orderService.getStaffOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'DELIVERY',
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Order updated');
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const orders: AdminOrder[] = data?.orders ?? [];

  const pickUp = (id: string) => updateMutation.mutate({ id, status: 'OUT_FOR_DELIVERY' });
  const markDelivered = (id: string) => updateMutation.mutate({ id, status: 'DELIVERED' });

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rider Portal</h1>
            <p className="text-gray-600 mt-1">Dispatch orders that are ready for delivery.</p>
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
            No orders to dispatch today.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Order {order.orderNumber}</p>
                    <p className="font-semibold text-gray-900">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <FaMapMarkerAlt /> {order.restaurant.name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      statusStyles[order.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
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
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-bold text-primary">
                    ₦{order.totalAmount.toFixed(0)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={() => pickUp(order.id)}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FaMotorcycle /> Pick Up & Out for Delivery
                    </button>
                  )}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => markDelivered(order.id)}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FaCheckCircle /> Mark Delivered
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <span className="text-sm text-green-700 font-semibold">
                      Delivered.
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
