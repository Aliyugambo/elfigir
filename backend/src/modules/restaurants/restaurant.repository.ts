import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateRestaurantDto, UpdateRestaurantDto, RestaurantFilterDto } from './restaurant.dto';

@Injectable()
export class RestaurantRepository {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRestaurantDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    return this.prisma.restaurant.create({
      data: {
        ...dto,
        slug,
      },
      include: {
        menus: true,
      },
    });
  }

  async findAll(filters: RestaurantFilterDto) {
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);

    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.cuisineType && filters.cuisineType.length > 0) {
      where.cuisineType = { hasSome: filters.cuisineType };
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
      data: restaurants,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
  }

  async findById(id: string) {
    return this.prisma.restaurant.findUnique({
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
  }

  async findBySlug(slug: string) {
    return this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        menus: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id },
      data: dto,
    });
  }

  async updateRating(id: string, rating: number, reviewCount: number) {
    return this.prisma.restaurant.update({
      where: { id },
      data: {
        rating,
        reviewCount,
      },
    });
  }
}
