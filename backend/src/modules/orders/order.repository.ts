import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { GeocodingService } from '@/common/geocoding.service';
import { CreateOrderDto, UpdateDeliveryLocationDto, UpdateOrderStatusDto } from './order.dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}
private parseAddOns(value: string | null | undefined): string[] {
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

private readonly safeUserSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  profileImage: true,
  address: true,
  city: true,
  state: true,
  country: true,
  zipCode: true,
  role: true,
};

private orderToResponse(order: any) {
  if (!order) {
    return order;
  }

  return {
    ...order,

    items: order.items?.map((item: any) => ({
      ...item,
      addOns: this.parseAddOns(item.addOns),
    })),

    restaurant: order.restaurant
      ? {
          ...order.restaurant,
          cuisineType: this.parseCuisineType(order.restaurant.cuisineType),
        }
      : order.restaurant,

    user: order.user
      ? {
          id: order.user.id,
          email: order.user.email,
          firstName: order.user.firstName,
          lastName: order.user.lastName,
          phone: order.user.phone,
          profileImage: order.user.profileImage,
          address: order.user.address,
          city: order.user.city,
          state: order.user.state,
          country: order.user.country,
          zipCode: order.user.zipCode,
          role: order.user.role,
        }
      : order.user,
  };
}

  private ordersToResponse(orders: any[]) {
    return orders.map((order) => this.orderToResponse(order));
  }

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
        addOns: JSON.stringify(item.addOns || []),
        specialNote: item.specialNote,
      });
    }

    const tax = subtotal * 0.075; // 7.5% tax
    const deliveryFee = 0;
    const totalAmount = subtotal + tax;

    let deliveryLat: number | null = dto.deliveryLat ?? null;
    let deliveryLng: number | null = dto.deliveryLng ?? null;

    if (!deliveryLat || !deliveryLng) {
      try {
        const coords = await this.geocodingService.geocode(dto.deliveryAddress);
        deliveryLat = coords.latitude;
        deliveryLng = coords.longitude;
      } catch {
        deliveryLat = null;
        deliveryLng = null;
      }
    }

      const order = await this.prisma.order.create({
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
        deliveryLat,
        deliveryLng,
        specialInstructions: dto.specialInstructions,
        status: OrderStatus.PENDING,
      },
      include: {
        items: true,
        restaurant: true,
      },
    });
    return this.orderToResponse(order);
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        user: {
          select: this.safeUserSelect,
        },
        tracking: true,
      },
    });

    return this.orderToResponse(order);
  }

  async findByIdForUser(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        user: {
          select: this.safeUserSelect,
        },
        tracking: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.ADMIN) {
      return this.orderToResponse(order);
    }

    if (role === UserRole.CUSTOMER) {
      if (order.userId !== userId) {
        throw new ForbiddenException('You can only access your own orders');
      }

      return this.orderToResponse(order);
    }

    if (role === UserRole.RESTAURANT) {
      const staff = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { restaurantId: true },
      });

      if (!staff?.restaurantId || order.restaurantId !== staff.restaurantId) {
        throw new ForbiddenException('You can only access orders for your restaurant');
      }

      return this.orderToResponse(order);
    }

    if (role === UserRole.DELIVERY) {
      if (order.riderId !== userId) {
        throw new ForbiddenException('This order is not assigned to you');
      }

      return this.orderToResponse(order);
    }

    throw new ForbiddenException('You are not allowed to access this order');
  }

  async updatePaymentStatus(orderId: string, status: PaymentStatus) {
     const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: status,
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: {
  select: this.safeUserSelect,
},
        tracking: true,
      },
    });
   return this.orderToResponse(order);
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
      user: {
  select: this.safeUserSelect,
},
      },
    });
  return this.orderToResponse(order);
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

    return {
      orders: this.ordersToResponse(orders),
      total,
    };
  }

  async findStaffOrders(
    userId: string,
    role: string,
    filters: { status?: string; page: number; limit: number },
  ) {
    const where: any = {};

    if (role === UserRole.ADMIN) {
      if (filters.status) {
        where.status = filters.status;
      }
    } else if (role === UserRole.RESTAURANT) {
      const allowedStatuses: OrderStatus[] = [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
      ];

      if (filters.status && !allowedStatuses.includes(filters.status as OrderStatus)) {
        throw new BadRequestException(
          'Restaurant staff can only view CONFIRMED or PREPARING orders',
        );
      }

      where.status = filters.status
        ? filters.status
        : { in: allowedStatuses };

      const staff = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { restaurantId: true },
      });

      if (!staff?.restaurantId) {
        return { orders: [], total: 0, page: filters.page, limit: filters.limit };
      }

      where.restaurantId = staff.restaurantId;
    } else if (role === UserRole.DELIVERY) {
      const allowedStatuses: OrderStatus[] = [
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.OUT_FOR_DELIVERY,
      ];

      if (filters.status && !allowedStatuses.includes(filters.status as OrderStatus)) {
        throw new BadRequestException(
          'Delivery riders can only view READY_FOR_PICKUP or OUT_FOR_DELIVERY orders',
        );
      }

      if (filters.status === OrderStatus.READY_FOR_PICKUP) {
        where.status = OrderStatus.READY_FOR_PICKUP;
      } else if (filters.status === OrderStatus.OUT_FOR_DELIVERY) {
        where.status = OrderStatus.OUT_FOR_DELIVERY;
        where.riderId = userId;
      } else {
        where.OR = [
          { status: OrderStatus.READY_FOR_PICKUP },
          {
            status: OrderStatus.OUT_FOR_DELIVERY,
            riderId: userId,
          },
        ];
      }
    } else {
      throw new ForbiddenException('You are not allowed to view staff orders');
    }

    const skip = (filters.page - 1) * filters.limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { menuItem: true } },
          restaurant: true,
          user: {
            select: this.safeUserSelect,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: this.ordersToResponse(orders),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async updateStatusByRole(
    userId: string,
    role: string,
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.ADMIN) {
      const updated = await this.prisma.order.update({
        where: { id },
        data: {
          status: dto.status,
          cancelReason: dto.cancelReason,
          actualDeliveryTime:
            dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
        },
        include: {
          items: { include: { menuItem: true } },
          restaurant: true,
          user: {
            select: this.safeUserSelect,
          },
          tracking: true,
        },
      });

      await this.notifyOnTransition(updated, dto.status);
      return this.orderToResponse(updated);
    }

    if (role === UserRole.RESTAURANT) {
      const staff = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { restaurantId: true },
      });

      if (!staff?.restaurantId || order.restaurantId !== staff.restaurantId) {
        throw new ForbiddenException(
          'You can only update orders for your restaurant',
        );
      }

      const validTransition =
        (order.status === OrderStatus.CONFIRMED &&
          dto.status === OrderStatus.PREPARING) ||
        (order.status === OrderStatus.PREPARING &&
          dto.status === OrderStatus.READY_FOR_PICKUP);

      if (!validTransition) {
        throw new BadRequestException(
          `Invalid restaurant order transition: ${order.status} -> ${dto.status}`,
        );
      }
    } else if (role === UserRole.DELIVERY) {
      if (dto.status === OrderStatus.OUT_FOR_DELIVERY) {
        if (order.status !== OrderStatus.READY_FOR_PICKUP) {
          throw new BadRequestException(
            'Only READY_FOR_PICKUP orders can be taken for delivery',
          );
        }

        const claimed = await this.prisma.order.updateMany({
          where: {
            id,
            status: OrderStatus.READY_FOR_PICKUP,
            riderId: null,
          },
          data: {
            status: OrderStatus.OUT_FOR_DELIVERY,
            riderId: userId,
          },
        });

        if (claimed.count !== 1) {
          throw new BadRequestException(
            'This order has already been assigned or is no longer ready for pickup',
          );
        }

        const updated = await this.prisma.order.findUnique({
          where: { id },
          include: {
            items: { include: { menuItem: true } },
            restaurant: true,
            user: {
              select: this.safeUserSelect,
            },
            tracking: true,
          },
        });

        if (!updated) {
          throw new NotFoundException('Order not found');
        }

        await this.notifyOnTransition(updated, OrderStatus.OUT_FOR_DELIVERY);
        return this.orderToResponse(updated);
      }

      if (dto.status === OrderStatus.DELIVERED) {
        if (
          order.status !== OrderStatus.OUT_FOR_DELIVERY ||
          order.riderId !== userId
        ) {
          throw new ForbiddenException(
            'You can only mark your assigned delivery as delivered',
          );
        }
      } else {
        throw new BadRequestException(
          `Delivery riders cannot set order status to ${dto.status}`,
        );
      }
    } else {
      throw new ForbiddenException('You are not allowed to update order status');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
        actualDeliveryTime:
          dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: true,
        user: {
          select: this.safeUserSelect,
        },
        tracking: true,
      },
    });

    await this.notifyOnTransition(updated, dto.status);
    return this.orderToResponse(updated);
  }

  async notifyOnTransition(order: any, status: OrderStatus) {
    if (status === OrderStatus.CONFIRMED) {
      await this.notifyAdmins(
        'Order approved',
        `Order ${order.orderNumber} was approved by admin and sent to ${order.restaurant?.name}.`,
        'order_approved',
      );
      await this.notifyRestaurant(
        order.restaurantId,
        'New order approved',
        `Order ${order.orderNumber} from ${order.user?.firstName || 'a customer'} has been approved. Please start preparation.`,
        'order_approved',
      );
      await this.createNotification(
        order.userId,
        'Order approved',
        `Your order ${order.orderNumber} has been approved and is being processed.`,
        'order_update',
      );
    }

    if (status === OrderStatus.PREPARING) {
      await this.notifyAdmins(
        'Order preparation started',
        `Chef at ${order.restaurant?.name} started preparing order ${order.orderNumber}.`,
        'order_preparing',
      );
      await this.createNotification(
        order.userId,
        'Order is being prepared',
        `Your order ${order.orderNumber} is now being prepared.`,
        'order_update',
      );
    }

    if (status === OrderStatus.READY_FOR_PICKUP) {
      await this.notifyAdmins(
        'Order ready for pickup',
        `Order ${order.orderNumber} from ${order.restaurant?.name} is ready for pickup.`,
        'order_ready',
      );
      await this.notifyRiders(
        'New order ready for pickup',
        `Order ${order.orderNumber} from ${order.restaurant?.name} is ready for pickup.`,
        'order_ready',
      );
      await this.createNotification(
        order.userId,
        'Order ready for pickup',
        `Your order ${order.orderNumber} is ready for pickup and will be assigned to a rider soon.`,
        'order_update',
      );
    }

    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      await this.notifyAdmins(
        'Out for delivery',
        `Order ${order.orderNumber} is now out for delivery.`,
        'order_out_for_delivery',
      );
      await this.createNotification(
        order.userId,
        'Order out for delivery',
        `Your order ${order.orderNumber} is now out for delivery.`,
        'order_update',
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

    if (status === OrderStatus.CANCELLED) {
      await this.createNotification(
        order.userId,
        'Order cancelled',
        `Your order ${order.orderNumber} has been cancelled.${order.cancelReason ? ` Reason: ${order.cancelReason}` : ''}`,
        'order_update',
      );
    }

    if (status === OrderStatus.COMPLETED) {
      await this.notifyAdmins(
        'Order completed',
        `Order ${order.orderNumber} has been confirmed received by the customer.`,
        'order_completed',
      );
      await this.createNotification(
        order.userId,
        'Order completed',
        `Your order ${order.orderNumber} has been completed. Thank you!`,
        'order_update',
      );
    }
  }

  async notifyRiders(title: string, message: string, type: string) {
    const riders = await this.prisma.user.findMany({
      where: { role: UserRole.DELIVERY },
      select: { id: true },
    });

    await Promise.all(
      riders.map((rider) =>
        this.createNotification(rider.id, title, message, type),
      ),
    );
  }

  async notifyRestaurant(restaurantId: string, title: string, message: string, type: string) {
    const staff = await this.prisma.user.findMany({
      where: { role: UserRole.RESTAURANT, restaurantId },
      select: { id: true },
    });

    await Promise.all(
      staff.map((member) =>
        this.createNotification(member.id, title, message, type),
      ),
    );
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

  async updateDeliveryLocation(userId: string, orderId: string, dto: UpdateDeliveryLocationDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
  tracking: true,
  user: {
    select: this.safeUserSelect,
  },
},
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.riderId !== userId || order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('This order is not assigned to you for delivery');
    }

    const distanceMeters = order.deliveryLat != null && order.deliveryLng != null
      ? Math.round(this.distanceInMeters(dto.latitude, dto.longitude, order.deliveryLat, order.deliveryLng))
      : null;
    const etaSeconds = distanceMeters == null ? null : Math.max(0, Math.round(distanceMeters / 8.33));
    const hasArrived = distanceMeters != null && distanceMeters <= 100;
    const arrivedAt = order.tracking?.arrivedAt ?? (hasArrived ? new Date() : null);

    const tracking = await this.prisma.deliveryTracking.upsert({
      where: { orderId },
      create: {
        orderId,
        riderId: userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        distanceMeters,
        etaSeconds,
        arrivedAt,
      },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
        speed: dto.speed,
        distanceMeters,
        etaSeconds,
        arrivedAt,
      },
    });

    if (hasArrived && !order.tracking?.arrivedAt) {
      await Promise.all([
        this.createNotification(
          order.userId,
          'Rider has arrived',
          `Your rider has arrived at the delivery address for order ${order.orderNumber}.`,
          'rider_arrived',
        ),
        this.createNotification(
          userId,
          'You have arrived',
          `You have arrived at the delivery address for order ${order.orderNumber}.`,
          'rider_arrived',
        ),
      ]);
    }

    return tracking;
  }

  async getDeliveryTracking(userId: string, role: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tracking: true,
        restaurant: { select: { name: true, address: true, latitude: true, longitude: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (role === UserRole.CUSTOMER && order.userId !== userId) {
      throw new BadRequestException('You can only track your own orders');
    }
    if (role === UserRole.DELIVERY && order.riderId !== userId) {
      throw new BadRequestException('This order is not assigned to you');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      restaurant: order.restaurant,
      tracking: order.tracking,
    };
  }

  private distanceInMeters(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
    const earthRadius = 6371000;
    const toRadians = (value: number) => value * Math.PI / 180;
    const latitudeDelta = toRadians(latitudeB - latitudeA);
    const longitudeDelta = toRadians(longitudeB - longitudeA);
    const value = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }
}
