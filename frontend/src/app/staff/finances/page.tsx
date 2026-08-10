'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

type Period = 'week' | 'month' | 'year';

export default function StaffFinancesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-finances', period],
    queryFn: async () => {
      const response = await fetch(`/api/staff/finances?period=${period}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch finances');
      return response.json();
    },
    enabled: isAuthenticated && (user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN'),
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading finances...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Failed to load finances.
      </div>
    );
  }

  const stats = data;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
            <p className="text-gray-600 mt-1">Financial overview for your restaurant</p>
          </div>
          <Link href="/staff" className="btn-outline px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  period === p ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="grid gap-4 mb-8 md:grid-cols-3">
            <div className="card">
              <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">₦{stats.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="card">
              <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalOrders}</p>
            </div>
            <div className="card">
              <p className="text-xs sm:text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
          </div>
        )}

        {stats && (
         <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">₦{stats.breakdown.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold text-gray-900">₦{stats.breakdown.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold text-gray-900">₦{stats.breakdown.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-primary text-xl">₦{stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
