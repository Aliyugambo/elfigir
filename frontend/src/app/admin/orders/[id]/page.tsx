'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminService.getOrder(orderId),
    enabled: !!orderId && isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const order = data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Order not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Order Details</h1>
            <p className="text-charcoal-light mt-1">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg border border-cream shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-charcoal-light">Customer</p>
              <p className="font-medium text-charcoal">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p className="text-sm text-charcoal-light">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Restaurant</p>
              <p className="font-medium text-charcoal">{order.restaurant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Status</p>
              <span className="inline-flex rounded-full bg-cream px-3 py-1 text-sm font-semibold text-charcoal">
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Payment Method</p>
              <p className="font-medium text-charcoal">{order.paymentMethod}</p>
              <p className="text-sm text-charcoal-light">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Delivery Address</p>
              <p className="font-medium text-charcoal">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Created At</p>
              <p className="font-medium text-charcoal">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-2">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm text-charcoal-light">
                <thead className="bg-cream text-charcoal">
                  <tr>
                    <th className="px-2 py-2 sm:px-4 sm:py-3">Item</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3">Quantity</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3">Price</th>
                    <th className="px-2 py-2 sm:px-4 sm:py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="border-t border-cream">
                      <td className="px-2 py-3 sm:px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {item.menuItem?.image && (
                            <img
                              src={item.menuItem.image}
                              alt={item.menuItem?.name}
                              className="h-8 w-8 sm:h-10 sm:w-10 rounded object-cover border border-cream"
                            />
                          )}
                          <span className="text-sm">{item.menuItem?.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 text-sm">{item.quantity}</td>
                      <td className="px-2 py-3 sm:px-4 text-sm">₦{item.price.toFixed(2)}</td>
                      <td className="px-2 py-3 sm:px-4 text-sm">₦{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-charcoal-light">Subtotal</p>
              <p className="font-medium text-charcoal">₦{order.subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Delivery Fee</p>
              <p className="font-medium text-charcoal">₦{order.deliveryFee.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Tax</p>
              <p className="font-medium text-charcoal">₦{order.tax.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-charcoal-light">Total</p>
              <p className="font-semibold text-primary text-lg">₦{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {order.specialInstructions && (
            <div>
              <p className="text-sm text-charcoal-light">Special Instructions</p>
              <p className="font-medium text-charcoal">{order.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
