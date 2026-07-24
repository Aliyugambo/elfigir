import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

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

  async getStaffOrders(role: string, filters: { status?: string; page: number; limit: number }) {
    return this.orderRepository.findStaffOrders(role, filters);
  }

  async updateStatusByRole(userId: string, role: string, id: string, dto: UpdateOrderStatusDto) {
    return this.orderRepository.updateStatusByRole(userId, role, id, dto);
  }
}
