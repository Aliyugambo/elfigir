'use client';

import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { MenuItemCard } from '@/components/MenuItemCard';
import { CartDrawer } from '@/components/CartDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaClock, FaTruck, FaPhone, FaMapMarkerAlt, FaShoppingCart, FaChevronDown, FaChevronUp, FaUtensils } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function RestaurantPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => restaurantService.getRestaurantBySlug(slug),
  });

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAllDescription, setShowAllDescription] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('selectedMenu');
    if (stored) setSelectedMenu(stored);
  }, []);

  useEffect(() => {
    if (selectedMenu && typeof window !== 'undefined') {
      localStorage.setItem('selectedMenu', selectedMenu);
    }
  }, [selectedMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cart-updated') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  if (!restaurant.menus || restaurant.menus.length === 0) {
    return (
      <div className="bg-cream min-h-screen">
        <div className="relative h-48 sm:h-64 md:h-72 bg-cream">
          <img
            src={restaurant.banner || 'https://via.placeholder.com/1200x400'}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-12 sm:-mt-20 relative z-10">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-charcoal mb-2">{restaurant.name}</h1>
            <p className="text-charcoal-light text-sm mb-2">No menus available yet.</p>
            <p className="text-xs sm:text-sm text-charcoal-light">Check back later for delicious offerings from this kitchen.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen lg:mr-80 xl:mr-96">
      {/* Kitchen Header */}
      <div className="relative h-44 sm:h-56 md:h-72 bg-cream">
        <img
          src={restaurant.banner || 'https://via.placeholder.com/1200x400'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 -mt-16 sm:-mt-20 relative z-10">
        {/* Kitchen Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6"
        >
          <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-3xl font-bold text-charcoal break-words leading-tight">{restaurant.name}</h1>
              <p className="text-xs sm:text-sm text-charcoal-light mt-1">{restaurant.cuisineType.join(', ')}</p>
            </div>
            <div className="flex items-center space-x-1 bg-mustard/10 px-2 py-1 rounded-lg flex-shrink-0">
              <FaStar className="text-mustard w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-bold text-xs sm:text-sm">{restaurant.rating}</span>
            </div>
          </div>

          {restaurant.description && (
            <div className="mb-3 sm:mb-4">
              <p className={`text-xs sm:text-sm text-charcoal ${!showAllDescription ? 'line-clamp-2' : ''}`}>
                {restaurant.description}
              </p>
              {restaurant.description.length > 100 && (
                <button
                  onClick={() => setShowAllDescription(!showAllDescription)}
                  className="text-primary text-xs font-semibold mt-1 flex items-center gap-1"
                >
                  {showAllDescription ? (
                    <>Show less <FaChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show more <FaChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex items-center space-x-1.5 bg-cream rounded-lg p-2">
              <FaClock className="text-primary w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-charcoal-light">Delivery</p>
                <p className="font-semibold text-charcoal text-xs sm:text-sm truncate">
                  {restaurant.minDeliveryTime}-{restaurant.maxDeliveryTime}m
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-1.5 bg-cream rounded-lg p-2">
              <FaTruck className="text-primary w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-charcoal-light">Fee</p>
                <p className="font-semibold text-charcoal text-xs sm:text-sm truncate">₦{restaurant.deliveryFee}</p>
              </div>
            </div> */}
            <div className={`flex items-center space-x-1.5 rounded-lg p-2 ${restaurant.isOpen ? 'bg-mustard/10' : 'bg-cream'}`}>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${restaurant.isOpen ? 'bg-maroon' : 'bg-charcoal-light'}`}></div>
              <p className={`font-semibold text-xs sm:text-sm ${restaurant.isOpen ? 'text-maroon' : 'text-charcoal-light'}`}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Menu Tabs */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {restaurant.menus?.map((menu: any) => (
              <motion.button
                key={menu.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedMenu(menu.id);
                  setIsCartOpen(false);
                }}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all text-xs sm:text-sm flex-shrink-0 ${
                  selectedMenu === menu.id || (!selectedMenu && menu.id === restaurant.menus?.[0]?.id)
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-charcoal border border-cream active:border-primary'
                }`}
              >
                {menu.name}
                {menu.items?.length > 0 && (
                  <span className={`ml-1.5 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ${
                    selectedMenu === menu.id || (!selectedMenu && menu.id === restaurant.menus?.[0]?.id)
                      ? 'bg-white/20 text-white'
                      : 'bg-cream text-charcoal-light'
                  }`}>
                    {menu.items.length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
        >
          {activeMenu?.items && activeMenu.items.length > 0 ? (
            activeMenu.items.map((item: any) => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurantId={restaurant.id}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10 sm:py-12 text-charcoal-light">
              <FaUtensils className="w-12 h-12 mx-auto mb-3 text-charcoal-light" />
              <p className="text-sm sm:text-base font-medium mb-1">No items in this menu yet.</p>
              <p className="text-xs text-charcoal-light">Check back soon for new dishes.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile Cart FAB */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="w-full bg-primary text-white rounded-xl shadow-lg p-3.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FaShoppingCart className="w-5 h-5" />
            <span className="font-semibold text-sm">View Cart</span>
          </div>
          <FaChevronUp className={`w-4 h-4 transition-transform ${isCartOpen ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>

      {/* Mobile Cart Overlay */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
