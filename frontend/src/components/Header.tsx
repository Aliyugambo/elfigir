'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '@/logo.png';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminNotification } from '@/services/admin.service';
import { FaBell } from 'react-icons/fa';

function NotificationsBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminService.listNotifications(),
    refetchInterval: 30000,
  });

  const notifications: AdminNotification[] = data ?? [];
  const unread = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id: string) => {
    await adminService.markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-600 hover:text-primary transition"
        aria-label="Notifications"
      >
        <FaBell />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 max-h-96 overflow-y-auto z-50"
        >
          <p className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Alerts
          </p>
          {notifications.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500">No notifications.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${
                  n.isRead ? '' : 'bg-primary/5'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
              </button>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}

export function Header() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src={logo} alt="Elfigir" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold text-gray-900">Elfigir</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/restaurants" className="text-gray-600 hover:text-primary transition">
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/orders" className="text-gray-600 hover:text-primary transition">
                  Orders
                </Link>
                {user?.role === 'RESTAURANT' && (
                  <Link href="/chef" className="text-gray-600 hover:text-primary transition">
                    Chef
                  </Link>
                )}
                {user?.role === 'DELIVERY' && (
                  <Link href="/rider" className="text-gray-600 hover:text-primary transition">
                    Rider
                  </Link>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary transition">
                      Admin
                    </Link>
                    <NotificationsBell />
                  </>
                )}
                <Link href="/account" className="text-gray-600 hover:text-primary transition">
                  Account
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary transition">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
                <Link href="/admin/login" className="text-gray-400 hover:text-primary text-sm transition">
                  Admin
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-sm font-medium text-gray-700 hover:text-primary"
                >
                  {user?.firstName}
                </button>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
