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
import { OrderQueryDto } from './dto/order-query.dto';
import { DeliveryOrderDetailResponseDto, DeliveryOrderListItemDto } from './dto/order-response.dto';
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
    summary: 'Menugaskan Pengemudi ke Kendaraan Armada (Admin Only)',
    description:
      'Menetapkan pengemudi (Driver) resmi ke unit kendaraan tertentu dan mengubah status menjadi IN_SERVICE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Penugasan driver ke kendaraan berhasil',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak menugaskan pengemudi',
  })
  async assignDriver(
    @Body() dto: AssignDriverDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: VehicleResponseDto }> {
    const data = await this.logisticsService.assignDriver(dto, currentUser);
    return {
      message: 'Penugasan driver ke kendaraan berhasil',
      data,
    };
  }

  // ===========================================================================
  // 2. DELIVERY ORDERS
  // ===========================================================================

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Delivery Order (Inbound & Outbound)',
    description:
      'Mengambil daftar surat jalan / order pengiriman dengan paginasi, filter status, dan isolasi per tenant (Customer/Driver/Admin).',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar delivery order berhasil diambil',
    type: [DeliveryOrderListItemDto],
  })
  async findAllOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    const result = await this.logisticsService.findAllOrders(query, currentUser);
    return {
      message: 'Daftar delivery order berhasil diambil',
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
    summary: 'Mendapatkan Detail Delivery Order & Kargo',
    description:
      'Mengambil informasi lengkap surat jalan pengiriman beserta daftar SKU barang yang dimuat, detail kendaraan, dan pengemudi.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID order atau Nomor Surat Jalan (misal: ORD-2026-092)',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail delivery order berhasil diambil',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Delivery order tidak ditemukan atau bukan milik akun Anda',
  })
  async findOrderById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.findOrderById(id, currentUser);
    return {
      message: 'Detail delivery order berhasil diambil',
      data,
    };
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Membuat Surat Jalan / Delivery Order Baru',
    description:
      'Membuat order pengiriman (Pick-up atau Delivery) dengan kalkulasi kapasitas muatan otomatis dan validasi wajib armada Reefer Truck untuk komoditas Cold Storage.',
  })
  @ApiResponse({
    status: 201,
    description: 'Delivery order berhasil dibuat',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi muatan gagal atau kargo Cold Storage tidak menggunakan Reefer Truck',
  })
  async createOrder(
    @Body() dto: CreateDeliveryOrderDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.createOrder(dto, currentUser);
    return {
      message: 'Delivery order berhasil dibuat',
      data,
    };
  }

  @Patch('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Memperbarui Status Alur Pengiriman Logistik (State Machine)',
    description:
      'Mengubah status pengiriman (PENDING -> DRIVER_ASSIGNED -> EN_ROUTE -> PICKED_UP -> IN_TRANSIT -> ARRIVED -> DELIVERED).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID order atau Nomor Surat Jalan',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Status delivery order berhasil diperbarui',
    type: DeliveryOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Transisi status tidak valid dalam state machine',
  })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.updateOrderStatus(id, dto, currentUser);
    return {
      message: 'Status delivery order berhasil diperbarui',
      data,
    };
  }

  @Post('orders/:id/pod')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mengunggah Bukti Serah Terima Digital POD (Proof of Delivery)',
    description:
      'Mengirimkan tanda tangan digital penerima, foto kargo MinIO/S3, dan rating pengemudi untuk menyelesaikan pengiriman (DELIVERED) dan membebaskan armada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID order atau Nomor Surat Jalan',
    example: 'ord-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Bukti serah terima Digital POD berhasil diunggah',
    type: DeliveryOrderDetailResponseDto,
  })
  async submitPod(
    @Param('id') id: string,
    @Body() dto: SubmitPodDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: DeliveryOrderDetailResponseDto }> {
    const data = await this.logisticsService.submitPod(id, dto, currentUser);
    return {
      message: 'Bukti serah terima Digital POD berhasil diunggah',
      data,
    };
  }
}
