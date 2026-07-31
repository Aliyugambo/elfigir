'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/order.service';
import { OrderStatus } from '@/types';
import { FaArrowRight, FaClock, FaTruck, FaCheckCircle } from 'react-icons/fa';

const statusConfig: Record<OrderStatus, { color: string; icon: React.ComponentType<{ className?: string }>; text: string }> = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: FaClock, text: 'Pending' },
  CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: FaClock, text: 'Confirmed' },
  PREPARING: { color: 'bg-blue-100 text-blue-800', icon: FaClock, text: 'Preparing' },
  READY_FOR_PICKUP: { color: 'bg-purple-100 text-purple-800', icon: FaTruck, text: 'Ready' },
  OUT_FOR_DELIVERY: { color: 'bg-orange-100 text-orange-800', icon: FaTruck, text: 'On the way' },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, text: 'Delivered' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: FaClock, text: 'Cancelled' },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getUserOrders(1, 20),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view orders</h1>
        <p className="text-gray-600 mb-8">You need to be logged in to view your orders</p>
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-4">
          <FaArrowRight className="transform rotate-180" />
          <span>Back</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-2">Track and manage your food orders</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white rounded-lg border border-gray-100"
        >
          <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet</p>
          <Link href="/" className="btn-primary">
            Start Ordering
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {orders.map((order: any, index: number) => {
            const statusInfo = statusConfig[order.status as OrderStatus];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="p-6">
                  <div className="grid md:grid-cols-4 gap-4 items-start">
                    {/* Order Info */}
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-bold text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Restaurant */}
                    <div>
                      <p className="text-sm text-gray-600">Restaurant</p>
                      <p className="font-semibold text-gray-900">{order.restaurant.name}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Status</p>
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₦{order.totalAmount.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-600 mb-2">Items ({order.items.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map((item: any) => (
                        <span
                          key={item.id}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {item.menuItem?.name ?? 'Item'} x{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
