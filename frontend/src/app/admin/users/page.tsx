'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminUser } from '@/services/admin.service';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [statusUpdate, setStatusUpdate] = useState<Record<string, boolean>>({});

  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.listUsers({ page: 1, limit: 50 }),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const handleToggleStatus = (id: string, isActive: boolean) => {
    setStatusUpdate((prev) => ({ ...prev, [id]: !isActive }));
  };

  const handleSaveStatus = async (id: string, isActive: boolean) => {
    try {
      await adminService.updateUserStatus(id, { isActive: statusUpdate[id] ?? isActive });
      toast.success('User status updated');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update user status');
    }
  };

  const users = usersData?.users || [];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage platform users, riders, chefs and customers.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-t border-gray-100">
                    <td className="h-12 px-6 py-4 bg-gray-100" />
                    <td className="h-12 px-6 py-4 bg-gray-100" />
                    <td className="h-12 px-6 py-4 bg-gray-100" />
                    <td className="h-12 px-6 py-4 bg-gray-100" />
                    <td className="h-12 px-6 py-4 bg-gray-100" />
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No users available.
                  </td>
                </tr>
              ) : (
                users.map((userItem: AdminUser) => {
                  const currentStatus = statusUpdate[userItem.id] ?? userItem.isActive;
                  return (
                    <tr key={userItem.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-medium text-gray-900">{userItem.firstName} {userItem.lastName}</td>
                      <td className="px-6 py-4">{userItem.email}</td>
                      <td className="px-6 py-4">{userItem.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${currentStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {currentStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(userItem.id, userItem.isActive ?? false)}
                          className="btn-secondary px-3 py-1 rounded-lg"
                        >
                          {currentStatus ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveStatus(userItem.id, userItem.isActive ?? false)}
                          className="btn-primary px-3 py-1 rounded-lg"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
