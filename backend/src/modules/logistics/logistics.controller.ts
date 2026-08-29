import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateDeliveryOrderDto } from './dto/create-order.dto';
import { CreateOrderMessageDto } from './dto/create-order-message.dto';
import { OrderMessageResponseDto } from './dto/order-message-response.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DeliveryOrderDetailResponseDto, DeliveryOrderListItemDto } from './dto/order-response.dto';
import { ReceiveInboundDto } from './dto/receive-inbound.dto';
import { SubmitPodDto } from './dto/submit-pod.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { LogisticsService } from './logistics.service';

@ApiTags('Logistics & Fleet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  // ===========================================================================
  // 1. VEHICLES
  // ===========================================================================

  @Get('vehicles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Direktori Armada Kendaraan (Fleet Directory)',
    description:
      'Mengambil daftar seluruh armada truk (Reefer, Box, Van), kapasitas beban kg/m3, dan status kesiapan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar armada kendaraan berhasil diambil',
    type: [VehicleResponseDto],
  })
  async findAllVehicles(
    @Query() query: VehicleQueryDto,
  ): Promise<{ message: string; data: VehicleResponseDto[] }> {
    const data = await this.logisticsService.findAllVehicles(query);
    return {
      message: 'Daftar armada kendaraan berhasil diambil',
      data,
    };
  }

  @Post('vehicles/assign')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign Driver to Fleet Vehicle (Admin Only)',
    description: 'Assigns an active Driver to a fleet vehicle and sets status to IN_SERVICE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Driver assigned to vehicle successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only Admins are authorized to assign drivers',
  })
  async assignDriver(
    @Body() dto: AssignDriverDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: VehicleResponseDto }> {
    const data = await this.logisticsService.assignDriver(dto, currentUser);
    return {
      message: 'Driver assigned to vehicle successfully',
      data,
    };
  }

  // ===========================================================================
  // 2. DELIVERY ORDERS
  // ===========================================================================

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Delivery Orders Directory (Inbound & Outbound)',
    description:
      'Retrieves delivery orders with pagination, status filters, and tenant isolation (Customer/Driver/Admin).',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery orders retrieved successfully',
    type: [DeliveryOrderListItemDto],
  })
  async findAllOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.logisticsService.findAllOrders(query, currentUser);
    return {
      message: 'Delivery orders retrieved successfully',
      data: {
        items: result.items,
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.totalItems,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Delivery Order Detail & Cargo Items',
    description:
      'Retrieves full delivery order details including cargo manifest, fleet vehicle, and driver info.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number (e.g. ORD-2026-092)',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery order detail retrieved successfully',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery order not found or does not belong to your account',
  })
  async findOrderById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.findOrderById(id, currentUser);
    return {
      message: 'Delivery order detail retrieved successfully',
      data,
    };
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create New Delivery Order / Manifest',
    description:
      'Creates a new shipment request (Pickup or Delivery) with automated capacity checks and Reefer Truck validation for Cold Storage commodities.',
  })
  @ApiResponse({
    status: 201,
    description: 'Delivery order created successfully',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Payload validation failed or Cold Storage cargo requires Reefer Truck',
  })
  async createOrder(
    @Body() dto: CreateDeliveryOrderDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.createOrder(dto, currentUser);
    return {
      message: 'Delivery order created successfully',
      data,
    };
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Delivery Order Status (State Machine)',
    description:
      'Transitions shipment lifecycle status (PENDING -> DRIVER_ASSIGNED -> EN_ROUTE -> PICKED_UP -> IN_TRANSIT -> ARRIVED -> DELIVERED).',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Delivery order status updated successfully',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition in state machine',
  })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.updateOrderStatus(id, dto, currentUser);
    return {
      message: 'Delivery order status updated successfully',
      data,
    };
  }

  @Post('orders/:id/pod')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit Digital Proof of Delivery (POD)',
    description:
      'Submits recipient digital signature, photo proof, and driver rating to mark delivery as DELIVERED and release the fleet vehicle.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Proof of Delivery submitted successfully',
    type: DeliveryOrderDetailResponseDto,
  })
  async submitPod(
    @Param('id') id: string,
    @Body() dto: SubmitPodDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.submitPod(id, dto, currentUser);
    return {
      message: 'Proof of Delivery submitted successfully',
      data,
    };
  }

  @Post('orders/:id/receive')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive and Verify Inbound Goods at Warehouse (Admin Receiving)',
    description:
      'Verifies physical cargo count (Received, Damaged, Missing) and cargo condition upon loading dock arrival. Transitions order to DELIVERED and goods to INSPECTING (Put-Away Pending).',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Inbound goods receiving verified successfully',
    type: DeliveryOrderDetailResponseDto,
  })
  async receiveInboundOrder(
    @Param('id') id: string,
    @Body() dto: ReceiveInboundDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.receiveInboundOrder(id, dto, currentUser);
    return {
      message: 'Inbound goods receiving verified successfully',
      data,
    };
  }

  // ===========================================================================
  // 3. CUSTOMER ORDER MESSAGES & COMMUNICATIONS
  // ===========================================================================

  @Post('orders/:id/messages')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send Communication Message / Status Update to Customer (Admin Only)',
    description:
      'Creates an operational message for the customer regarding the delivery order (e.g. Reefer Unavailable, Driver Assignment Pending, Delay), persists it to message history, and delivers an In-App System Notification.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer message sent successfully',
    type: OrderMessageResponseDto,
  })
  async createOrderMessage(
    @Param('id') id: string,
    @Body() dto: CreateOrderMessageDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: OrderMessageResponseDto }> {
    const data = await this.logisticsService.createOrderMessage(id, dto, currentUser);
    return {
      message: 'Customer message sent successfully',
      data,
    };
  }

  @Get('orders/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Order Communication & Message History',
    description:
      'Retrieves the chronological communication log between dispatchers and customer for a specific delivery order.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Order messages retrieved successfully',
    type: [OrderMessageResponseDto],
  })
  async findOrderMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: OrderMessageResponseDto[] }> {
    const data = await this.logisticsService.findOrderMessages(id, currentUser);
    return {
      message: 'Order messages retrieved successfully',
      data,
    };
  }

  @Patch('orders/:id/messages/:messageId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark Order Communication Message as Read',
    description: 'Marks a specific delivery order message as viewed/read by the customer.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique order UUID or Order Number',
    example: 'ord-01',
  })
  @ApiParam({
    name: 'messageId',
    description: 'Unique message UUID',
    example: 'msg-uuid-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Order message marked as read successfully',
    type: OrderMessageResponseDto,
  })
  async markOrderMessageAsRead(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: OrderMessageResponseDto }> {
    const data = await this.logisticsService.markOrderMessageAsRead(id, messageId, currentUser);
    return {
      message: 'Order message marked as read successfully',
      data,
    };
  }
}
