'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { RestaurantCard } from '@/components/RestaurantCard';
import { FaSearch, FaFire, FaStar } from 'react-icons/fa';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const trimmed = search.trim();
    router.push(trimmed ? `/browse?search=${encodeURIComponent(trimmed)}` : '/browse');
  };

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants', search],
    queryFn: () => restaurantService.searchRestaurants({ search, page: 1, limit: 12 }),
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
      <section className="bg-gradient-to-br from-maroon via-maroon/90 to-maroon-dark text-white py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">Welcome to  Elfijr Kitchen</h1>
            <p className="text-base sm:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Order your favorite meals from the best restaurants and get them delivered to your door
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex max-w-2xl mx-auto bg-white rounded-full shadow-lg overflow-hidden"
            >
              <input
                type="text"
                placeholder="Search restaurants, cuisines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                className="flex-1 px-4 sm:px-6 py-3 outline-none text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              />
              <button
                onClick={handleSearch}
                className="bg-maroon hover:bg-maroon-dark px-4 sm:px-8 py-3 text-white font-semibold transition flex items-center space-x-2 text-sm sm:text-base"
              >
                <FaSearch className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Search</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="bg-mustard py-12 border-b border-mustard-dark/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Browse by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['Elfijr Kitchen Dine In', 'Elfijr Kitchen Fast Food Outlet'].map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/browse?category=${encodeURIComponent(category)}`}>
                   <div className="p-4 sm:p-6 rounded-lg border border-gray-100 hover:border-primary hover:shadow-md transition text-center cursor-pointer">
                     <span className="text-xl sm:text-2xl mb-2 block">🍽️</span>
                     <span className="font-semibold text-gray-900 text-sm sm:text-base">{category}</span>
                   </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Popular Restaurants</h2>
              <p className="text-gray-600 text-sm sm:text-base">Discover great food and amazing dining experiences</p>
            </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {restaurants?.data?.map((restaurant: any) => (
                <motion.div key={restaurant.id} variants={itemVariants}>
                  <RestaurantCard restaurant={restaurant} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {restaurants?.data?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 text-lg mb-4">No restaurants found matching your search</p>
              <Link href="/" className="btn-primary">
                Browse All
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaFire className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Get your food delivered in 30-45 minutes</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaStar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Best Quality</h3>
              <p className="text-gray-600 text-sm">Fresh meals from verified restaurants</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center p-6"
            >
              <FaSearch className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Easy Ordering</h3>
              <p className="text-gray-600 text-sm">Simple and intuitive ordering process</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
