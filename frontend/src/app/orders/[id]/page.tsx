'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { orderService } from '@/services/order.service';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId),
    enabled: !!orderId && isAuthenticated,
    retry: false,
  });

  const order = data;

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view order</h1>
        <p className="text-gray-600 mb-8">You need to be logged in to view your order</p>
        <a href="/login" className="btn-primary">Sign In</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
        Order not found.
      </div>
    );
  }

  const handleConfirmTransfer = async () => {
    if (!orderId) return;
    setIsConfirming(true);
    try {
      await orderService.confirmTransfer(orderId);
      toast.success('Transfer confirmed! Admin will verify your payment.');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm transfer');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-1">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
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

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PENDING' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Bank Transfer Details</h3>
              <p className="text-sm text-gray-600">Bank: {order.restaurant?.bankName || 'GT BANK'}</p>
              <p className="text-sm text-gray-600">Account Name: {order.restaurant?.accountName || 'SQUAD ELFIJR KITCHEN LTD'}</p>
              <p className="text-sm text-gray-600">Account Number: {order.restaurant?.accountNumber || '5000530466'}</p>
              <p className="text-sm text-gray-500 mt-2">Please transfer the exact amount to the account above.</p>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={isConfirming}
                className="mt-3 btn-primary py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? 'Confirming...' : "I've Made the Transfer"}
              </button>
            </div>
          )}

          {order.paymentMethod === 'BANK_TRANSFER' && (order.paymentStatus === 'PROCESSING' || order.paymentStatus === 'COMPLETED') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Transfer Confirmed</h3>
                  <p className="text-sm text-gray-600">
                    {order.paymentStatus === 'COMPLETED'
                      ? 'Your payment has been confirmed. Your order is being processed.'
                      : 'Admin will verify your payment shortly.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
