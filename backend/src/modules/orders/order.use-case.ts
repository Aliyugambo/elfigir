import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.orderRepository.create(userId, dto);
  }

  async getOrder(id: string) {
    return this.orderRepository.findById(id);
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.orderRepository.findByUserId(userId, skip, limit);
  }

  async getStaffOrders(userId: string, role: string, filters: { status?: string; page: number; limit: number }) {
    return this.orderRepository.findStaffOrders(userId, role, filters);
  }

  async updateStatusByRole(userId: string, role: string, id: string, dto: UpdateOrderStatusDto) {
    return this.orderRepository.updateStatusByRole(userId, role, id, dto);
  }

  async confirmTransfer(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only confirm your own orders');
    }

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new ForbiddenException('Transfer confirmation is only available for bank transfer orders');
    }

    const updated = await this.orderRepository.updatePaymentStatus(orderId, PaymentStatus.PROCESSING);

    await this.orderRepository.notifyAdmins(
      'Bank transfer confirmation',
      `Customer ${order.user?.firstName} confirmed bank transfer for order ${order.orderNumber}. Please verify and confirm receipt.`,
      'payment_confirmation',
    );

    return updated;
  }

  async confirmPayment(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updated = await this.orderRepository.updatePaymentStatus(orderId, PaymentStatus.COMPLETED);

    await this.orderRepository.createNotification(
      order.userId,
      'Payment confirmed',
      `Your bank transfer for order ${order.orderNumber} has been confirmed. Your order is now being processed.`,
      'payment_confirmed',
    );

    await this.orderRepository.createNotification(
      order.restaurantId,
      'Payment received',
      `Payment received for order ${order.orderNumber}. Please start preparation.`,
      'payment_received',
    );

    return updated;
  }

  async confirmReceived(userId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only confirm your own orders');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Order must be marked delivered before confirming receipt');
    }

    const updated = await this.orderRepository.updateStatus(
      orderId,
      'COMPLETED',
    );

    await this.orderRepository.notifyAdmins(
      'Order completed',
      `Order ${order.orderNumber} has been confirmed received by the customer.`,
      'order_completed',
    );

    return updated;
  }
}
