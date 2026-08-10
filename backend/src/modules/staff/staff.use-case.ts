import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class StaffUseCase {
  constructor(private prisma: PrismaService) {}

  async getRestaurantIdForUser(userId: string, role: UserRole) {
    if (role === UserRole.SUPER_ADMIN) {
      return null;
    }

    const staff = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { restaurantId: true, role: true },
    });

    if (!staff || staff.role !== UserRole.STAFF || !staff.restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    return staff.restaurantId;
  }

  async getDashboard(staffId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const restaurantId = user.role === UserRole.SUPER_ADMIN ? undefined : user.restaurantId;

    if (user.role !== UserRole.SUPER_ADMIN && !restaurantId) {
      throw new ForbiddenException('Access denied');
    }

    const where = restaurantId ? { restaurantId } : {};

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      activeChefs,
      activeRiders,
      totalCustomers,
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where: { ...where, paymentStatus: PaymentStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: { ...where, status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } },
      }),
      this.prisma.user.count({
        where: { ...(restaurantId ? { restaurantId } : {}), role: UserRole.RESTAURANT, isActive: true },
      }),
      this.prisma.user.count({
        where: { ...(restaurantId ? { restaurantId } : {}), role: UserRole.DELIVERY, isActive: true },
      }),
      this.prisma.order.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      activeChefs,
      activeRiders,
      totalCustomers: totalCustomers.length,
      restaurantId: restaurantId || 'all',
    };
  }

  async getChefs(staffId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const where = user.role === UserRole.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };

    return this.prisma.user.findMany({
      where: { ...where, role: UserRole.RESTAURANT },
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

  async getRiders(staffId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const where = user.role === UserRole.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };

    return this.prisma.user.findMany({
      where: { ...where, role: UserRole.DELIVERY },
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

  async getOrders(staffId: string, filters: { status?: OrderStatus; page: number; limit: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = user.role === UserRole.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };
    if (filters.status) {
      where.status = filters.status;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { menuItem: true } },
          restaurant: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page: filters.page, limit: filters.limit };
  }

  async getOrder(staffId: string, orderId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === UserRole.STAFF && order.restaurantId !== user.restaurantId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(staffId: string, orderId: string, dto: { status: OrderStatus; cancelReason?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === UserRole.STAFF && order.restaurantId !== user.restaurantId) {
      throw new NotFoundException('Order not found');
    }

    const allowedStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new ForbiddenException('Invalid status transition');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
        actualDeliveryTime: dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      await this.notifyAdmins(
        'Order ready for pickup',
        `Order ${order.orderNumber} from ${order.restaurant.name} is ready for pickup.`,
        'order_ready',
      );
    }

    if (dto.status === OrderStatus.OUT_FOR_DELIVERY) {
      await this.notifyAdmins(
        'Out for delivery',
        `Order ${order.orderNumber} is now out for delivery.`,
        'order_out_for_delivery',
      );
    }

    if (dto.status === OrderStatus.DELIVERED) {
      await this.prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Order delivered',
          message: `Your order ${order.orderNumber} has been delivered. Please confirm receipt in the app.`,
          type: 'order_update',
        },
      });
      await this.notifyAdmins(
        'Order delivered',
        `Order ${order.orderNumber} was marked delivered.`,
        'order_update',
      );
    }

    return updated;
  }

  async getCustomers(staffId: string, page: number = 1, limit: number = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const where: any = user.role === UserRole.SUPER_ADMIN ? {} : { orders: { some: { restaurantId: user.restaurantId } } };
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { customers, total, page, limit };
  }

  async getFinances(staffId: string, period: string = 'month') {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { restaurantId: true, role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const where: any = user.role === UserRole.SUPER_ADMIN ? {} : { restaurantId: user.restaurantId };
    const financeWhere: any = { ...where, paymentStatus: PaymentStatus.COMPLETED, createdAt: { gte: startDate } };
    const pendingWhere: any = { ...where, paymentStatus: PaymentStatus.PENDING };

    const [completedOrders, pendingOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: financeWhere,
        _sum: { totalAmount: true, subtotal: true, tax: true, deliveryFee: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: pendingWhere,
      }),
    ]);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalRevenue: completedOrders._sum.totalAmount || 0,
      totalOrders: completedOrders._count,
      pendingOrders,
      breakdown: {
        subtotal: completedOrders._sum.subtotal || 0,
        tax: completedOrders._sum.tax || 0,
        deliveryFee: completedOrders._sum.deliveryFee || 0,
      },
    };
  }

  async updateProfile(staffId: string, dto: { firstName?: string; lastName?: string; phone?: string; address?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: staffId },
      select: { role: true },
    });

    if (!user || (user.role !== UserRole.STAFF && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ForbiddenException('Access denied');
    }

    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address;

    return this.prisma.user.update({
      where: { id: staffId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        restaurantId: true,
      },
    });
  }

  private async notifyAdmins(title: string, message: string, type: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.prisma.notification.create({
          data: { userId: admin.id, title, message, type },
        }),
      ),
    );
  }
}
