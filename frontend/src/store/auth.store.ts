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
  hydrateFromToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        localStorage.removeItem('adminAccessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          adminAccessToken: null,
        });
      },
      setUser: (user) => set({ user }),
      hydrateFromToken: () => {
        const token = localStorage.getItem('accessToken');
        const stored = localStorage.getItem('auth-store');
        if (!token || !stored) {
          return;
        }
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.user) {
            set({
              user: parsed.state.user,
              accessToken: parsed.state.accessToken ?? token,
              isAuthenticated: true,
              adminAccessToken: parsed.state.adminAccessToken ?? null,
            });
          } else if (token) {
            set({ accessToken: token, isAuthenticated: true });
          }
        } catch {
          set({ accessToken: token, isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        adminAccessToken: state.adminAccessToken,
      }),
    },
  ),
);
