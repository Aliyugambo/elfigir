'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, AdminMenuItem, AdminMenu } from '@/services/admin.service';
import { toast } from 'sonner';

export default function AdminMenuItemsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const STANDARD_CATEGORIES = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Fast Food',
    'Pizza',
    'Burger',
    'Chinese',
    'Italian',
    'Nigerian',
    'Indian',
    'Japanese',
    'Mexican',
    'Seafood',
    'Vegetarian',
    'Vegan',
    'Salad',
    'Desserts',
    'Drinks',
    'Smoothies',
    'Coffee',
    'Tea',
    'Bakery',
    'Snacks',
    'Soup',
    'Grill',
    'Other',
  ];

  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formState, setFormState] = useState({
    menuId: '',
    name: '',
    description: '',
    image: '',
    price: '',
    category: '',
    isAvailable: true,
    prepTime: '',
  });

  const { data: itemsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-menu-items', selectedMenuId],
    queryFn: () => adminService.listMenuItems({ menuId: selectedMenuId || undefined }),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  const { data: menus } = useQuery({
    queryKey: ['admin-menus'],
    queryFn: () => adminService.listMenus(),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, user, router]);

  const menuItems: AdminMenuItem[] = itemsData || [];
  const menuList: AdminMenu[] = menus || [];

  const hasMenuItems = useMemo(() => menuItems.length > 0, [menuItems]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formState.image;
      if (imageFile) {
        setUploadingImage(true);
        const uploadResult = await adminService.uploadMenuItemImage(imageFile);
        imageUrl = uploadResult.url;
        setUploadingImage(false);
      }

      if (editingId) {
        await adminService.updateMenuItem(editingId, {
          menuId: formState.menuId,
          name: formState.name,
          description: formState.description,
          image: imageUrl,
          price: Number(formState.price),
          category: formState.category,
          isAvailable: formState.isAvailable,
          prepTime: formState.prepTime ? Number(formState.prepTime) : undefined,
        });
        toast.success('Menu item updated');
        setEditingId(null);
      } else {
        await adminService.createMenuItem({
          menuId: formState.menuId,
          name: formState.name,
          description: formState.description,
          image: imageUrl,
          price: Number(formState.price),
          category: formState.category,
          isAvailable: formState.isAvailable,
          prepTime: formState.prepTime ? Number(formState.prepTime) : undefined,
        });
        toast.success('Menu item created');
      }
      setFormState({
        menuId: '',
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isAvailable: true,
        prepTime: '',
      });
      setImageFile(null);
      setImagePreview(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingId ? 'Failed to update menu item' : 'Failed to create menu item'));
    }
  };

  const handleEdit = (item: AdminMenuItem) => {
    setEditingId(item.id);
    setFormState({
      menuId: item.menuId,
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category: item.category,
      image: item.image ?? '',
      isAvailable: item.isAvailable,
      prepTime: item.prepTime ? String(item.prepTime) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setFormState({
      menuId: '',
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      isAvailable: true,
      prepTime: '',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteMenuItem(id);
      toast.success('Menu item deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const getMenuLabel = (menuId: string) => {
    const menu = menuList.find((m) => m.id === menuId);
    if (!menu) return menuId;
    return `${menu.restaurant.name} - ${menu.name}`;
  };

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Item Management</h1>
            <p className="text-gray-600 mt-1">Create, update, or remove dishes from restaurant menus.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="btn-outline px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Menu Item</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Menu</label>
                <select
                  name="menuId"
                  value={formState.menuId}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                >
                  <option value="">Select a menu</option>
                  {menuList.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.restaurant.name} - {menu.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  name="description"
                  value={formState.description}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formState.price}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleChange}
                    required
                    className="input-field w-full"
                  >
                    <option value="">Select a category</option>
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="input-field w-full"
                  />
                  {(imagePreview || formState.image) && (
                    <img
                      src={imagePreview || formState.image}
                      alt="Preview"
                      className="mt-2 h-32 w-32 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  {uploadingImage && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    name="image"
                    value={formState.image}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Or paste image URL"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (mins)</label>
                  <input
                    type="number"
                    name="prepTime"
                    value={formState.prepTime}
                    onChange={handleChange}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="isAvailable"
                  type="checkbox"
                  name="isAvailable"
                  checked={formState.isAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="text-sm text-gray-700">
                  Available for order
                </label>
              </div>
              <button type="submit" className="btn-primary px-4 py-2 rounded-lg">
                {editingId ? 'Update Item' : 'Create Item'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-outline px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
                <p className="text-sm text-gray-500">Currently available items across the platform.</p>
              </div>
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="input-field w-auto text-sm"
              >
                <option value="">All Menus</option>
                {menuList.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.restaurant.name} - {menu.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
                ))
              ) : !hasMenuItems ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-gray-500">
                  No menu items found.
                </div>
              ) : (
                menuItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">₦{item.price.toFixed(0)}</p>
                        <p className="text-xs text-gray-400">{item.isAvailable ? 'Available' : 'Unavailable'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 items-center justify-between">
                      <p className="text-sm text-gray-600">Menu: {getMenuLabel(item.menuId)}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="btn-secondary px-3 py-2 rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="btn-secondary px-3 py-2 rounded-lg"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
