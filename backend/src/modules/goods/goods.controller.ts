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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { GoodsQueryDto } from './dto/goods-query.dto';
import { GoodsDetailResponseDto, GoodsListItemDto } from './dto/goods-response.dto';
import { TransferGoodsSlotDto } from './dto/transfer-goods-slot.dto';
import { UpdateGoodsStatusDto } from './dto/update-goods-status.dto';
import { GoodsService } from './goods.service';

@ApiTags('Goods & Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('goods')
export class GoodsController {
  constructor(private readonly goodsService: GoodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Mendaftarkan Master Barang Baru (SKU Registration)',
    description:
      'Mendaftarkan barang baru dengan kalkulasi volume server-side (P x L x T / 10^6 x Qty), otomasi estimasi tarif sewa bulanan, dan penjanaan QR/Barcode unik.',
  })
  @ApiResponse({
    status: 201,
    description: 'Barang berhasil didaftarkan',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi input gagal atau data tidak lengkap',
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  @ApiResponse({
    status: 403,
    description: 'Peran akun tidak memiliki izin mendaftarkan barang',
  })
  async create(
    @Body() dto: CreateGoodsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.create(dto, currentUser);
    return {
      message: 'Barang berhasil didaftarkan ke sistem',
      data,
    };
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Memperbarui Status Siklus Penyimpanan Barang (State Machine Transition)',
    description:
      'Mengubah status barang (DRAFT -> PENDING_PICKUP -> STORED -> DELIVERED) dengan alokasi slot rak, manajemen kapasitas gudang, dan pencatatan jejak audit mutasi.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID barang atau Barcode/SKU',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Status barang berhasil diperbarui',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Transisi status tidak valid atau kapasitas slot tidak mencukupi',
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  @ApiResponse({
    status: 403,
    description: 'Peran akun tidak memiliki izin untuk transisi status ini',
  })
  @ApiResponse({
    status: 404,
    description: 'Barang atau slot rak tidak ditemukan',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGoodsStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.updateStatus(id, dto, currentUser);
    return {
      message: 'Status barang berhasil diperbarui',
      data,
    };
  }

  @Post(':id/transfer-slot')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pemindahan Barang Antar Slot Rak Penyimpanan (Rack Transfer / Goods Movement)',
    description:
      'Memindahkan barang yang berstatus STORED ke slot rak tujuan lain dalam gudang yang sama, memvalidasi kesesuaian zona suhu dan kapasitas kubik m3, memperbarui utilisasi slot rak secara atomik, dan mencatat jejak audit mutasi.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik UUID barang atau Barcode/SKU',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Barang berhasil dipindahkan ke slot rak tujuan',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi pemindahan gagal (slot tidak kompatibel, kapasitas tidak mencukupi, dll)',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berwenang melakukan pemindahan rak',
  })
  @ApiResponse({
    status: 404,
    description: 'Barang atau slot rak tujuan tidak ditemukan',
  })
  async transferSlot(
    @Param('id') id: string,
    @Body() dto: TransferGoodsSlotDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.transferSlot(id, dto, currentUser);
    return {
      message: 'Barang berhasil dipindahkan ke slot rak tujuan',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Master Barang (SKU / Inventory List)',
    description:
      'Mengambil daftar master barang dengan dukungan paginasi, pencarian nama/barcode, filtering kategori, status penyimpanan, dan isolasi data per tenant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data master barang berhasil diambil',
    type: [GoodsListItemDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  async findAll(@Query() query: GoodsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.goodsService.findAll(query, currentUser);
    return {
      message: 'Data barang berhasil diambil',
      data: {
        items: result.items,
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.totalItems,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('mutations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Riwayat Log Mutasi Barang Milik Customer (Audit Trail)',
    description:
      'Mengambil jejak audit mutasi status kargo barang (inbound, stored, inspection, outbound) milik akun customer yang terautentikasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data riwayat mutasi barang berhasil diambil',
  })
  async findMutations(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('customerId') customerId?: string,
  ) {
    const data = await this.goodsService.findMutations(currentUser, customerId);
    return {
      message: 'Riwayat mutasi barang berhasil diambil',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Detail Barang & Histori Mutasi Gudang',
    description:
      'Mengambil data detail lengkap barang berdasarkan ID atau Barcode, termasuk dimensi, kubikasi m3, slot rak, dan jejak audit mutasi.',
  })
  @ApiParam({
    name: 'id',
    description:
      'ID unik UUID barang (misal: brg-001) atau Barcode/SKU (misal: BRG-2026-FROZEN-001)',
    example: 'brg-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail barang berhasil diambil',
    type: GoodsDetailResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  @ApiResponse({
    status: 404,
    description: 'Barang tidak ditemukan atau bukan milik akun Anda',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: GoodsDetailResponseDto }> {
    const data = await this.goodsService.findById(id, currentUser);
    return {
      message: 'Detail data barang berhasil diambil',
      data,
    };
  }
}
