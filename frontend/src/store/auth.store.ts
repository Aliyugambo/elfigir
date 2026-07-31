import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

type Role = 'CUSTOMER' | 'RESTAURANT' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | 'DELIVERY';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  adminAccessToken: string | null;
  setAuth: (user: Partial<User>, token: string) => void;
  setAdminAuth: (user: Partial<User>, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      adminAccessToken: null,
      setAuth: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user: user as User, accessToken: token, isAuthenticated: true });
      },
      setAdminAuth: (user, token) => {
        localStorage.setItem('accessToken', token);
        set({ user: user as User, accessToken: token, isAuthenticated: true, adminAccessToken: token });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          adminAccessToken: null,
        });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        adminAccessToken: state.adminAccessToken,
      }),
    },
  ),
);
