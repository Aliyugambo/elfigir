'use client';

import { motion } from 'framer-motion';
import { MenuItem, AddOn } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
}

export function MenuItemCard({ item, restaurantId }: MenuItemCardProps) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  const handleAddToCart = () => {
    addItem(item, restaurantId, quantity, [], '');
    setShowDetails(false);
    setQuantity(1);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={item.image || 'https://via.placeholder.com/200x200'}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-110 transition duration-300"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Unavailable</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-primary text-lg">₦{item.price.toFixed(0)}</span>
            {item.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₦{item.originalPrice.toFixed(0)}
              </span>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDetails(!showDetails)}
            className="btn-primary text-sm py-1 px-3"
          >
            Add
          </motion.button>
        </div>

        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 space-y-3"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                <FaMinus className="w-4 h-4" />
              </button>
              <span className="font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                <FaPlus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full btn-primary text-sm"
              disabled={!item.isAvailable}
            >
              Add to Cart (₦{(item.price * quantity).toFixed(0)})
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
