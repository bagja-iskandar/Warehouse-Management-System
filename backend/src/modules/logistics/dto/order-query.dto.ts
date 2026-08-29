import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, OrderType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filter by Delivery Order lifecycle status',
    example: OrderStatus.PENDING_ASSIGNMENT,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: OrderType,
    description: 'Filter by order type (PICKUP / DELIVERY)',
    example: OrderType.PICKUP,
  })
  @IsOptional()
  @IsEnum(OrderType, { message: 'Invalid order type' })
  type?: OrderType;

  @ApiPropertyOptional({
    description: 'Filter by scheduled delivery date (format YYYY-MM-DD)',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Filter orders belonging to a specific Customer (Admin role only)',
    example: 'usr-cust-1',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter orders assigned to a specific Driver',
    example: 'usr-driver-1',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by warehouse storage facility',
    example: 'wh-jkt-central',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;
}
