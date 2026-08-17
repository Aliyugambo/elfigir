'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { orderService } from '@/services/order.service';
import { toast } from 'sonner';
import { FaArrowLeft, FaCheckCircle, FaMotorcycle } from 'react-icons/fa';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);

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
        <h1 className="text-3xl font-bold text-charcoal mb-4">Sign in to view order</h1>
        <p className="text-charcoal-light mb-8">You need to be logged in to view your order</p>
        <a href="/login" className="btn-primary">Sign In</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-charcoal-light">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-charcoal-light">
        Order not found.
      </div>
    );
  }

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    setIsConfirmingReceipt(true);
    try {
      await orderService.confirmReceived(orderId);
      toast.success('Order confirmed received! Thank you.');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setIsConfirmingReceipt(false);
    }
  };

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
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Order Details</h1>
            <p className="text-charcoal-light mt-1">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-lg border border-cream shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
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

          {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PENDING' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-charcoal mb-2">Bank Transfer Details</h3>
              <p className="text-sm text-charcoal-light">Bank: {order.restaurant?.bankName || 'GT BANK'}</p>
              <p className="text-sm text-charcoal-light">Account Name: {order.restaurant?.accountName || 'SQUAD ELFIJR KITCHEN LTD'}</p>
              <p className="text-sm text-charcoal-light">Account Number: {order.restaurant?.accountNumber || '5000530466'}</p>
              <p className="text-sm text-charcoal-light mt-2">Please transfer the exact amount to the account above.</p>
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
            <div className="bg-mustard/10 border border-mustard/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-6 h-6 text-maroon" />
                <div>
                  <h3 className="font-semibold text-charcoal">Transfer Confirmed</h3>
                  <p className="text-sm text-charcoal-light">
                    {order.paymentStatus === 'COMPLETED'
                      ? 'Your payment has been confirmed. Your order is being processed.'
                      : 'Admin will verify your payment shortly.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'DELIVERED' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaMotorcycle className="w-6 h-6 text-orange-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">
                    Order Delivered
                  </h3>
                  <p className="text-sm text-charcoal-light mt-1">
                    The rider marked your order as delivered. Please confirm
                    receipt to complete this order.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConfirmReceived}
                disabled={isConfirmingReceipt}
                className="mt-3 btn-primary py-2 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaCheckCircle />
                {isConfirmingReceipt ? 'Confirming...' : "I've Received My Order"}
              </button>
            </div>
          )}

          {order.status === 'COMPLETED' && (
            <div className="bg-mustard/10 border border-mustard/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FaCheckCircle className="w-6 h-6 text-maroon" />
                <div>
                  <h3 className="font-semibold text-charcoal">
                    Order Completed
                  </h3>
                  <p className="text-sm text-charcoal-light">
                    Thank you! This order is now fully complete.
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
