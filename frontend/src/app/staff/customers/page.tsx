'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StaffCustomersPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-customers'],
    queryFn: async () => {
      const response = await fetch('/api/staff/customers', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
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

  const customers = data?.customers || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Loading customers...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Failed to load customers.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
         <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">Customers</h1>
            <p className="text-charcoal-light mt-1">Customers who ordered from your restaurant</p>
          </div>
          <Link href="/staff" className="btn-outline px-3 py-2 sm:px-4 rounded-lg text-sm">
            Back to Dashboard
          </Link>
        </div>

         <div className="bg-white rounded-lg border border-cream shadow-sm overflow-hidden">
          <table className="min-w-full text-left text-xs sm:text-sm text-charcoal-light">
            <thead className="bg-cream text-charcoal">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Name</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Email</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Phone</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Orders</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => (
                  <tr key={customer.id} className="border-t border-cream">
                    <td className="px-3 py-4 sm:px-6 font-medium text-charcoal">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{customer.email}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{customer.phone || '-'}</td>
                    <td className="px-3 py-4 sm:px-6 text-sm">{customer._count?.orders || 0}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
