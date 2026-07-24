import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isMobileMenuOpen: boolean;
  isCartOpen: boolean;
  toggleMobileMenu: () => void;
  toggleCart: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isCartOpen: false,
      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      setCartOpen: (open) => set({ isCartOpen: open }),
    }),
    {
      name: 'ui-store',
    },
  ),
);
