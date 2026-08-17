import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter berdasarkan status pengiriman Delivery Order',
    example: OrderStatus.PENDING_ASSIGNMENT,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Status order tidak valid' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: OrderType,
    description: 'Filter berdasarkan jenis order (PICKUP / DELIVERY)',
    example: OrderType.PICKUP,
  })
  @IsOptional()
  @IsEnum(OrderType, { message: 'Tipe order tidak valid' })
  type?: OrderType;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tanggal pengiriman (format YYYY-MM-DD)',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Filter order milik Customer tertentu (Hanya berlaku untuk peran ADMIN)',
    example: 'usr-cust-1',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter order yang ditugaskan ke Driver tertentu',
    example: 'usr-driver-1',
  })
  @IsOptional()
  @IsString()
  driverId?: string;
}
