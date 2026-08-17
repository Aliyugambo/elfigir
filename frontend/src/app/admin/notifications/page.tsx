'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminNotification } from '@/services/admin.service';
import { toast } from 'sonner';

const typeLabels: Record<string, string> = {
  payment_confirmation: 'Payment Confirmation',
  payment_confirmed: 'Payment Confirmed',
  payment_received: 'Payment Received',
  order_ready: 'Order Ready',
  order_approved: 'Order Approved',
  order_preparing: 'Preparation Started',
  order_out_for_delivery: 'Out for Delivery',
  order_update: 'Order Update',
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminService.listNotifications(),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const notifications: AdminNotification[] = data ?? [];

  const handleMarkRead = async (id: string) => {
    try {
      await adminService.markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => handleMarkRead(n.id));
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-cream rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-lg border border-cream"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Notifications</h1>
            <p className="text-charcoal-light mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-outline px-4 py-2 rounded-lg text-sm"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-cream p-8 text-center">
              <p className="text-charcoal-light">You have no notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  n.isRead
                    ? 'bg-white border-cream hover:bg-cream'
                    : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                }`}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-charcoal">{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                      )}
                      {typeLabels[n.type] && (
                        <span className="text-xs bg-cream text-charcoal-light px-2 py-0.5 rounded-full">
                          {typeLabels[n.type]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal-light mt-1">{n.message}</p>
                  </div>
                  <span className="text-xs text-charcoal-light">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
