'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart.store';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import { useState } from 'react';

function CartContent() {
  const { items, removeItem, updateQuantity, clear, getSubtotal, restaurantId } = useCartStore();
  const subtotal = getSubtotal();
  const tax = subtotal * 0.1;
  const deliveryFee = 2.5;
  const total = subtotal + tax + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-cream p-4 sm:p-6 text-center h-full flex flex-col items-center justify-center">
        <FaShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 text-charcoal-light mx-auto mb-3" />
        <h3 className="font-semibold text-charcoal text-sm sm:text-base mb-1">Your cart is empty</h3>
        <p className="text-xs sm:text-sm text-charcoal-light">Add items to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-cream overflow-hidden shadow-sm h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
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

      <div className="p-3 sm:p-4 border-t border-cream space-y-2 bg-cream">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-charcoal-light">Subtotal</span>
          <span className="text-charcoal font-semibold">₦{subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-charcoal-light">Tax (10%)</span>
          <span className="text-charcoal font-semibold">₦{tax.toFixed(0)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-charcoal-light">Delivery</span>
          <span className="text-charcoal font-semibold">₦{deliveryFee.toFixed(0)}</span>
        </div>

        <div className="border-t border-cream pt-2 flex justify-between">
          <span className="font-semibold text-charcoal text-sm">Total</span>
          <span className="font-bold text-primary text-base sm:text-lg">₦{total.toFixed(0)}</span>
        </div>

        <Link
          href={restaurantId ? `/checkout?restaurantId=${restaurantId}` : '/'}
          className="block w-full bg-maroon text-white text-center py-2.5 sm:py-3 rounded-lg font-semibold text-sm hover:bg-maroon/90 transition"
        >
          Checkout
        </Link>

        <button
          onClick={clear}
          className="w-full border border-cream text-charcoal py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-cream transition"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      <div className="hidden lg:block fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 xl:w-96 bg-cream border-l border-cream z-40 overflow-y-auto">
        <div className="p-3 sm:p-4 h-full">
          <CartContent />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-cream flex items-center justify-between">
                <h3 className="font-bold text-base sm:text-lg">Your Cart</h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-cream rounded-full"
                >
                  <FaChevronDown className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <CartContent />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
