'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Restaurant } from '@/types';
import { FaStar, FaClock, FaTruck } from 'react-icons/fa';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition"
    >
      <Link href={`/restaurant/${restaurant.slug}`}>
        <div className="relative h-40 sm:h-48 bg-gray-200 overflow-hidden">
          <img
            src={restaurant.banner || 'https://via.placeholder.com/300x200'}
            alt={restaurant.name}
            className="w-full h-full object-cover hover:scale-105 transition duration-300"
          />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Closed</span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">{restaurant.name}</h3>
              <p className="text-sm text-gray-500">
                {restaurant.cuisineType.slice(0, 2).join(', ')}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">{restaurant.description}</p>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FaStar className="text-yellow-400 w-4 h-4" />
                <span className="font-semibold text-gray-900">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <FaClock className="w-4 h-4" />
                <span>{restaurant.minDeliveryTime}-{restaurant.maxDeliveryTime} min</span>
              </div>
            </div>
            <div className="text-gray-600">
              ₦{restaurant.deliveryFee.toFixed(0)} delivery
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
