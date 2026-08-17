'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '@/logo.png';
import { useAuthStore } from '@/store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService, AdminNotification } from '@/services/admin.service';
import { FaBell, FaBars, FaTimes } from 'react-icons/fa';

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
        className="relative text-white hover:text-mustard transition"
        aria-label="Notifications"
      >
        <FaBell />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-80 bg-maroon-dark rounded-lg shadow-lg border border-maroon py-2 max-h-96 overflow-y-auto z-50"
        >
          <p className="px-4 py-2 text-sm font-semibold text-white border-b border-maroon">
            Alerts
          </p>
          {notifications.length === 0 ? (
            <p className="px-4 py-4 text-sm text-white/70">No notifications.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`block w-full text-left px-4 py-3 border-b border-maroon hover:bg-maroon/50 ${
                  n.isRead ? '' : 'bg-mustard/10'
                }`}
              >
                <p className="text-sm font-medium text-white">{n.title}</p>
                <p className="text-xs text-white/70 mt-0.5">{n.message}</p>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-maroon border-b border-maroon-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
            <Image src={logo} alt="Elfijr" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold text-white">Elfijr Kitchen</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/browse" className="text-white/80 hover:text-mustard transition">
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/orders" className="text-white/80 hover:text-mustard transition">
                  Orders
                </Link>
                {user?.role === 'RESTAURANT' && (
                  <Link href="/chef" className="text-white/80 hover:text-mustard transition">
                    Chef
                  </Link>
                )}
                {user?.role === 'DELIVERY' && (
                  <Link href="/rider" className="text-white/80 hover:text-mustard transition">
                    Rider
                  </Link>
                )}
                {user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN' ? (
                  <Link href="/staff" className="text-white/80 hover:text-mustard transition">
                    Manager
                  </Link>
                ) : null}
                {user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin/dashboard" className="text-white/80 hover:text-mustard transition">
                      Admin
                    </Link>
                    <NotificationsBell />
                  </>
                )}
                <Link href="/account" className="text-white/80 hover:text-mustard transition">
                  Account
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-mustard p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
          </button>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="text-white/80 hover:text-mustard transition">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-sm font-medium text-white hover:text-mustard"
                >
                  {user?.firstName}
                </button>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-maroon-dark rounded-lg shadow-lg border border-maroon py-2"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-white hover:bg-maroon"
                    >
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-white hover:bg-maroon"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                       className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-maroon"
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-maroon-dark bg-maroon overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <Link href="/browse" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                Browse
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/orders" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                    Orders
                  </Link>
                  {user?.role === 'RESTAURANT' && (
                    <Link href="/chef" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                      Chef
                    </Link>
                  )}
                  {user?.role === 'DELIVERY' && (
                    <Link href="/rider" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                      Rider
                    </Link>
                  )}
                  {(user?.role === 'STAFF' || user?.role === 'SUPER_ADMIN') && (
                    <Link href="/staff" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                      Manager
                    </Link>
                  )}
                  {user?.role === 'ADMIN' && (
                    <>
                      <Link href="/admin/dashboard" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                        Admin
                      </Link>
                      <div className="px-4 py-3">
                        <NotificationsBell />
                      </div>
                    </>
                  )}
                  <Link href="/account" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition" onClick={closeMobileMenu}>
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                     className="block w-full text-left px-4 py-3 text-white/80 hover:text-white hover:bg-maroon-dark rounded-lg transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-2">
                  <Link href="/login" className="btn-outline text-center py-3 rounded-lg" onClick={closeMobileMenu}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn-primary text-center py-3 rounded-lg" onClick={closeMobileMenu}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
