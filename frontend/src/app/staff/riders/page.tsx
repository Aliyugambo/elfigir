'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

export default function StaffRidersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-riders'],
    queryFn: async () => {
      const response = await fetch('/api/staff/riders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch riders');
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

  const riders = data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading riders...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Failed to load riders.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riders</h1>
            <p className="text-gray-600 mt-1">Manage riders for your restaurant</p>
          </div>
          <Link href="/staff" className="btn-outline px-4 py-2 rounded-lg">
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-left text-xs sm:text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Name</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Email</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Phone</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {riders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 sm:px-6 text-center text-gray-500">
                    No riders found.
                  </td>
                </tr>
              ) : (
                riders.map((rider: any) => (
                  <tr key={rider.id} className="border-t border-gray-100">
                    <td className="px-3 py-4 sm:px-6 font-medium text-gray-900">
                      {rider.firstName} {rider.lastName}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{rider.email}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{rider.phone || '-'}</td>
                    <td className="px-3 py-4 sm:px-6">
                      <span className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${rider.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {rider.isActive ? 'Active' : 'Pending'}
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
