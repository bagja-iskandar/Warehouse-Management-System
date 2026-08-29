import { ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsCategory, GoodsStorageStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GoodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: GoodsCategory,
    description: 'Filter by goods category (FURNITURE, COLD_FOOD, GENERAL_ELECTRONICS, TEXTILE)',
    example: GoodsCategory.COLD_FOOD,
  })
  @IsOptional()
  @IsEnum(GoodsCategory, { message: 'Invalid goods category' })
  category?: GoodsCategory;

  @ApiPropertyOptional({
    enum: GoodsStorageStatus,
    description: 'Filter by storage lifecycle status',
    example: GoodsStorageStatus.STORED,
  })
  @IsOptional()
  @IsEnum(GoodsStorageStatus, { message: 'Invalid storage status' })
  status?: GoodsStorageStatus;

  @ApiPropertyOptional({
    description: 'Filter by storage warehouse facility ID',
    example: 'wh-jkt-central',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({
    description: 'Filter goods requiring sub-zero Cold Storage facilities',
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
    description: 'Filter goods belonging to a specific Customer (Admin role only)',
    example: 'usr-cust-1',
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}
