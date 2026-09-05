import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminUseCase } from './admin.use-case';
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
import { JwtGuard } from '@/modules/auth/jwt.guard';
import { RolesGuard } from '@/common/roles.guard';
import { Roles } from '@/common/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminUseCase: AdminUseCase) {}

  @Post('register')
  @ApiOperation({ summary: 'Admin creates another admin (admin only)' })
  async register(@Body() dto: CreateAdminDto) {
    return this.adminUseCase.createAdmin(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() dto: AdminSignInDto) {
    return this.adminUseCase.signIn(dto);
  }

  @Get('dashboard')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin dashboard statistics' })
  async dashboard() {
    return this.adminUseCase.getDashboard();
  }

  @Delete('orders/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an order' })
  async deleteOrder(@Param('id') id: string) {
    return this.adminUseCase.deleteOrder(id);
  }

  @Get('staff/:role')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List staff by role (CHEF or DELIVERY)' })
  async listStaff(@Param('role') role: UserRole) {
    return this.adminUseCase.listStaff(role);
  }

  @Patch('staff/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a staff member (chef or rider)' })
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.adminUseCase.updateStaff(id, dto);
  }

  @Delete('staff/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a staff member (chef or rider)' })
  async deleteStaff(@Param('id') id: string) {
    return this.adminUseCase.deleteStaff(id);
  }

  @Get('menus')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all menus with their restaurant' })
  async listMenus() {
    return this.adminUseCase.listMenus();
  }

  @Get('notifications')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List notifications for the current admin' })
  async listNotifications(@Req() req: any) {
    return this.adminUseCase.listNotifications(req.user.sub);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationRead(@Req() req: any, @Param('id') id: string) {
    return this.adminUseCase.markNotificationRead(req.user.sub, id);
  }

  @Post('staff/:id/approve')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a pending CHEF or DELIVERY rider' })
  async approveStaff(@Param('id') id: string) {
    return this.adminUseCase.approveStaff(id);
  }

  @Get('orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders with optional status filter' })
  async listOrders(@Query() filters: AdminOrderFilterDto) {
    return this.adminUseCase.listOrders(filters);
  }

  @Get('orders/pending-transfers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders pending bank transfer confirmation' })
  async listPendingTransfers() {
    return this.adminUseCase.listPendingTransfers();
  }

  @Get('orders/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an order by ID' })
  async getOrder(@Param('id') id: string) {
    return this.adminUseCase.getOrder(id);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the status of an order' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminOrderStatusDto,
  ) {
    return this.adminUseCase.updateOrderStatus(id, dto);
  }

  @Post('orders/:id/confirm-payment')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm bank transfer payment for an order' })
  async confirmPayment(@Param('id') id: string) {
    return this.adminUseCase.confirmPayment(id);
  }

  @Get('users')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users with optional role filter' })
  async listUsers(@Query() filters: AdminUserFilterDto) {
    return this.adminUseCase.listUsers(filters);
  }

  @Patch('users/:id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUseCase.updateUserStatus(id, dto);
  }

  @Patch('users/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user information' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminUseCase.updateUser(id, dto);
  }

  @Delete('users/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminUseCase.deleteUser(id);
  }

  @Get('menu-items')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List menu items by menu' })
  async listMenuItems(@Query('menuId') menuId?: string) {
    return this.adminUseCase.listMenuItems(menuId);
  }

  @Post('menu-items')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu item' })
  async createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.adminUseCase.createMenuItem(dto);
  }

  @Patch('menu-items/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing menu item' })
  async updateMenuItem(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.adminUseCase.updateMenuItem(id, dto);
  }

  @Delete('menu-items/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu item' })
  async deleteMenuItem(@Param('id') id: string) {
    return this.adminUseCase.deleteMenuItem(id);
  }

  @Post('menu-items/upload-image')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload menu item image' })
  async uploadMenuItemImage(@UploadedFile() file: Express.Multer.File) {
    return this.adminUseCase.uploadMenuItemImage(file);
  }

  @Get('restaurants')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all restaurants' })
  async listRestaurants() {
    return this.adminUseCase.listRestaurants();
  }

  @Post('restaurants')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new restaurant' })
  async createRestaurant(@Body() dto: CreateRestaurantDto) {
    return this.adminUseCase.createRestaurant(dto);
  }

  @Get('restaurants/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a restaurant by ID' })
  async getRestaurant(@Param('id') id: string) {
    return this.adminUseCase.getRestaurant(id);
  }

  @Patch('restaurants/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a restaurant' })
  async updateRestaurant(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.adminUseCase.updateRestaurant(id, dto);
  }

  @Delete('restaurants/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a restaurant' })
  async deleteRestaurant(@Param('id') id: string) {
    return this.adminUseCase.deleteRestaurant(id);
  }

  @Post('restaurants/upload-image')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload restaurant image' })
  async uploadRestaurantImage(@UploadedFile() file: Express.Multer.File) {
    return this.adminUseCase.uploadRestaurantImage(file);
  }

  @Post('menus')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new menu' })
  async createMenu(@Body() dto: CreateMenuDto) {
    return this.adminUseCase.createMenu(dto);
  }

  @Patch('menus/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a menu' })
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.adminUseCase.updateMenu(id, dto);
  }

  @Delete('menus/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a menu' })
  async deleteMenu(@Param('id') id: string) {
    return this.adminUseCase.deleteMenu(id);
  }

  @Post('menu-items/migrate-categories')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate old menu item categories to new categories' })
  async migrateCategories() {
    return this.adminUseCase.migrateCategories();
  }
}
