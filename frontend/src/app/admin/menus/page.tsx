'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminMenu, AdminRestaurant } from '@/services/admin.service';
import { toast } from 'sonner';

export default function AdminMenusPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    restaurantId: '',
    name: '',
    description: '',
  });

  const { data: menus, isLoading: menusLoading, refetch: refetchMenus } = useQuery({
    queryKey: ['admin-menus'],
    queryFn: () => adminService.listMenus(),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  const { data: restaurants } = useQuery({
    queryKey: ['admin-restaurants-list'],
    queryFn: () => adminService.listRestaurants(),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const resetForm = () => {
    setForm({ restaurantId: '', name: '', description: '' });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (menu: AdminMenu) => {
    setEditingId(menu.id);
    setForm({
      restaurantId: menu.restaurant.id,
      name: menu.name,
      description: menu.description ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminService.createMenu>[0]) =>
      adminService.createMenu(data),
    onSuccess: () => {
      toast.success('Menu created');
      closeModal();
      refetchMenus();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create menu'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.updateMenu>[1] }) =>
      adminService.updateMenu(id, data),
    onSuccess: () => {
      toast.success('Menu updated');
      closeModal();
      refetchMenus();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update menu'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteMenu(id),
    onSuccess: () => {
      toast.success('Menu deleted');
      refetchMenus();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete menu'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      restaurantId: form.restaurantId,
      name: form.name,
      description: form.description || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this menu? This will also remove its menu items.')) return;
    deleteMutation.mutate(id);
  };

  const menuList = menus || [];
  const restaurantList = restaurants || [];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Menus</h1>
            <p className="text-charcoal-light mt-1">Manage menus for each restaurant.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openCreate} className="btn-primary px-4 py-2 rounded-lg">
              + Add Menu
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

        <div className="bg-white rounded-lg border border-cream shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm text-charcoal-light">
              <thead className="bg-cream text-charcoal">
                <tr>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Name</th>
                  <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Restaurant</th>
                  <th className="hidden md:table-cell px-3 py-3 sm:px-6 sm:py-4">Description</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menusLoading ? (
                  [...Array(3)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-t border-cream">
                      <td className="h-10 px-3 py-4 sm:px-6 bg-cream" />
                      <td className="hidden sm:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                      <td className="hidden md:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                      <td className="h-10 px-3 py-4 sm:px-6 bg-cream" />
                    </tr>
                  ))
                ) : menuList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                      No menus found.
                    </td>
                  </tr>
                ) : (
                  menuList.map((m) => (
                    <tr key={m.id} className="border-t border-cream hover:bg-cream">
                      <td className="px-3 py-4 sm:px-6 font-medium text-charcoal text-sm">{m.name}</td>
                      <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{m.restaurant.name}</td>
                      <td className="hidden md:table-cell px-3 py-4 sm:px-6 text-sm">{m.description || '-'}</td>
                      <td className="px-3 py-4 sm:px-6 space-x-1 sm:space-x-2 text-right">
                        <button
                          onClick={() => openEdit(m)}
                          className="btn-secondary px-1 py-1 sm:px-3 rounded-lg text-xs"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="text-primary hover:text-primary-dark px-1 py-1 sm:px-3 rounded-lg text-xs border border-primary/20">
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-charcoal mb-4">
              {editingId ? 'Edit Menu' : 'Add Menu'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Restaurant</label>
                <select
                  className="input-field w-full"
                  value={form.restaurantId}
                  onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
                  disabled={!!editingId}
                  required
                >
                  <option value="">Select a restaurant</option>
                  {restaurantList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Name</label>
                <input className="input-field w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
                <textarea className="input-field w-full" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeModal} className="btn-outline px-4 py-2 rounded-lg" disabled={createMutation.isPending || updateMutation.isPending}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-lg" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
