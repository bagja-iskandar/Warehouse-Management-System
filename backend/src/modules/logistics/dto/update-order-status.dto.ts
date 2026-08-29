import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.IN_TRANSIT,
    description: 'New status in Delivery Order workflow',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status: OrderStatus;

  @ApiPropertyOptional({
    example: 'usr-driver-1',
    description: 'Assigned driver ID (Required when transitioning to DRIVER_ASSIGNED)',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description: 'Assigned fleet vehicle ID',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Flag indicating whether the shipment encountered operational delay',
  })
  @IsOptional()
  @IsBoolean()
  isDelayed?: boolean;

  @ApiPropertyOptional({
    example: 'Heavy traffic congestion on Jakarta-Cikampek highway KM 38',
    description: 'Detailed reason for shipment delay',
  })
  @IsOptional()
  @IsString()
  delayReason?: string;

  @ApiPropertyOptional({
    example: '2026-08-01T15:30:00.000Z',
    description: 'New estimated arrival time if rescheduled',
  })
  @IsOptional()
  @IsString()
  rescheduledTime?: string;

  @ApiPropertyOptional({
    example: 'Goods in good condition with seals intact',
    description: 'Status or confirmation notes',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 'Cakung Central Hub checkpoint',
    description: 'Current checkpoint location',
  })
  @IsOptional()
  @IsString()
  location?: string;
}
