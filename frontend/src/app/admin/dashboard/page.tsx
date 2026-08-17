'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, DashboardStats, StaffMember, AdminOrder } from '@/services/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, adminAccessToken, setAdminAuth, logout } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chefs, setChefs] = useState<StaffMember[]>([]);
  const [riders, setRiders] = useState<StaffMember[]>([]);
  const [tab, setTab] = useState<'CHEF' | 'DELIVERY'>('CHEF');
  const [loading, setLoading] = useState(true);
  const [pendingTransfers, setPendingTransfers] = useState<AdminOrder[]>([]);
  const [showTransfers, setShowTransfers] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.replace('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboard, chefList, riderList, transfers] = await Promise.all([
        adminService.getDashboard(),
        adminService.listStaff('RESTAURANT'),
        adminService.listStaff('DELIVERY'),
        adminService.listPendingTransfers(),
      ]);
      setStats(dashboard);
      setChefs(chefList);
      setRiders(riderList);
      setPendingTransfers(transfers.orders || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveStaff(id);
      toast.success('Staff approved');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await adminService.confirmPayment(orderId);
      toast.success('Payment confirmed. Rider will be notified.');
      loadData();
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm payment');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-charcoal-light">Loading...</div>;
  }

  const statCards = [
    { label: 'Customers', value: stats?.counts.customers },
    { label: 'Chefs', value: stats?.counts.chefs },
    { label: 'Riders', value: stats?.counts.riders },
    { label: 'Restaurants', value: stats?.counts.restaurants },
    { label: 'Orders', value: stats?.counts.orders },
  ];

  const activeList = tab === 'CHEF' ? chefs : riders;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Admin Dashboard</h1>
            <p className="text-charcoal-light">Welcome, {user?.firstName}</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/register" className="btn-primary px-4 py-2 rounded-lg">
              + New Admin
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="btn-outline px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-3 mb-8 md:grid-cols-3">
          <Link href="/admin/restaurants" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Create, update, and remove restaurants</p>
            <h2 className="text-lg font-semibold text-charcoal">Restaurants</h2>
          </Link>
          <Link href="/admin/menus" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Create, update, and remove menus</p>
            <h2 className="text-lg font-semibold text-charcoal">Menus</h2>
          </Link>
          <Link href="/admin/menu-items" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Create, update, and remove dishes</p>
            <h2 className="text-lg font-semibold text-charcoal">Menu Items</h2>
          </Link>
          <Link href="/admin/orders" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Manage orders</p>
            <h2 className="text-lg font-semibold text-charcoal">Orders</h2>
          </Link>
          <Link href="/admin/users" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Manage customers, riders & chefs</p>
            <h2 className="text-lg font-semibold text-charcoal">Users</h2>
          </Link>
          <Link href="/admin/staff" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">Create, update, and remove chefs and riders</p>
            <h2 className="text-lg font-semibold text-charcoal">Staff</h2>
          </Link>
          <Link href="/admin/notifications" className="card hover:border-primary transition">
            <p className="text-sm text-charcoal-light">View all system notifications</p>
            <h2 className="text-lg font-semibold text-charcoal">Notifications</h2>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((c) => (
            <div key={c.label} className="card">
              <p className="text-3xl font-bold text-primary">{c.value}</p>
              <p className="text-sm text-charcoal-light">{c.label}</p>
            </div>
          ))}
        </div>

        {stats && stats.pendingRiderApprovals > 0 && (
          <div className="bg-mustard/10 border border-mustard/30 rounded-lg p-4 mb-6 text-maroon">
            {stats.pendingRiderApprovals} rider(s) awaiting approval.
          </div>
        )}

        {pendingTransfers.length > 0 && (
          <div className="bg-cream border border-cream rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">
                Pending Bank Transfer Confirmations ({pendingTransfers.length})
              </h2>
              <button
                onClick={() => setShowTransfers(!showTransfers)}
                className="text-primary hover:text-primary-dark text-sm font-medium"
              >
                {showTransfers ? 'Hide' : 'Show'}
              </button>
            </div>
            {showTransfers && (
              <div className="mt-4 space-y-3">
                {pendingTransfers.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-charcoal">{order.orderNumber}</p>
                        <p className="text-sm text-charcoal-light">
                          {order.user?.firstName} {order.user?.lastName} - {order.restaurant?.name}
                        </p>
                        <p className="text-sm text-charcoal-light">Total: ₦{order.totalAmount.toFixed(0)}</p>
                      </div>
                      <button
                        onClick={() => handleConfirmPayment(order.id)}
                        className="btn-primary px-4 py-2 rounded-lg text-sm"
                      >
                        Confirm Transfer Received
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-cream overflow-hidden">
          <div className="flex border-b border-cream">
            <button
              onClick={() => setTab('CHEF')}
              className={`px-6 py-3 font-medium ${tab === 'CHEF' ? 'text-primary border-b-2 border-primary' : 'text-charcoal-light'}`}
            >
              Chefs ({chefs.length})
            </button>
            <button
              onClick={() => setTab('DELIVERY')}
              className={`px-6 py-3 font-medium ${tab === 'DELIVERY' ? 'text-primary border-b-2 border-primary' : 'text-charcoal-light'}`}
            >
              Riders ({riders.length})
            </button>
          </div>

          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-cream text-charcoal-light">
              <tr>
                <th className="text-left px-3 py-3 sm:px-6 sm:py-3">Name</th>
                <th className="text-left hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-3">Email</th>
                <th className="text-left px-3 py-3 sm:px-6 sm:py-3">Restaurant</th>
                <th className="text-left hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-3">Email Verified</th>
                <th className="text-left px-3 py-3 sm:px-6 sm:py-3">Status</th>
                <th className="text-right px-3 py-3 sm:px-6 sm:py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 sm:px-6 text-center text-charcoal-light">
                    No {tab === 'CHEF' ? 'chefs' : 'riders'} yet.
                  </td>
                </tr>
              )}
              {activeList.map((m) => (
                <tr key={m.id} className="border-t border-cream">
                  <td className="px-3 py-3 sm:px-6 text-sm">{m.firstName} {m.lastName}</td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6 text-sm text-charcoal-light">{m.email}</td>
                  <td className="px-3 py-3 sm:px-6 text-sm">{m.restaurant?.name ?? '-'}</td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6">
                     <span className={`px-2 py-1 rounded-full text-xs ${m.emailVerified ? 'bg-mustard/10 text-maroon' : 'bg-cream text-charcoal'}`}>
                      {m.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6">
                     <span className={`px-2 py-1 rounded-full text-xs ${m.isActive ? 'bg-mustard/10 text-maroon' : 'bg-mustard/20 text-mustard-dark'}`}>
                      {m.isActive ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 text-right">
                    {!m.isActive && (
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="btn-primary px-1 py-1 sm:px-3 rounded-lg text-xs"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
