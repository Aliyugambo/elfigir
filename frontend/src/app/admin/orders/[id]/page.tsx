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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Order not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p className="text-sm text-gray-600">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Restaurant</p>
              <p className="font-medium text-gray-900">{order.restaurant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900">{order.paymentMethod}</p>
              <p className="text-sm text-gray-600">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivery Address</p>
              <p className="font-medium text-gray-900">{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          {item.menuItem?.image && (
                            <img
                              src={item.menuItem.image}
                              alt={item.menuItem?.name}
                              className="h-10 w-10 rounded object-cover border border-gray-200"
                            />
                          )}
                          <span>{item.menuItem?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">₦{item.price.toFixed(2)}</td>
                      <td className="px-4 py-2">₦{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="font-medium text-gray-900">₦{order.subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivery Fee</p>
              <p className="font-medium text-gray-900">₦{order.deliveryFee.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax</p>
              <p className="font-medium text-gray-900">₦{order.tax.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-semibold text-primary text-lg">₦{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {order.specialInstructions && (
            <div>
              <p className="text-sm text-gray-500">Special Instructions</p>
              <p className="font-medium text-gray-900">{order.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
