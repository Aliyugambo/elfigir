import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { AuthService } from '@/common/auth.service';
import { CloudinaryService } from '@/common/cloudinary.service';
import { GeocodingService } from '@/common/geocoding.service';
import {
  CreateAdminDto,
  AdminSignInDto,
  AdminOrderFilterDto,
  UpdateAdminOrderStatusDto,
  AdminUserFilterDto,
  UpdateUserStatusDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateStaffDto,
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateMenuDto,
  UpdateMenuDto,
  UpdateUserDto,
} from './admin.dto';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminRepository {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
    private geocodingService: GeocodingService,
  ) {}

  private async assertEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
  }

  private buildTokens(user: { id: string; email: string; role: UserRole }) {
    const accessToken = this.authService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = this.authService.generateRefreshToken({ sub: user.id });
    return { accessToken, refreshToken };
  }

  private toResponse(user: any, tokens: { accessToken: string; refreshToken: string }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async createAdmin(dto: CreateAdminDto) {
    await this.assertEmailAvailable(dto.email);

    const passwordHash = await this.authService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    return this.toResponse(user, this.buildTokens(user));
  }

  async signIn(dto: AdminSignInDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const isPasswordValid = await this.authService.comparePasswords(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.toResponse(user, this.buildTokens(user));
  }

  async getDashboard() {
    const [customers, chefs, riders, restaurants, orders, pendingRiders] =
      await Promise.all([
        this.prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
        this.prisma.user.count({ where: { role: UserRole.RESTAURANT } }),
        this.prisma.user.count({ where: { role: UserRole.DELIVERY } }),
        this.prisma.restaurant.count(),
        this.prisma.order.count(),
        this.prisma.user.count({
          where: { role: UserRole.DELIVERY, isActive: false },
        }),
      ]);

    return {
      counts: { customers, chefs, riders, restaurants, orders },
      pendingRiderApprovals: pendingRiders,
    };
  }

  async listStaff(role: UserRole) {
    return this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async approveStaff(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.role === UserRole.CUSTOMER || user.role === UserRole.ADMIN) {
      throw new BadRequestException('Only CHEF or DELIVERY staff can be approved');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async listOrders(filters: AdminOrderFilterDto) {
    const skip = (filters.page - 1) * filters.limit;
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
          restaurant: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page: filters.page, limit: filters.limit };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateAdminOrderStatusDto) {
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
        actualDeliveryTime:
          dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: true,
        user: true,
      },
    });
  }

  async listUsers(filters: AdminUserFilterDto) {
    const skip = (filters.page - 1) * filters.limit;
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (typeof filters.isActive === 'boolean') {
      where.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page: filters.page, limit: filters.limit };
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) {
      data.passwordHash = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: { select: { id: true } },
        reviews: true,
        favorites: true,
        addresses: true,
        notifications: true,
        emailVerifications: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin users cannot be deleted');
    }

    const orderIds = user.orders.map((o) => o.id);

    await this.prisma.$transaction(async (tx) => {
      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      await tx.emailVerification.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.favorite.deleteMany({ where: { userId: id } });
      await tx.review.deleteMany({ where: { userId: id } });
      await tx.address.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return { id };
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.prisma.order.delete({ where: { id } });
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    if (user.role === UserRole.CUSTOMER || user.role === UserRole.ADMIN) {
      throw new BadRequestException('Only CHEF or DELIVERY staff can be updated here');
    }

    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) {
      data.passwordHash = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async deleteStaff(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    if (user.role === UserRole.CUSTOMER || user.role === UserRole.ADMIN) {
      throw new BadRequestException('Only CHEF or DELIVERY staff can be deleted here');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  async listMenus() {
    return this.prisma.menu.findMany({
      include: {
        restaurant: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listRestaurants() {
    return this.prisma.restaurant.findMany({
      include: {
        menus: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRestaurant(dto: CreateRestaurantDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    let latitude = dto.latitude;
    let longitude = dto.longitude;

    if (latitude === undefined || longitude === undefined) {
      try {
        const coords = await this.geocodingService.geocode(dto.address, dto.city, dto.state);
        latitude = coords.latitude;
        longitude = coords.longitude;
      } catch (error) {
        latitude = 0;
        longitude = 0;
      }
    }

    return this.prisma.restaurant.create({
      data: {
        ...dto,
        slug,
        latitude,
        longitude,
        banner: dto.banner ?? null,
        isVerified: true,
      },
      include: {
        menus: true,
      },
    });
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menus: true,
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async updateRestaurant(id: string, dto: UpdateRestaurantDto) {
    await this.getRestaurant(id);

    const data: any = { ...dto };
    if (data.banner === undefined) {
      delete data.banner;
    }

    return this.prisma.restaurant.update({
      where: { id },
      data,
      include: {
        menus: true,
      },
    });
  }

  async uploadRestaurantImage(file: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.cloudinaryService.uploadImage(file, 'elfigir/restaurants');
    return { url };
  }

  async deleteRestaurant(id: string) {
    await this.getRestaurant(id);
    return this.prisma.restaurant.delete({ where: { id } });
  }

  async createMenu(dto: CreateMenuDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    return this.prisma.menu.create({
      data: {
        restaurantId: dto.restaurantId,
        name: dto.name,
        description: dto.description,
      },
      include: {
        restaurant: { select: { id: true, name: true } },
      },
    });
  }

  async updateMenu(id: string, dto: UpdateMenuDto) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return this.prisma.menu.update({
      where: { id },
      data: dto,
      include: {
        restaurant: { select: { id: true, name: true } },
      },
    });
  }

  async deleteMenu(id: string) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    return this.prisma.menu.delete({ where: { id } });
  }

  async listNotifications(adminId: string) {
    return this.prisma.notification.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markNotificationRead(adminId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, userId: adminId },
      data: { isRead: true },
    });
  }

  async listMenuItems(menuId?: string) {
    const where: any = {};
    if (menuId) {
      where.menuId = menuId;
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        addOns: true,
        menu: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    const menu = await this.prisma.menu.findUnique({ where: { id: dto.menuId } });
    if (!menu) {
      throw new BadRequestException('Menu not found');
    }

    return this.prisma.menuItem.create({
      data: {
        menuId: dto.menuId,
        name: dto.name,
        description: dto.description,
        image: dto.image,
        price: dto.price,
        category: dto.category,
        isAvailable: dto.isAvailable ?? true,
        prepTime: dto.prepTime,
      },
      include: {
        addOns: true,
        menu: true,
      },
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    await this.getMenuItem(id);

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        image: dto.image,
        price: dto.price,
        category: dto.category,
        isAvailable: dto.isAvailable,
        prepTime: dto.prepTime,
      },
      include: {
        addOns: true,
        menu: true,
      },
    });
  }

  async deleteMenuItem(id: string) {
    await this.getMenuItem(id);
    return this.prisma.menuItem.delete({ where: { id } });
  }

  async uploadMenuItemImage(file: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.cloudinaryService.uploadImage(file, 'elfigir/menu-items');
    return { url };
  }

  private async getMenuItem(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }
    return menuItem;
  }
}
