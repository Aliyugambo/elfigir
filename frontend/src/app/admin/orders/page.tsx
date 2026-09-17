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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminService.listOrders({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
    refetchInterval: 3000,
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

  const filteredOrders = orders.filter((order: any) => {
    const created = new Date(order.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && created < start) return false;
    if (end) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      if (created > endOfDay) return false;
    }

    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
  const totalCompletedRevenue = filteredOrders.reduce((sum: number, order: any) => {
    const isCompleted = ['DELIVERED', 'COMPLETED'].includes(order.status);
    return sum + (isCompleted ? Number(order.totalAmount || 0) : 0);
  }, 0);
  const paymentBreakdown = filteredOrders.reduce((acc: Record<string, number>, order: any) => {
    const key = order.paymentMethod || 'N/A';
    acc[key] = (acc[key] || 0) + Number(order.totalAmount || 0);
    return acc;
  }, {});

  const handleDownloadOrders = async () => {
    try {
      if (filteredOrders.length === 0) {
        toast.error('No orders found for the selected date range');
        return;
      }

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);

      const doc = new jsPDF();
      const rows = filteredOrders;

      doc.setFillColor(246, 245, 240);
      doc.rect(0, 0, 210, 56, 'F');
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Elfigir Accounting Report', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Date Range: ${startDate || 'All time'} to ${endDate || 'Current'}`, 14, 34);
      doc.text(`Total Orders: ${rows.length}`, 14, 40);
      doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 14, 46);

      const summaryY = 62;
      doc.setFontSize(12);
      doc.text('Summary', 14, summaryY);
      doc.setFontSize(10);
      doc.text(`Completed Revenue: ₦${totalCompletedRevenue.toLocaleString()}`, 14, summaryY + 10);

      const paymentEntries = Object.entries(paymentBreakdown);
      let paymentY = summaryY + 20;
      paymentEntries.forEach(([method, value]) => {
        doc.text(`${method}: ₦${Number(value).toLocaleString()}`, 14, paymentY);
        paymentY += 8;
      });

      const tableRows = rows.map((order: any) => [
        order.orderNumber,
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim(),
        order.restaurant?.name || '',
        new Date(order.createdAt).toLocaleDateString(),
        order.status,
        order.paymentStatus,
        order.paymentMethod,
        `₦${Number(order.totalAmount || 0).toLocaleString()}`,
      ]);

      const finalY = paymentY + 12;
      autoTable(doc, {
        head: [['Order Number', 'Customer', 'Restaurant', 'Date', 'Status', 'Payment Status', 'Payment Method', 'Total Amount']],
        body: tableRows,
        startY: finalY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [17, 24, 39] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      doc.save('elfigir-accounting-report.pdf');
      toast.success('Accounting PDF downloaded');
    } catch (err: any) {
      console.error('Export PDF failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to export orders');
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Order Management</h1>
            <p className="text-charcoal-light mt-1">View and control orders across the platform.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadOrders}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              Download Orders PDF
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="btn-outline px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="mb-6 bg-white rounded-lg border border-cream p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="btn-outline px-4 py-2 rounded-lg"
            >
              Clear Dates
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="card">
            <p className="text-sm text-charcoal-light">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">₦{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-charcoal-light">Orders in Range</p>
            <p className="text-2xl font-bold text-primary">{filteredOrders.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-charcoal-light">Completed Revenue</p>
            <p className="text-2xl font-bold text-primary">₦{totalCompletedRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-28 rounded-lg bg-white animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-lg bg-white border border-cream p-8 text-center">
              <p className="text-charcoal-light">No orders found for the selected date range.</p>
            </div>
          ) : (
            <div className="space-y-4">
               {filteredOrders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-lg border border-cream p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-charcoal-light">Order</p>
                      <p className="font-semibold text-sm sm:text-base text-charcoal">{order.orderNumber}</p>
                      <p className="text-xs sm:text-sm text-charcoal-light mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-charcoal-light">Restaurant</p>
                      <p className="font-medium text-sm sm:text-base text-charcoal">{order.restaurant?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-charcoal-light">Customer</p>
                      <p className="font-medium text-sm sm:text-base text-charcoal">{order.user?.firstName} {order.user?.lastName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-charcoal-light">Total</p>
                      <p className="font-semibold text-primary">₦{order.totalAmount.toFixed(0)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3 items-end">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Current Status</label>
                      <span className="inline-flex items-center rounded-full bg-cream px-3 py-1 text-sm font-semibold text-charcoal">
                        {order.status}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Update Status</label>
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
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
                        >
                          Deny
                        </button>
                      )}
                      {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'PROCESSING' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(order.id)}
                          className="bg-maroon hover:bg-maroon-dark text-white px-4 py-2 rounded-lg"
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
                         className="text-primary hover:text-primary-dark px-4 py-2 rounded-lg border border-primary/20"
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
