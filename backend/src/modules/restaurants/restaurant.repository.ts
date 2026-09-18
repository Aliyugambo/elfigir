import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  RestaurantFilterDto,
  MenuItemFilterDto,
} from './restaurant.dto';

@Injectable()
export class RestaurantRepository {
  constructor(private prisma: PrismaService) {}

  private parseCuisineType(value: string | null | undefined): string[] {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? [value] : [];
    }
  }

  private restaurantToResponse(restaurant: any) {
    if (!restaurant) {
      return restaurant;
    }

    return {
      ...restaurant,
      cuisineType: this.parseCuisineType(restaurant.cuisineType),
    };
  }

  private restaurantsToResponse(restaurants: any[]) {
    return restaurants.map((restaurant) =>
      this.restaurantToResponse(restaurant),
    );
  }

  async create(dto: CreateRestaurantDto) {
    const slug =
      dto.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const { cuisineType, ...restaurantData } = dto;

    const restaurant = await this.prisma.restaurant.create({
      data: {
        ...restaurantData,
        cuisineType: JSON.stringify(cuisineType),
        slug,
      },
      include: {
        menus: true,
      },
    });

    return this.restaurantToResponse(restaurant);
  }

  async findAll(filters: RestaurantFilterDto) {
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);

    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city };
    }

    if (filters.cuisineType && filters.cuisineType.length > 0) {
  where.AND = [
    ...(where.AND || []),
    {
      OR: filters.cuisineType.map((cuisine) => ({
        cuisineType: {
          contains: JSON.stringify(cuisine),
        },
      })),
    },
  ];
}

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: filters.limit || 10,
        include: { menus: true },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      data: this.restaurantsToResponse(restaurants),
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
  }

  async findMenuItemsByCategory(filters: MenuItemFilterDto) {
    const skip = ((filters.page || 1) - 1) * (filters.limit || 12);

    const where: any = {
      isAvailable: true,
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.restaurantName) {
      where.menu = {
        restaurant: {
          slug: { contains: filters.restaurantName },
        },
      };
    }

    if (filters.search) {
      where.name = { contains: filters.search };
    }

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take: filters.limit || 12,
        include: {
          menu: {
            include: {
              restaurant: true,
            },
          },
          addOns: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      menu: item.menu
        ? {
            ...item.menu,
            restaurant: item.menu.restaurant
              ? this.restaurantToResponse(item.menu.restaurant)
              : item.menu.restaurant,
          }
        : item.menu,
    }));

    return {
      data: parsedItems,
      total,
      page: filters.page || 1,
      limit: filters.limit || 12,
    };
  }

  async findById(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menus: {
          include: {
            items: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.restaurantToResponse(restaurant);
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        menus: {
          include: {
            items: true,
          },
        },
      },
    });

    return this.restaurantToResponse(restaurant);
  }

  async findBySlugs(slugs: string[]) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { slug: { in: slugs } },
      include: {
        menus: {
          include: {
            items: true,
          },
        },
      },
    });

    return this.restaurantsToResponse(restaurants);
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    const { cuisineType, ...restaurantData } = dto;

    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...restaurantData,
        ...(cuisineType !== undefined
          ? { cuisineType: JSON.stringify(cuisineType) }
          : {}),
      },
    });

    return this.restaurantToResponse(restaurant);
  }

  async updateRating(id: string, rating: number, reviewCount: number) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        rating,
        reviewCount,
      },
    });

    return this.restaurantToResponse(restaurant);
  }
}
