'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminService } from '@/services/admin.service';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminRegisterPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await adminService.registerAdmin(formData);
      toast.success(`Admin ${res.email} created`);
      router.push('/admin/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Restricted</h1>
          <p className="text-gray-600 mb-4">Only an existing admin can register new admins.</p>
          <Link href="/admin/login" className="btn-primary px-4 py-2 rounded-lg">
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Register New Admin</h1>
          <p className="text-gray-600 mt-1">Create an additional admin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">First Name</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} required className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} required className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field text-sm" />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Admin'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
