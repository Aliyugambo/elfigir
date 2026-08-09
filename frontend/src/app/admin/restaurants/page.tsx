'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminRestaurant } from '@/services/admin.service';
import { toast } from 'sonner';

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    cuisineType: '',
    city: '',
    state: '',
    phone: '',
    address: '',
    deliveryFee: '',
    minDeliveryTime: '',
    maxDeliveryTime: '',
    isOpen: true,
    isActive: true,
  });

  const { data: restaurants, isLoading, refetch } = useQuery({
    queryKey: ['admin-restaurants'],
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
    setForm({
      name: '',
      slug: '',
      description: '',
      cuisineType: '',
      city: '',
      state: '',
      phone: '',
      address: '',
      deliveryFee: '',
      minDeliveryTime: '',
      maxDeliveryTime: '',
      isOpen: true,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (restaurant: AdminRestaurant) => {
    setEditingId(restaurant.id);
    setForm({
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description ?? '',
      cuisineType: restaurant.cuisineType.join(', '),
      city: restaurant.city,
      state: restaurant.state,
      phone: restaurant.phone,
      address: restaurant.address,
      deliveryFee: String(restaurant.deliveryFee),
      minDeliveryTime: String(restaurant.minDeliveryTime),
      maxDeliveryTime: String(restaurant.maxDeliveryTime),
      isOpen: restaurant.isOpen,
      isActive: restaurant.isActive,
    });
    setImagePreview(restaurant.banner ?? null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageIfSelected = async (): Promise<string | undefined> => {
    if (!imageFile) return undefined;
    setUploadingImage(true);
    try {
      const res = await adminService.uploadRestaurantImage(imageFile);
      return res.url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload image');
      return undefined;
    } finally {
      setUploadingImage(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Parameters<typeof adminService.createRestaurant>[0]) =>
      adminService.createRestaurant(data),
    onSuccess: () => {
      toast.success('Restaurant created');
      closeModal();
      refetch();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create restaurant'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.updateRestaurant>[1] }) =>
      adminService.updateRestaurant(id, data),
    onSuccess: () => {
      toast.success('Restaurant updated');
      closeModal();
      refetch();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update restaurant'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteRestaurant(id),
    onSuccess: () => {
      toast.success('Restaurant deleted');
      refetch();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete restaurant'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrl = await uploadImageIfSelected();
    if (imageFile && !imageUrl) return;

    const data = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      cuisineType: form.cuisineType.split(',').map((c) => c.trim()).filter(Boolean),
      city: form.city,
      state: form.state,
      phone: form.phone,
      address: form.address,
      deliveryFee: Number(form.deliveryFee),
      minDeliveryTime: Number(form.minDeliveryTime),
      maxDeliveryTime: Number(form.maxDeliveryTime),
      isOpen: form.isOpen,
      isActive: form.isActive,
      banner: imageUrl || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this restaurant permanently? This will also remove its menus and items.')) return;
    deleteMutation.mutate(id);
  };

  const restaurantList = restaurants || [];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
            <p className="text-gray-600 mt-1">Manage restaurants across the platform.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openCreate} className="btn-primary px-4 py-2 rounded-lg">
              + Add Restaurant
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

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">Cuisine</th>
                  <th className="px-6 py-4">Delivery Fee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(3)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-t border-gray-100">
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                      <td className="h-12 px-6 py-4 bg-gray-100" />
                    </tr>
                  ))
                ) : restaurantList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No restaurants found.
                    </td>
                  </tr>
                ) : (
                  restaurantList.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-4">{r.city}</td>
                      <td className="px-6 py-4">{r.cuisineType.slice(0, 2).join(', ')}</td>
                      <td className="px-6 py-4 font-semibold text-primary">₦{r.deliveryFee.toFixed(0)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="btn-secondary px-3 py-1 rounded-lg text-xs"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg text-xs border border-red-200">
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Restaurant' : 'Add Restaurant'}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input className="input-field w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                  <input className="input-field w-full" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. elfijr-kitchen-dine-in" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input className="input-field w-full" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea className="input-field w-full" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Types (comma separated)</label>
                  <input className="input-field w-full" value={form.cuisineType} onChange={(e) => setForm({ ...form, cuisineType: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input className="input-field w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input className="input-field w-full" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                <p className="text-xs text-gray-500 mt-1">Location coordinates will be generated automatically from this address.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input className="input-field w-full" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee (₦)</label>
                  <input type="number" className="input-field w-full" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Delivery Time (min)</label>
                  <input type="number" className="input-field w-full" value={form.minDeliveryTime} onChange={(e) => setForm({ ...form, minDeliveryTime: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Delivery Time (min)</label>
                  <input type="number" className="input-field w-full" value={form.maxDeliveryTime} onChange={(e) => setForm({ ...form, maxDeliveryTime: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input-field w-full"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border border-gray-200" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
                  Open for orders
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={closeModal} className="btn-outline px-4 py-2 rounded-lg" disabled={createMutation.isPending || updateMutation.isPending || uploadingImage}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-4 py-2 rounded-lg" disabled={createMutation.isPending || updateMutation.isPending || uploadingImage}>
                  {uploadingImage ? 'Uploading...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
