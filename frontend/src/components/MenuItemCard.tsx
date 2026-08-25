'use client';

import { motion } from 'framer-motion';
import { MenuItem, AddOn } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
}

export function MenuItemCard({ item, restaurantId }: MenuItemCardProps) {
  const { addItem } = useCartStore();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = () => {
    addItem(item, restaurantId, quantity, [], '');
    setShowDetails(false);
    setQuantity(1);
    router.push(`/checkout?restaurantId=${restaurantId}`);
  };

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white rounded-xl border border-cream overflow-hidden shadow-sm hover:shadow-md transition active:scale-[0.98]"
    >
      <div className="relative h-36 sm:h-44 bg-cream overflow-hidden">
        <img
          src={item.image || 'https://via.placeholder.com/400x300'}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Unavailable</span>
          </div>
        )}
        {item.originalPrice && item.isAvailable && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full">
            SALE
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm sm:text-base text-charcoal leading-tight line-clamp-1">{item.name}</h3>
          {item.prepTime && (
            <span className="text-[10px] sm:text-xs text-charcoal-light bg-cream px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
              {item.prepTime}m
            </span>
          )}
        </div>

        <p className="text-[10px] sm:text-xs text-charcoal-light mb-1.5">{item.category}</p>

        {item.description && (
          <p className="text-xs text-charcoal-light line-clamp-2 mb-2 sm:mb-3 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline space-x-1.5 flex-shrink-0">
            <span className="font-bold text-primary text-sm sm:text-base">₦{item.price.toFixed(0)}</span>
            {item.originalPrice && (
              <span className="text-xs text-charcoal-light line-through">₦{item.originalPrice.toFixed(0)}</span>
            )}
          </div>

          {!showDetails ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDetails(true)}
              disabled={!item.isAvailable}
              className="bg-primary text-white rounded-lg p-2 sm:p-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FaShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-cream flex items-center justify-center hover:bg-cream active:bg-cream"
              >
                <FaMinus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <span className="font-semibold text-sm w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-cream flex items-center justify-center hover:bg-cream active:bg-cream"
              >
                <FaPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
              <button
                onClick={handleAddToCart}
                className="bg-primary text-white rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold whitespace-nowrap"
              >
                Add
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
