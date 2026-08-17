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
  PENDING: { color: 'bg-mustard/20 text-maroon', icon: FaClock, text: 'Pending' },
  CONFIRMED: { color: 'bg-maroon/10 text-maroon', icon: FaClock, text: 'Confirmed' },
  PREPARING: { color: 'bg-maroon/10 text-maroon', icon: FaClock, text: 'Preparing' },
  READY_FOR_PICKUP: { color: 'bg-mustard/10 text-maroon', icon: FaTruck, text: 'Ready' },
  OUT_FOR_DELIVERY: { color: 'bg-mustard/20 text-maroon', icon: FaTruck, text: 'On the way' },
   DELIVERED: { color: 'bg-mustard/10 text-maroon', icon: FaCheckCircle, text: 'Delivered' },
  COMPLETED: { color: 'bg-mustard/10 text-maroon', icon: FaCheckCircle, text: 'Completed' },
  CANCELLED: { color: 'bg-primary/10 text-primary', icon: FaClock, text: 'Cancelled' },
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
        <h1 className="text-3xl font-bold text-charcoal mb-4">Sign in to view orders</h1>
        <p className="text-charcoal-light mb-8">You need to be logged in to view your orders</p>
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
        <h1 className="text-3xl font-bold text-charcoal">My Orders</h1>
        <p className="text-charcoal-light mt-2">Track and manage your food orders</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-cream rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 sm:py-12 bg-white rounded-lg border border-cream"
          >
          <p className="text-charcoal-light text-lg mb-4">You haven't placed any orders yet</p>
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
                className="bg-white rounded-lg border border-cream overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="p-4 sm:p-6">
                  <div className="grid md:grid-cols-4 gap-4 items-start">
                    {/* Order Info */}
                    <div>
                      <p className="text-sm text-charcoal-light">Order Number</p>
                      <p className="font-bold text-charcoal">{order.orderNumber}</p>
                      <p className="text-xs text-charcoal-light mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Restaurant */}
                    <div>
                      <p className="text-sm text-charcoal-light">Restaurant</p>
                      <p className="font-semibold text-charcoal">{order.restaurant.name}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-charcoal-light mb-2">Status</p>
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-sm text-charcoal-light">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₦{order.totalAmount.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="mt-4 pt-4 border-t border-cream">
                    <p className="text-xs text-charcoal-light mb-2">Items ({order.items.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.slice(0, 3).map((item: any) => (
                        <span
                          key={item.id}
                          className="text-xs bg-cream text-charcoal px-2 py-1 rounded"
                        >
                          {item.menuItem?.name ?? 'Item'} x{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs bg-cream text-charcoal px-2 py-1 rounded">
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
