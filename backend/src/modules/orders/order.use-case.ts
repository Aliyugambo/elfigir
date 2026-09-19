import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto, UpdateDeliveryLocationDto, UpdateOrderStatusDto, VerifyPaystackDto } from './order.dto';
import { PaymentStatus, UserRole } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class OrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.orderRepository.create(userId, dto);
  }

  async getOrder(id: string, userId: string, role: string) {
    return this.orderRepository.findByIdForUser(id, userId, role);
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

  async updateDeliveryLocation(userId: string, orderId: string, dto: UpdateDeliveryLocationDto) {
    return this.orderRepository.updateDeliveryLocation(userId, orderId, dto);
  }

  async getDeliveryTracking(userId: string, role: string, orderId: string) {
    return this.orderRepository.getDeliveryTracking(userId, role, orderId);
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

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new BadRequestException(
        'Admin payment confirmation is only available for bank transfer orders',
      );
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      return order;
    }

    const updated = await this.orderRepository.updatePaymentStatus(
      orderId,
      PaymentStatus.COMPLETED,
    );

    await this.orderRepository.notifyAdmins(
      'Bank transfer payment received',
      `Bank transfer for order ${order.orderNumber} from ${order.user?.firstName || 'a customer'} ${order.user?.lastName || ''} has been confirmed.`,
      'payment_received',
    );

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

  async verifyPaystackPayment(userId: string, orderId: string, reference: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only verify your own orders');
    }

    if (order.paymentMethod !== 'PAYSTACK') {
      throw new BadRequestException('This endpoint is only for Paystack payments');
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      return order;
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    let response;
    try {
      response = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
          timeout: 10000,
        },
      );
    } catch (error: any) {
      const paystackMessage = error?.response?.data?.message;
      throw new ServiceUnavailableException(
        paystackMessage || 'Paystack could not be reached. Please try again.',
      );
    }

    const paystackData = response.data;

    if (paystackData.status !== true || paystackData.data.status !== 'success') {
      throw new BadRequestException('Payment verification failed');
    }

    const paystackAmount = paystackData.data.amount / 100;
    if (Math.abs(paystackAmount - order.totalAmount) > 0.01) {
      throw new BadRequestException('Payment amount does not match order total');
    }

    const updated = await this.orderRepository.updatePaymentStatus(orderId, PaymentStatus.COMPLETED);

    await this.orderRepository.notifyAdmins(
      'New Paystack order',
      `Paystack payment received for order ${order.orderNumber} from ${order.user?.firstName || 'a customer'} ${order.user?.lastName || ''}. Please review the order and approve it for preparation.`,
      'payment_received',
    );

    await this.orderRepository.createNotification(
      order.userId,
      'Payment confirmed',
      `Your Paystack payment for order ${order.orderNumber} has been confirmed. Your order is now being processed.`,
      'payment_confirmed',
    );

    await this.orderRepository.notifyRestaurant(
      order.restaurantId,
      'Payment received',
      `Payment received for order ${order.orderNumber} via Paystack. Please start preparation.`,
      'payment_received',
    );

    return updated;
  }
}
