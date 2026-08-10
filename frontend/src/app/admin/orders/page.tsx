'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { OrderStatus } from '@/types';
import { toast } from 'sonner';

const orderStatusOptions: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<Record<string, OrderStatus>>({});

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.listOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    setSelectedStatus((prev) => ({ ...prev, [orderId]: status }));
  };

  const handleUpdateStatus = async (orderId: string) => {
    const status = selectedStatus[orderId];
    if (!status) {
      return toast.error('Select a status before updating');
    }

    try {
      await adminService.updateOrderStatus(orderId, { status });
      toast.success('Order status updated');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      await adminService.updateOrderStatus(orderId, { status: 'CONFIRMED' });
      toast.success('Order approved');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve order');
    }
  };

  const handleDeny = async (orderId: string) => {
    const reason = window.prompt('Reason for denying this order?');
    if (reason === null) return;
    try {
      await adminService.updateOrderStatus(orderId, {
        status: 'CANCELLED',
        cancelReason: reason || 'Denied by admin',
      });
      toast.success('Order denied');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deny order');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!window.confirm('Delete this order permanently?')) return;
    try {
      await adminService.deleteOrder(orderId);
      toast.success('Order deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await adminService.confirmPayment(orderId);
      toast.success('Payment confirmed. Rider will be notified.');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm payment');
    }
  };

  const orders = ordersData?.orders || [];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">View and control orders across the platform.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-28 rounded-lg bg-white animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-lg bg-white border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No orders found yet.</p>
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
                      <p className="text-xs sm:text-sm text-gray-500">Restaurant</p>
                      <p className="font-medium text-sm sm:text-base text-gray-900">{order.restaurant?.name}</p>
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

                  <div className="mt-6 grid gap-4 md:grid-cols-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
                        {order.status}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                      <select
                        value={selectedStatus[order.id] || order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="input-field w-full"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(order.id)}
                          className="btn-primary px-4 py-2 rounded-lg"
                        >
                          Approve
                        </button>
                      )}
                      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <button
                          type="button"
                          onClick={() => handleDeny(order.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                        >
                          Deny
                        </button>
                      )}
                      {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PROCESSING' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        >
                          Confirm Transfer Received
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id)}
                        className="btn-secondary px-4 py-2 rounded-lg"
                      >
                        Save Status
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="btn-outline px-4 py-2 rounded-lg"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-800 px-4 py-2 rounded-lg border border-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
