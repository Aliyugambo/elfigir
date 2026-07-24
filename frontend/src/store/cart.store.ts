import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, MenuItem, AddOn } from '@/types';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (menuItem: MenuItem, restaurantId: string, quantity?: number, addOns?: AddOn[], specialNote?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      addItem: (menuItem, restaurantId, quantity = 1, addOns = [], specialNote) => {
        const state = get();
        
        // If adding from different restaurant, clear cart
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({ items: [], restaurantId });
        }

        const existingItem = state.items.find((item) => item.menuItemId === menuItem.id);

        if (existingItem) {
          set({
            items: state.items.map((item) =>
              item.menuItemId === menuItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          });
        } else {
          const newItem: CartItem = {
            id: `${menuItem.id}-${Date.now()}`,
            menuItemId: menuItem.id,
            menuItem,
            quantity,
            addOns,
            specialNote,
          };

          set({
            items: [...state.items, newItem],
            restaurantId,
          });
        }
      },
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item,
          ),
        }));
      },
      clear: () => {
        set({ items: [], restaurantId: null });
      },
      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          const itemTotal = item.menuItem.price * item.quantity;
          const addOnsTotal = item.addOns.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
          return total + itemTotal + addOnsTotal;
        }, 0);
      },
    }),
    {
      name: 'cart-store',
    },
  ),
);
