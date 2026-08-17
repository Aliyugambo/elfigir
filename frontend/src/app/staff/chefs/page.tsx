'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StaffChefsPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-chefs'],
    queryFn: async () => {
      const response = await fetch('/api/staff/chefs', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch chefs');
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

  const chefs = data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Loading chefs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal-light">
        Failed to load chefs.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Chefs</h1>
            <p className="text-charcoal-light mt-1">Manage chefs for your restaurant</p>
          </div>
          <Link href="/staff" className="btn-outline px-4 py-2 rounded-lg">
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
                <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {chefs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                    No chefs found.
                  </td>
                </tr>
              ) : (
                chefs.map((chef: any) => (
                  <tr key={chef.id} className="border-t border-cream">
                    <td className="px-3 py-4 sm:px-6 font-medium text-charcoal">
                      {chef.firstName} {chef.lastName}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{chef.email}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{chef.phone || '-'}</td>
                    <td className="px-3 py-4 sm:px-6">
                      <span className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${chef.isActive ? 'bg-mustard/10 text-maroon' : 'bg-mustard/20 text-mustard-dark'}`}>
                        {chef.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
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
