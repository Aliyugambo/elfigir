'use client';

import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { menuItemService } from '@/services/menuItem.service';
import { useQuery } from '@tanstack/react-query';
import { MenuItemCard } from '@/components/MenuItemCard';
import { toast } from 'sonner';

const CATEGORIES = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Fast Food',
  'Pizza',
  'Burger',
  'Chinese',
  'Italian',
  'Nigerian',
  'Indian',
  'Japanese',
  'Mexican',
  'Seafood',
  'Vegetarian',
  'Vegan',
  'Salad',
  'Desserts',
  'Drinks',
  'Smoothies',
  'Coffee',
  'Tea',
  'Bakery',
  'Snacks',
  'Soup',
];

export default function BrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const initialCategory = searchParams.get('category') || '';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      toast.message('Please log in to browse menu items');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['menu-items', activeCategory],
    queryFn: () =>
      menuItemService.getMenuItemsByCategory({
        category: activeCategory === 'All' ? undefined : activeCategory,
        page: 1,
        limit: 24,
      }),
    enabled: !!isAuthenticated,
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary-dark py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Browse by Category
          </h1>
          <p className="text-white/80 text-lg">
            Discover dishes from the best restaurants near you
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 mb-10">
            {CATEGORIES.map((cat, index) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Failed to load menu items.</p>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No menu items found for this category.
              </p>
            </div>
          )}

          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {items.map((item: any) => (
                <div key={item.id}>
                  <MenuItemCard
                    item={item}
                    restaurantId={item.menu?.restaurant?.id}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}