'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { Restaurant } from '@/types';
import { FaStar, FaClock, FaTruck } from 'react-icons/fa';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [open, setOpen] = useState(false);
  const banner = restaurant.banner || 'https://via.placeholder.com/300x200';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl overflow-hidden border border-cream shadow-sm hover:shadow-md transition active:scale-[0.98]"
    >
      <Link href={`/restaurant/${restaurant.slug}`}>
        <div className="relative h-32 sm:h-44 bg-cream overflow-hidden">
          <img
            src={banner}
            alt={restaurant.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
              <span className="text-white font-semibold text-sm">Closed</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-charcoal truncate mb-0.5">{restaurant.name}</h3>
          <p className="text-xs text-charcoal-light mb-1.5 line-clamp-1">
            {restaurant.cuisineType.slice(0, 2).join(', ')}
          </p>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <FaStar className="text-mustard w-3 h-3" />
                <span className="font-semibold text-charcoal">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-charcoal-light">
                <FaClock className="w-3 h-3" />
                <span className="truncate">{restaurant.minDeliveryTime}-{restaurant.maxDeliveryTime}m</span>
              </div>
            </div>
            <div className="text-charcoal-light font-medium">
              ₦{restaurant.deliveryFee.toFixed(0)}
            </div>
          </div>
        </div>
      </Link>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <img
            src={banner}
            alt={restaurant.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
