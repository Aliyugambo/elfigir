import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderUseCase } from './order.use-case';
import { CreateOrderDto, UpdateOrderStatusDto, VerifyPaystackDto } from './order.dto';
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
  @ApiOperation({ summary: 'Staff (admin/chef/rider) order list filtered by role, status, and restaurant' })
  async getStaffOrders(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.orderUseCase.getStaffOrders(req.user.sub, req.user.role, { status, page, limit });
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

  @Post(':id/confirm-transfer')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer confirms bank transfer was made' })
  async confirmTransfer(@Req() req: any, @Param('id') id: string) {
    return this.orderUseCase.confirmTransfer(req.user.sub, id);
  }

  @Post(':id/confirm-payment')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin confirms bank transfer payment was received' })
  async confirmPayment(@Req() req: any, @Param('id') id: string) {
    return this.orderUseCase.confirmPayment(req.user.sub, id);
  }

  @Post(':id/confirm-received')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer confirms they have received their order' })
  async confirmReceived(@Req() req: any, @Param('id') id: string) {
    return this.orderUseCase.confirmReceived(req.user.sub, id);
  }

  @Post(':id/paystack-verify')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Paystack payment and confirm order' })
  async verifyPaystackPayment(@Req() req: any, @Param('id') id: string, @Body() dto: VerifyPaystackDto) {
    return this.orderUseCase.verifyPaystackPayment(req.user.sub, id, dto.reference);
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
