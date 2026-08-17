'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminUser, Role } from '@/services/admin.service';
import { toast } from 'sonner';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'CUSTOMER' as Role,
  password: '',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (userItem: AdminUser) => {
    setEditingId(userItem.id);
    setForm({
      firstName: userItem.firstName,
      lastName: userItem.lastName,
      email: userItem.email,
      phone: userItem.phone ?? '',
      role: userItem.role as Role,
      password: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateUser(editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          password: form.password || undefined,
        });
        toast.success('User updated');
      } else {
        toast.error('User creation should be done through signup or staff creation');
        return;
      }
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await adminService.updateUserStatus(id, { isActive: !isActive });
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
            <h1 className="text-3xl font-bold text-charcoal">User Management</h1>
            <p className="text-charcoal-light mt-1">Manage platform users, riders, chefs and customers.</p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              + Add User
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

        <div className="overflow-x-auto bg-white rounded-lg border border-cream shadow-sm">
          <table className="min-w-full text-left text-xs sm:text-sm text-charcoal-light">
            <thead className="bg-cream text-charcoal">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Name</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Email</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Role</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-t border-cream">
                    <td className="h-12 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="hidden sm:table-cell h-12 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="h-12 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="h-12 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="h-12 px-3 py-4 sm:px-6 bg-cream" />
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                    No users available.
                  </td>
                </tr>
              ) : (
                users.map((userItem: AdminUser) => (
                  <tr key={userItem.id} className="border-t border-cream">
                    <td className="px-3 py-4 sm:px-6 font-medium text-charcoal text-sm">{userItem.firstName} {userItem.lastName}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{userItem.email}</td>
                    <td className="px-3 py-4 sm:px-6 text-sm">{userItem.role}</td>
                    <td className="px-3 py-4 sm:px-6">
                      <span className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${userItem.isActive ? 'bg-mustard/10 text-maroon' : 'bg-primary/10 text-primary'}`}>
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4 sm:px-6 space-x-1 sm:space-x-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(userItem.id, userItem.isActive ?? false)}
                        className="btn-secondary px-1 py-1 sm:px-3 rounded-lg text-xs"
                      >
                        {userItem.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(userItem)}
                        className="btn-primary px-1 py-1 sm:px-3 rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(userItem.id)}
                         className="text-primary hover:text-primary-dark px-1 py-1 sm:px-3 rounded-lg text-xs border border-primary/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-charcoal mb-4">
              {editingId ? 'Edit User' : 'Add User'}
            </h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-field text-sm"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <input
                  className="input-field text-sm"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
              <input
                type="email"
                className="input-field text-sm"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="input-field text-sm"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <select
                className="input-field text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="RESTAURANT">Chef</option>
                <option value="DELIVERY">Rider</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input
                type="password"
                className="input-field text-sm"
                placeholder={editingId ? 'New password (optional)' : 'Password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={editingId ? undefined : 6}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-outline px-4 py-2 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-lg">
                  {editingId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
