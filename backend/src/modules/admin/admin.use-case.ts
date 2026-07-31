import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import {
  CreateAdminDto,
  AdminSignInDto,
  AdminOrderFilterDto,
  UpdateAdminOrderStatusDto,
  AdminUserFilterDto,
  UpdateUserStatusDto,
  UpdateUserDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateStaffDto,
  CreateRestaurantDto,
  UpdateRestaurantDto,
  CreateMenuDto,
  UpdateMenuDto,
} from './admin.dto';
import { PaymentStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminUseCase {
  constructor(private adminRepository: AdminRepository) {}

  createAdmin(dto: CreateAdminDto) {
    return this.adminRepository.createAdmin(dto);
  }

  signIn(dto: AdminSignInDto) {
    return this.adminRepository.signIn(dto);
  }

  getDashboard() {
    return this.adminRepository.getDashboard();
  }

  listStaff(role: UserRole) {
    return this.adminRepository.listStaff(role);
  }

  approveStaff(userId: string) {
    return this.adminRepository.approveStaff(userId);
  }

  listOrders(filters: AdminOrderFilterDto) {
    return this.adminRepository.listOrders(filters);
  }

  listPendingTransfers() {
    return this.adminRepository.listPendingTransfers();
  }

  getOrder(id: string) {
    return this.adminRepository.getOrder(id);
  }

  updateOrderStatus(id: string, dto: UpdateAdminOrderStatusDto) {
    return this.adminRepository.updateOrderStatus(id, dto);
  }

  listUsers(filters: AdminUserFilterDto) {
    return this.adminRepository.listUsers(filters);
  }

  updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    return this.adminRepository.updateUserStatus(id, dto);
  }

  updateUser(id: string, dto: UpdateUserDto) {
    return this.adminRepository.updateUser(id, dto);
  }

  deleteUser(id: string) {
    return this.adminRepository.deleteUser(id);
  }

  listMenuItems(menuId?: string) {
    return this.adminRepository.listMenuItems(menuId);
  }

  deleteOrder(id: string) {
    return this.adminRepository.deleteOrder(id);
  }

  updateStaff(id: string, dto: UpdateStaffDto) {
    return this.adminRepository.updateStaff(id, dto);
  }

  deleteStaff(id: string) {
    return this.adminRepository.deleteStaff(id);
  }

  listMenus() {
    return this.adminRepository.listMenus();
  }

  listNotifications(adminId: string) {
    return this.adminRepository.listNotifications(adminId);
  }

  markNotificationRead(adminId: string, id: string) {
    return this.adminRepository.markNotificationRead(adminId, id);
  }

  createMenuItem(dto: CreateMenuItemDto) {
    return this.adminRepository.createMenuItem(dto);
  }

  updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    return this.adminRepository.updateMenuItem(id, dto);
  }

  deleteMenuItem(id: string) {
    return this.adminRepository.deleteMenuItem(id);
  }

  uploadMenuItemImage(file: Express.Multer.File) {
    return this.adminRepository.uploadMenuItemImage(file);
  }

  listRestaurants() {
    return this.adminRepository.listRestaurants();
  }

  createRestaurant(dto: CreateRestaurantDto) {
    return this.adminRepository.createRestaurant(dto);
  }

  getRestaurant(id: string) {
    return this.adminRepository.getRestaurant(id);
  }

  updateRestaurant(id: string, dto: UpdateRestaurantDto) {
    return this.adminRepository.updateRestaurant(id, dto);
  }

  deleteRestaurant(id: string) {
    return this.adminRepository.deleteRestaurant(id);
  }

  uploadRestaurantImage(file: Express.Multer.File) {
    return this.adminRepository.uploadRestaurantImage(file);
  }

  createMenu(dto: CreateMenuDto) {
    return this.adminRepository.createMenu(dto);
  }

  updateMenu(id: string, dto: UpdateMenuDto) {
    return this.adminRepository.updateMenu(id, dto);
  }

  deleteMenu(id: string) {
    return this.adminRepository.deleteMenu(id);
  }
}
