'use client';

import { useQuery } from '@tanstack/react-query';
import { menuItemService } from '@/services/menuItem.service';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { FaUtensils, FaFire } from 'react-icons/fa';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const RESTAURANT_NAMES = [
  'Elfijr Kitchen Dine In',
  'Elfijr Kitchen Fast Food Outlet',
];

export function HeroSlider() {
  const { data } = useQuery({
    queryKey: ['hero-menu-items'],
    queryFn: () =>
      Promise.all(
        RESTAURANT_NAMES.map((name) =>
          menuItemService.getMenuItemsByCategory({
            restaurantName: name,
            page: 1,
            limit: 12,
          }),
        ),
      ),
  });

  const items = data?.flatMap((res) => res?.data ?? []) ?? [];

  const featured = items.slice(0, 8);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-center gap-2 mb-4">
        <FaFire className="text-mustard text-xl" />
        <h2 className="text-xl font-bold text-white">Featured Dishes</h2>
        <FaUtensils className="text-mustard text-xl" />
      </div>

      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={16}
        slidesPerView={1.2}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop={featured.length > 2}
        breakpoints={{
          480: { slidesPerView: 2.2, spaceBetween: 16 },
          768: { slidesPerView: 3.2, spaceBetween: 20 },
          1024: { slidesPerView: 4.2, spaceBetween: 24 },
        }}
        className="hero-swiper pb-10"
      >
        {featured.map((item: any) => (
          <SwiperSlide key={item.id}>
            <Link
              href={`/restaurant/${item.menu?.restaurant?.slug}`}
              className="block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition h-full"
            >
              <div className="relative h-44 bg-cream">
                <img
                  src={item.image || 'https://via.placeholder.com/400x300'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 bg-maroon/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {item.menu?.restaurant?.name}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-charcoal text-sm line-clamp-1">{item.name}</h3>
                <p className="text-xs text-charcoal-light line-clamp-2 mt-1">{item.description}</p>
                <p className="text-sm font-bold text-maroon mt-2">₦{item.price.toFixed(0)}</p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
