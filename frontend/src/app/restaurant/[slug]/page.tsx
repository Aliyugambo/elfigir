'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { MenuItemCard } from '@/components/MenuItemCard';
import { CartSidebar } from '@/components/CartSidebar';
import { motion } from 'framer-motion';
import { FaStar, FaClock, FaTruck, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function RestaurantPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => restaurantService.getRestaurantBySlug(slug),
  });

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  if (isLoading) {
    return <div className="py-20 text-center">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return <div className="py-20 text-center">Restaurant not found</div>;
  }

  const activeMenu = selectedMenu 
    ? restaurant.menus?.find((m: any) => m.id === selectedMenu)
    : restaurant.menus?.[0];

  const allItems = restaurant.menus?.flatMap((m: any) => m.items) || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Kitchen Header */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        <img
          src={restaurant.banner || 'https://via.placeholder.com/1200x400'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Kitchen Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{restaurant.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">{restaurant.cuisineType.join(', ')}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 sm:space-x-2 text-base sm:text-lg">
                    <FaStar className="text-yellow-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-bold">{restaurant.rating}</span>
                  </div>
                  <span className="text-xs text-gray-600">({restaurant.reviewCount} reviews)</span>
                </div>
              </div>

              <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">{restaurant.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <FaClock className="text-primary" />
                  <div>
                    <p className="text-xs text-gray-600">Delivery Time</p>
                    <p className="font-semibold text-gray-900">
                      {restaurant.minDeliveryTime}-{restaurant.maxDeliveryTime} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <FaTruck className="text-primary" />
                  <div>
                    <p className="text-xs text-gray-600">Delivery Fee</p>
                    <p className="font-semibold text-gray-900">₦{restaurant.deliveryFee}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="text-xs text-gray-600">Status</p>
                    <p className={`font-semibold ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Menu Tabs */}
            <div className="mb-8">
              <div className="flex space-x-4 overflow-x-auto pb-2 mb-6">
                {restaurant.menus?.map((menu: any) => (
                  <motion.button
                    key={menu.id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedMenu(menu.id)}
                    className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                      selectedMenu === menu.id || (!selectedMenu && menu.id === restaurant.menus?.[0]?.id)
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-900 border border-gray-200 hover:border-primary'
                    }`}
                  >
                    {menu.name}
                  </motion.button>
                ))}
              </div>

              {/* Menu Items */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {activeMenu?.items?.map((item: any) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={restaurant.id}
                  />
                ))}
              </motion.div>
            </div>
          </div>

          {/* Sidebar - Cart */}
          <div className="lg:col-span-1">
            <CartSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
