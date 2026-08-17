'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { adminService, StaffMember, StaffRole } from '@/services/admin.service';
import { toast } from 'sonner';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'RESTAURANT' as StaffRole,
  restaurantId: '',
};

export default function AdminStaffPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<StaffRole>('RESTAURANT');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: staff, isLoading, refetch } = useQuery({
    queryKey: ['admin-staff', tab],
    queryFn: () => adminService.listStaff(tab),
    enabled: isAuthenticated && user?.role === 'ADMIN',
    retry: false,
  });

  const { data: restaurants } = useQuery({
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

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, role: tab });
    setIsModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone ?? '',
      password: '',
      role: member.role,
      restaurantId: member.restaurantId ?? '',
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
        await adminService.updateStaff(editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          restaurantId: form.restaurantId || undefined,
          password: form.password || undefined,
        });
        toast.success('Staff updated');
      } else {
        await adminService.createStaff({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
          restaurantId: form.restaurantId || undefined,
        });
        toast.success('Staff created (pending approval)');
      }
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveStaff(id);
      toast.success('Staff approved');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await adminService.deleteStaff(id);
      toast.success('Staff deleted');
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete staff');
    }
  };

  const members: StaffMember[] = staff ?? [];
  const tabLabel = tab === 'RESTAURANT' ? 'Chefs' : 'Riders';

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Staff Management</h1>
            <p className="text-charcoal-light mt-1">Manage chefs and delivery riders.</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={openCreate} className="btn-primary px-4 py-2 rounded-lg">
              + Add {tab === 'RESTAURANT' ? 'Chef' : 'Rider'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="btn-outline px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="flex border-b border-cream mb-6">
          {(['RESTAURANT', 'DELIVERY'] as StaffRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setTab(role)}
              className={`px-6 py-3 font-medium ${
                tab === role ? 'text-primary border-b-2 border-primary' : 'text-charcoal-light'
              }`}
            >
              {role === 'RESTAURANT' ? 'Chefs' : 'Riders'}
            </button>
          ))}
        </div>

         <div className="overflow-x-auto bg-white rounded-lg border border-cream shadow-sm">
          <table className="min-w-full text-left text-xs sm:text-sm text-charcoal-light">
            <thead className="bg-cream text-charcoal">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Name</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Email</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Phone</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">Restaurant</th>
                <th className="hidden md:table-cell px-3 py-3 sm:px-6 sm:py-4">Email Verified</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-t border-cream">
                    <td className="h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="hidden sm:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="hidden sm:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="hidden sm:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="hidden md:table-cell h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="h-10 px-3 py-4 sm:px-6 bg-cream" />
                    <td className="h-10 px-3 py-4 sm:px-6 bg-cream" />
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                    No {tabLabel.toLowerCase()} yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t border-cream">
                    <td className="px-3 py-4 sm:px-6 font-medium text-charcoal text-sm">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{member.email}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{member.phone ?? '-'}</td>
                    <td className="hidden sm:table-cell px-3 py-4 sm:px-6 text-sm">{member.restaurant?.name ?? '-'}</td>
                    <td className="hidden md:table-cell px-3 py-4 sm:px-6">
                       <span
                         className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                           member.emailVerified
                             ? 'bg-mustard/10 text-maroon'
                             : 'bg-cream text-charcoal'
                         }`}
                       >
                        {member.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-3 py-4 sm:px-6">
                       <span
                         className={`inline-flex rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
                           member.isActive ? 'bg-mustard/10 text-maroon' : 'bg-mustard/20 text-mustard-dark'
                         }`}
                       >
                        {member.isActive ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-4 sm:px-6 space-x-1 sm:space-x-2 text-right">
                      {!member.isActive && (
                        <button
                          onClick={() => handleApprove(member.id)}
                          className="btn-primary px-1 py-1 sm:px-3 rounded-lg text-xs"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(member)}
                        className="btn-secondary px-1 py-1 sm:px-3 rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
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
              {editingId ? 'Edit' : 'Add'} {tabLabel.slice(0, -1)}
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
              <input
                type="password"
                className="input-field text-sm"
                placeholder={editingId ? 'New password (optional)' : 'Password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                minLength={editingId ? undefined : 6}
              />
              <select
                className="input-field text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              >
                <option value="RESTAURANT">Chef</option>
                <option value="DELIVERY">Rider</option>
              </select>
              {form.role === 'RESTAURANT' && (
                <select
                  className="input-field text-sm"
                  value={form.restaurantId}
                  onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
                  required
                >
                  <option value="">Select a restaurant</option>
                  {restaurants?.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              )}
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
