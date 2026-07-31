import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffUseCase } from './staff.use-case';
import { JwtGuard } from '@/modules/auth/jwt.guard';
import { RolesGuard } from '@/common/roles.guard';
import { Roles } from '@/common/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  UpdateStaffInfoDto,
  StaffOrderFilterDto,
  UpdateOrderStatusDto,
} from './staff.dto';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private staffUseCase: StaffUseCase) {}

  @Get('dashboard')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant manager dashboard stats' })
  async getDashboard(@Req() req: any) {
    return this.staffUseCase.getDashboard(req.user.sub);
  }

  @Get('chefs')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List chefs for the manager\'s restaurant' })
  async getChefs(@Req() req: any) {
    return this.staffUseCase.getChefs(req.user.sub);
  }

  @Get('riders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List riders for the manager\'s restaurant' })
  async getRiders(@Req() req: any) {
    return this.staffUseCase.getRiders(req.user.sub);
  }

  @Get('orders')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders for the manager\'s restaurant' })
  async getOrders(@Req() req: any, @Query() filters: StaffOrderFilterDto) {
    return this.staffUseCase.getOrders(req.user.sub, {
      status: filters.status,
      page: filters.page || 1,
      limit: filters.limit || 50,
    });
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (manager-restricted)' })
  async updateOrderStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.staffUseCase.updateOrderStatus(req.user.sub, id, dto);
  }

  @Get('orders/:id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID within the manager\'s restaurant' })
  async getOrder(@Req() req: any, @Param('id') id: string) {
    return this.staffUseCase.getOrder(req.user.sub, id);
  }

  @Get('customers')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List customers who ordered from the manager\'s restaurant' })
  async getCustomers(@Req() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.staffUseCase.getCustomers(req.user.sub, page, limit);
  }

  @Get('finances')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get financial summary for the manager\'s restaurant' })
  async getFinances(@Req() req: any, @Query('period') period: string = 'month') {
    return this.staffUseCase.getFinances(req.user.sub, period);
  }

  @Patch('profile')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update manager profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateStaffInfoDto) {
    return this.staffUseCase.updateProfile(req.user.sub, dto);
  }
}
