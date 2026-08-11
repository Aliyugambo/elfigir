'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { FaClock, FaUsers, FaMoneyBillWave, FaTruck, FaUser } from 'react-icons/fa';

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeChefs: number;
  activeRiders: number;
  totalCustomers: number;
  restaurantId: string;
};

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/staff/dashboard', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return response.json();
    },
    enabled: isAuthenticated && (user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN'),
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
      return;
    }
    if (data) setStats(data);
  }, [isAuthenticated, user, router, data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Failed to load dashboard.
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: FaClock, href: '/staff/orders' },
    { label: 'Revenue', value: `₦${stats.totalRevenue.toFixed(0)}`, icon: FaMoneyBillWave, href: '/staff/finances' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: FaClock, href: '/staff/orders' },
    { label: 'Active Chefs', value: stats.activeChefs, icon: FaUser, href: '/staff/chefs' },
    { label: 'Active Riders', value: stats.activeRiders, icon: FaTruck, href: '/staff/riders' },
    { label: 'Customers', value: stats.totalCustomers, icon: FaUsers, href: '/staff/customers' },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.firstName}</p>
        </div>

        <div className="grid gap-4 mb-8 md:grid-cols-3">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href} className="card hover:border-primary transition">
              <card.icon className="w-8 h-8 text-primary mb-2" />
              <p className="text-3xl font-bold text-primary">{card.value}</p>
              <p className="text-sm text-gray-600">{card.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-3 mb-8 md:grid-cols-2">
          <Link href="/staff/orders" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">View and manage orders</p>
            <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          </Link>
          <Link href="/staff/finances" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Revenue and financial reports</p>
            <h2 className="text-lg font-semibold text-gray-900">Finances</h2>
          </Link>
          <Link href="/staff/chefs" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Manage chefs</p>
            <h2 className="text-lg font-semibold text-gray-900">Chefs</h2>
          </Link>
          <Link href="/staff/riders" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">Manage riders</p>
            <h2 className="text-lg font-semibold text-gray-900">Riders</h2>
          </Link>
          <Link href="/staff/customers" className="card hover:border-primary transition">
            <p className="text-sm text-gray-600">View customer orders</p>
            <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
