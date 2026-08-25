import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const orderNumber = `ORD-${Date.now()}`;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new BadRequestException('Restaurant not found');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        throw new BadRequestException(`Menu item ${item.menuItemId} not found`);
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        addOns: item.addOns || [],
        specialNote: item.specialNote,
      });
    }

    const tax = subtotal * 0.005; // 0.5% tax
    const deliveryFee = 0;
    const totalAmount = subtotal + tax;

    return this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        restaurantId: dto.restaurantId,
        items: {
          createMany: {
            data: orderItems,
          },
        },
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        deliveryAddress: dto.deliveryAddress,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        specialInstructions: dto.specialInstructions,
        status: OrderStatus.PENDING,
      },
      include: {
        items: true,
        restaurant: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        user: true,
      },
    });
  }

  async updatePaymentStatus(orderId: string, status: PaymentStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: true,
      },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: true,
      },
    });
  }

  async findByUserId(userId: string, skip: number, take: number) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          items: { include: { menuItem: true } },
          restaurant: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { orders, total };
  }

  async findStaffOrders(
    userId: string,
    role: string,
    filters: { status?: string; page: number; limit: number },
  ) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    } else if (role === UserRole.RESTAURANT) {
      where.status = { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] };
    } else if (role === UserRole.DELIVERY) {
      where.status = { in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY] };
    }

    if (role !== UserRole.ADMIN) {
      const staff = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { restaurantId: true },
      });

      if (!staff) {
        return { orders: [], total: 0, page: filters.page, limit: filters.limit };
      }

      if (role === UserRole.RESTAURANT && !staff.restaurantId) {
        return { orders: [], total: 0, page: filters.page, limit: filters.limit };
      }

      if (role === UserRole.RESTAURANT) {
        where.restaurantId = staff.restaurantId;
      }
    }

    const skip = (filters.page - 1) * filters.limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { menuItem: true } },
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

  async updateStatusByRole(userId: string, role: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowedByRole: Record<string, OrderStatus[]> = {
      [UserRole.ADMIN]: Object.values(OrderStatus),
      [UserRole.RESTAURANT]: [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
      [UserRole.DELIVERY]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
    };

    const allowed = allowedByRole[role] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Role ${role} is not allowed to set status to ${dto.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
        actualDeliveryTime: dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: true,
      },
    });

    await this.notifyOnTransition(updated, dto.status);

    return updated;
  }

  async notifyOnTransition(order: any, status: OrderStatus) {
    if (status === OrderStatus.CONFIRMED) {
      await this.notifyAdmins(
        'Order approved',
        `Order ${order.orderNumber} was approved by admin and sent to ${order.restaurant?.name}.`,
        'order_approved',
      );
    }

    if (status === OrderStatus.PREPARING) {
      await this.notifyAdmins(
        'Order preparation started',
        `Chef at ${order.restaurant?.name} started preparing order ${order.orderNumber}.`,
        'order_preparing',
      );
    }

    if (status === OrderStatus.READY_FOR_PICKUP) {
      await this.notifyAdmins(
        'Order ready for pickup',
        `Order ${order.orderNumber} from ${order.restaurant?.name} is ready for pickup.`,
        'order_ready',
      );
    }

    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      await this.notifyAdmins(
        'Out for delivery',
        `Order ${order.orderNumber} is now out for delivery.`,
        'order_out_for_delivery',
      );
    }

    if (status === OrderStatus.DELIVERED) {
      await this.createNotification(
        order.userId,
        'Order delivered',
        `Your order ${order.orderNumber} has been delivered. Please confirm receipt in the app.`,
        'order_update',
      );
      await this.notifyAdmins(
        'Order delivered',
        `Order ${order.orderNumber} was marked delivered. Awaiting customer confirmation.`,
        'order_update',
      );
    }

    if (status === OrderStatus.COMPLETED) {
      await this.notifyAdmins(
        'Order completed',
        `Order ${order.orderNumber} has been confirmed received by the customer.`,
        'order_completed',
      );
    }
  }

  async notifyAdmins(title: string, message: string, type: string) {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        this.createNotification(admin.id, title, message, type),
      ),
    );
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, message, type },
    });
  }
}
