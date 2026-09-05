'use client';

import { useQuery } from '@tanstack/react-query';
import { menuItemService } from '@/services/menuItem.service';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { FaUtensils } from 'react-icons/fa';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const RESTAURANTS = [
  { slug: 'Elfijr-Kitchen-dine-in', label: 'Elfijr Kitchen Dine In' },
  { slug: 'Elfijr-Kitchen-fast-food-outlet', label: 'Elfijr Kitchen Fast Food Outlet' },
];

export function MenuGallery() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['menu-gallery'],
    queryFn: () =>
      Promise.all(
        RESTAURANTS.map(({ slug }) =>
          menuItemService.getMenuItemsByCategory({
            restaurantName: slug,
            page: 1,
            limit: 12,
          }),
        ),
      ),
  });

  const items = data?.flatMap((res) => res?.data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-cream rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-light text-lg mb-4">Unable to load menu gallery right now.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-light text-lg">No menu items available at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={20}
        slidesPerView={1.2}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop={items.length > 2}
        breakpoints={{
          480: { slidesPerView: 2.2, spaceBetween: 16 },
          768: { slidesPerView: 3.2, spaceBetween: 20 },
          1024: { slidesPerView: 4.2, spaceBetween: 24 },
        }}
        className="menu-gallery-swiper pb-10"
      >
        {items.map((item: any) => (
          <SwiperSlide key={item.id}>
            <Link
              href={`/restaurant/${item.menu?.restaurant?.slug}`}
              className="group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition h-full border border-cream"
            >
               <div className="relative h-48 bg-cream" style={{ perspective: '1200px' }}>
                 <div
                   className="relative w-full h-full transition-transform duration-500"
                   style={{ transformStyle: 'preserve-3d' }}
                   onMouseEnter={(e) => {
                     const el = e.currentTarget;
                     el.style.transform = 'rotateY(180deg)';
                   }}
                   onMouseLeave={(e) => {
                     const el = e.currentTarget;
                     el.style.transform = 'rotateY(0deg)';
                   }}
                 >
                   {/* Front */}
                   <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                     {item.image ? (
                       <img
                         src={item.image}
                         alt={item.name}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                         <FaUtensils className="text-4xl" />
                       </div>
                     )}
                     <span className="absolute top-2 left-2 bg-maroon/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                       {item.menu?.restaurant?.name}
                     </span>
                   </div>

                   {/* Back */}
                   <div
                     className="absolute inset-0 bg-white border border-cream flex flex-col justify-center p-4"
                     style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                   >
                     <h3 className="font-semibold text-charcoal text-sm line-clamp-2 leading-snug">{item.name}</h3>
                     {/* <p className="text-xs text-charcoal-light line-clamp-2 mt-1">{item.description}</p> */}
                     <div className="flex items-center justify-between mt-3">
                       {/* <p className="text-sm font-bold text-maroon">₦{item.price.toFixed(0)}</p> */}
                       <span className="text-[10px] sm:text-xs text-charcoal-light bg-cream px-2 py-1 rounded-full">
                         {item.category}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>
              {/* <div className="p-4">
                <h3 className="font-semibold text-charcoal text-sm line-clamp-1">{item.name}</h3>
                <p className="text-xs text-charcoal-light line-clamp-2 mt-1">{item.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm font-bold text-maroon">₦{item.price.toFixed(0)}</p>
                  <span className="text-xs text-charcoal-light bg-cream px-2 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
              </div> */}
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
