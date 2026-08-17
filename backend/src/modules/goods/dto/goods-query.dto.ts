import { ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsCategory, GoodsStorageStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GoodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: GoodsCategory,
    description:
      'Filter berdasarkan kategori barang (FURNITURE, COLD_FOOD, GENERAL_ELECTRONICS, TEXTILE)',
    example: GoodsCategory.COLD_FOOD,
  })
  @IsOptional()
  @IsEnum(GoodsCategory, { message: 'Kategori barang tidak valid' })
  category?: GoodsCategory;

  @ApiPropertyOptional({
    enum: GoodsStorageStatus,
    description: 'Filter berdasarkan status siklus penyimpanan barang',
    example: GoodsStorageStatus.STORED,
  })
  @IsOptional()
  @IsEnum(GoodsStorageStatus, { message: 'Status penyimpanan barang tidak valid' })
  status?: GoodsStorageStatus;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID fasilitas gudang penyimpanan',
    example: 'wh-jkt-central',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Filter barang yang membutuhkan fasilitas Cold Storage sub-zero',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  requiresColdStorage?: boolean;

  @ApiPropertyOptional({
    description: 'Filter barang milik Customer tertentu (Hanya berlaku untuk peran ADMIN)',
    example: 'usr-cust-1',
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}
