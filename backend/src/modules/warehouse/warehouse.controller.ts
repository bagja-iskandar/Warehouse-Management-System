import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import { WarehouseDetailResponseDto, WarehouseListItemDto } from './dto/warehouse-response.dto';
import { WarehouseService } from './warehouse.service';

@ApiTags('Warehouses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
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
