'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart.store';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import Link from 'next/link';

export function CartSidebar() {
  const { items, removeItem, updateQuantity, clear, getSubtotal, restaurantId } = useCartStore();
  const subtotal = getSubtotal();
  const tax = subtotal * 0.005;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg border border-cream p-4 sm:p-6 text-center"
      >
        <FaShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-charcoal-light mx-auto mb-3" />
        <h3 className="font-semibold text-charcoal text-sm sm:text-base mb-1">Your cart is empty</h3>
        <p className="text-xs sm:text-sm text-charcoal-light">Add items to get started!</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg border border-cream overflow-hidden shadow-sm"
    >
      {/* Items */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-2.5 sm:p-3 border-b border-cream last:border-b-0"
            >
              <div className="flex items-start space-x-2 sm:space-x-3">
                <img
                  src={item.menuItem.image || 'https://via.placeholder.com/50'}
                  alt={item.menuItem.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-charcoal truncate">
                    {item.menuItem.name}
                  </h4>
                  <p className="text-xs sm:text-sm font-semibold text-primary">
                    ₦{(item.menuItem.price * item.quantity).toFixed(0)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-primary hover:text-primary-dark transition p-1"
                >
                  <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-md border border-cream flex items-center justify-center hover:bg-cream active:bg-cream"
                  >
                    <FaMinus className="w-2.5 h-2.5" />
                  </button>
                  <span className="font-semibold text-sm w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-md border border-cream flex items-center justify-center hover:bg-cream active:bg-cream"
                  >
                    <FaPlus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="p-3 sm:p-4 border-t border-cream space-y-2 bg-cream">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-charcoal-light">Subtotal</span>
          <span className="text-charcoal font-semibold">₦{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-charcoal-light">Tax (10%)</span>
          <span className="text-charcoal font-semibold">₦{tax.toFixed(0)}</span>
        </div>

        <div className="border-t border-cream pt-2 flex justify-between">
          <span className="font-semibold text-charcoal text-sm">Total</span>
          <span className="font-bold text-primary text-base sm:text-lg">₦{total.toFixed(0)}</span>
        </div>

        <Link
          href={restaurantId ? `/checkout?restaurantId=${restaurantId}` : '/'}
          className="block w-full btn-primary text-center py-2.5 sm:py-3 rounded-lg font-semibold text-sm"
        >
          Checkout
        </Link>

        <button
          onClick={clear}
          className="w-full btn-outline py-2 rounded-lg text-xs sm:text-sm font-medium"
        >
          Clear Cart
        </button>
      </div>
    </motion.div>
  );
}
