import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderUseCase } from './order.use-case';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { JwtGuard } from '@/modules/auth/jwt.guard';
import { RolesGuard } from '@/common/roles.guard';
import { Roles } from '@/common/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private orderUseCase: OrderUseCase) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.orderUseCase.createOrder(req.user.sub, dto);
  }

  @Get('staff')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.DELIVERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Staff (admin/chef/rider) order list filtered by role & status' })
  async getStaffOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.orderUseCase.getStaffOrders(req.user.role, { status, page, limit });
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.DELIVERY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order status (role-restricted transitions)' })
  async updateStatusByRole(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderUseCase.updateStatusByRole(req.user.sub, req.user.role, id, dto);
  }

  @Get('/:id')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async getById(@Param('id') id: string) {
    return this.orderUseCase.getOrder(id);
  }

  @Get()
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  async getUserOrders(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.orderUseCase.getUserOrders(req.user.sub, page, limit);
  }
}
