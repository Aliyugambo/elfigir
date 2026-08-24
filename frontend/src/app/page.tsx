'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { menuItemService } from '@/services/menuItem.service';
import { RestaurantCard } from '@/components/RestaurantCard';
import { MenuItemCard } from '@/components/MenuItemCard';
import { MenuGallery } from '@/components/MenuGallery';
import { FaSearch, FaFire, FaStar } from 'react-icons/fa';
import { useState } from 'react';

const RESTAURANTS = ['Elfijr-Kitchen-dine-in', 'Elfijr-Kitchen-fast-food-outlet'];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const isFiltering = !!selectedCategory || !!search.trim();

  const handleSearch = () => {
    const trimmed = search.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('search', trimmed);
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(params.toString() ? `/?${params.toString()}` : '/');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    setSearch('');
  };

  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () =>
      restaurantService.searchRestaurants({
        page: 1,
        limit: 12,
      }),
    enabled: !isFiltering,
  });

  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['home-items', search, selectedCategory],
    queryFn: () =>
      menuItemService.getMenuItemsByCategory({
        ...(selectedCategory ? { restaurantName: selectedCategory } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        page: 1,
        limit: 24,
      }),
    enabled: isFiltering,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-maroon text-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">Welcome to Elfijr Kitchen</h1>
            <p className="text-base sm:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Order your favorite meals from the best restaurants and get them delivered to your door
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex max-w-2xl mx-auto"
            >
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {RESTAURANTS.map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                        selectedCategory === category
                          ? 'bg-white text-maroon shadow-md'
                          : 'bg-white/20 text-white hover:bg-white/40'
                      }`}
                    >
                      {category}
                    </button>
                  ),
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex max-w-2xl mx-auto bg-white rounded-full shadow-lg overflow-hidden"
            >
              <input
                type="text"
                placeholder={
                  selectedCategory
                    ? `${selectedCategory} — search within...`
                    : 'Search Food, cuisines...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                className="flex-1 px-4 sm:px-6 py-3 outline-none text-charcoal placeholder-charcoal-light text-sm sm:text-base"
              />
              <button
                onClick={handleSearch}
                disabled={!search.trim() && !selectedCategory}
                className="bg-maroon hover:bg-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed px-4 sm:px-8 py-3 text-white font-semibold transition flex items-center space-x-2 text-sm sm:text-base"
              >
                <FaSearch className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Search</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Menu Gallery */}
      <section className="py-12 bg-hero-gold text-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-maroon mb-2">Gallery</h2>
            {/* <p className="text-charcoal/80 text-sm sm:text-base">Swipe through our delicious offerings</p> */}
          </div>
          <MenuGallery />
        </div>
      </section>

      {/* Restaurants / Items */}
      <section className="py-16 bg-hero-gold text-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-maroon mb-2">
                {isFiltering ? 'Results' : 'Our Menu'}
              </h2>
              <p className="text-charcoal/80 text-sm sm:text-base">
                {isFiltering
                  ? 'Showing items from Elfijr Kitchen Dine In and Elfijr Kitchen Fast Food Outlet'
                  : ''}
              </p>
            </div>

          {isFiltering ? (
            isLoadingItems ? (
              <div className="flex flex-wrap justify-center gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 w-full max-w-sm bg-white/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {items?.data?.map((item: any) => (
                  <div key={item.id} className="w-full max-w-sm">
                    <MenuItemCard item={item} restaurantId={item.menu?.restaurant?.id} />
                  </div>
                ))}
              </div>
            )
          ) : isLoadingRestaurants ? (
            <div className="flex flex-wrap justify-center gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 w-full max-w-sm bg-white/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {restaurants?.data?.map((restaurant: any) => (
                <motion.div key={restaurant.id} variants={itemVariants} className="w-full max-w-sm">
                  <RestaurantCard restaurant={restaurant} />
                </motion.div>
              ))}
            </div>
          )}

          {isFiltering && !isLoadingItems && items?.data?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-charcoal/90 text-lg mb-4">
                {search.trim()
                  ? `No dishes found matching "${search.trim()}" in the selected kitchen.`
                  : 'No dishes found for this kitchen.'}
              </p>
              <Link href="/" className="btn-primary">
                Browse All
              </Link>
            </motion.div>
          )}

          {!isFiltering && !isLoadingRestaurants && restaurants?.data?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-charcoal/90 text-lg mb-4">No restaurants found matching your search</p>
              <Link href="/" className="btn-primary">
                Browse All
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-cream py-16 border-t border-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaFire className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-charcoal mb-2">Fast Delivery</h3>
              <p className="text-charcoal-light text-sm">Get your food delivered in 30-45 minutes</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaStar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-charcoal mb-2">Best Quality</h3>
              <p className="text-charcoal-light text-sm">Fresh meals from verified Kitchen</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaSearch className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-charcoal mb-2">Easy Ordering</h3>
              <p className="text-charcoal-light text-sm">Simple and intuitive ordering process</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
