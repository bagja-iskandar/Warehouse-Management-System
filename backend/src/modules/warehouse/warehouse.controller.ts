import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { RentWarehouseSpaceDto } from './dto/rent-warehouse.dto';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import { WarehouseDetailResponseDto, WarehouseListItemDto } from './dto/warehouse-response.dto';
import { RentalBookingResult, WarehouseService } from './warehouse.service';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Fasilitas Gudang (Warehouse Directory)',
    description:
      'Mengambil seluruh fasilitas gudang aktif dengan ringkasan kapasitas m3, zona penyimpanan, dan utilisasi slot rak.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar gudang berhasil diambil',
    type: [WarehouseListItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  async findAll(
    @Query() query: WarehouseQueryDto,
  ): Promise<{ message: string; data: WarehouseListItemDto[] }> {
    const data = await this.warehouseService.findAll(query);
    return {
      message: 'Daftar fasilitas gudang berhasil diambil',
      data,
    };
  }

  @Get('customer/active')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Fasilitas Gudang Aktif Milik Customer',
    description:
      'Mengambil daftar gudang yang memiliki relasi sewa aktif atau penempatan barang milik Customer yang sedang login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar fasilitas gudang aktif customer berhasil diambil',
    type: [WarehouseListItemDto],
  })
  async getCustomerWarehouses(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: WarehouseListItemDto[] }> {
    const data = await this.warehouseService.getCustomerWarehouses(currentUser);
    return {
      message: 'Daftar fasilitas gudang aktif pelanggan berhasil diambil',
      data,
    };
  }

  @Post('rent')
  @Roles('CUSTOMER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pemesanan Sewa Ruang Gudang (Self-Service Rental Booking)',
    description:
      'Menyimpan permohonan sewa ruang gudang (Cold Storage / Standard), menerbitkan faktur tagihan invoice real di PostgreSQL, dan mengirim notifikasi.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pemesanan sewa ruang gudang berhasil dicatat dan invoice diterbitkan',
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi data sewa tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Fasilitas gudang tidak ditemukan',
  })
  async rentSpace(
    @Body() dto: RentWarehouseSpaceDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: RentalBookingResult }> {
    const data = await this.warehouseService.rentSpace(dto, currentUser);
    return {
      message: 'Permohonan sewa ruang gudang berhasil diproses dan invoice diterbitkan',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Detail Fasilitas Gudang & Grid Slot 3D',
    description:
      'Mengambil informasi lengkap gudang tertentu beserta zona sub-zero / standar dan status slot rak 3D.',
  })
  @ApiParam({
    name: 'id',
    description:
      'ID unik fasilitas gudang (misal: wh-jkt-central) atau Kode Gudang (misal: WH-CKG-01)',
    example: 'wh-jkt-central',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail fasilitas gudang berhasil diambil',
    type: WarehouseDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  @ApiResponse({
    status: 404,
    description: 'Fasilitas gudang tidak ditemukan',
  })
  async findById(
    @Param('id') id: string,
  ): Promise<{ message: string; data: WarehouseDetailResponseDto }> {
    const data = await this.warehouseService.findById(id);
    return {
      message: 'Detail fasilitas gudang berhasil diambil',
      data,
    };
  }
}
