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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome, {user?.firstName}</p>
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
            <p className="text-sm text-gray-600">Create, update, and remove restaurants</p>
            <h2 className="text-lg font-semibold text-gray-900">Restaurants</h2>
          </Link>
          <Link href="/admin/menus" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Create, update, and remove menus</p>
            <h2 className="text-lg font-semibold text-gray-900">Menus</h2>
          </Link>
          <Link href="/admin/menu-items" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Create, update, and remove dishes</p>
            <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
          </Link>
          <Link href="/admin/orders" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Manage orders</p>
            <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          </Link>
          <Link href="/admin/users" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Manage customers, riders & chefs</p>
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          </Link>
          <Link href="/admin/staff" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Create, update, and remove chefs and riders</p>
            <h2 className="text-lg font-semibold text-gray-900">Staff</h2>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((c) => (
            <div key={c.label} className="card">
              <p className="text-3xl font-bold text-primary">{c.value}</p>
              <p className="text-sm text-gray-600">{c.label}</p>
            </div>
          ))}
        </div>

        {stats && stats.pendingRiderApprovals > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-800">
            {stats.pendingRiderApprovals} rider(s) awaiting approval.
          </div>
        )}

        {pendingTransfers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-blue-900">
                Pending Bank Transfer Confirmations ({pendingTransfers.length})
              </h2>
              <button
                onClick={() => setShowTransfers(!showTransfers)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.user?.firstName} {order.user?.lastName} - {order.restaurant?.name}
                        </p>
                        <p className="text-sm text-gray-500">Total: ₦{order.totalAmount.toFixed(0)}</p>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('CHEF')}
              className={`px-6 py-3 font-medium ${tab === 'CHEF' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            >
              Chefs ({chefs.length})
            </button>
            <button
              onClick={() => setTab('DELIVERY')}
              className={`px-6 py-3 font-medium ${tab === 'DELIVERY' ? 'text-primary border-b-2 border-primary' : 'text-gray-600'}`}
            >
              Riders ({riders.length})
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Restaurant</th>
                <th className="text-left px-6 py-3">Email Verified</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No {tab === 'CHEF' ? 'chefs' : 'riders'} yet.
                  </td>
                </tr>
              )}
              {activeList.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">{m.firstName} {m.lastName}</td>
                  <td className="px-6 py-3 text-gray-600">{m.email}</td>
                  <td className="px-6 py-3">{m.restaurant?.name ?? '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${m.emailVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {m.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {m.isActive ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {!m.isActive && (
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="btn-primary px-3 py-1 rounded-lg text-xs"
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
