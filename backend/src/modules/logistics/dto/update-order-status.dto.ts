import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.IN_TRANSIT,
    description: 'Status baru alur pengiriman Delivery Order',
  })
  @IsEnum(OrderStatus, { message: 'Status order tidak valid' })
  status: OrderStatus;

  @ApiPropertyOptional({
    example: 'usr-driver-1',
    description: 'ID driver yang ditugaskan (Wajib jika status berubah ke DRIVER_ASSIGNED)',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description: 'ID kendaraan armada yang ditugaskan',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Flag apakah pengiriman mengalami keterlambatan operasional',
  })
  @IsOptional()
  @IsBoolean()
  isDelayed?: boolean;

  @ApiPropertyOptional({
    example: 'Kemacetan parah di Tol Cikampek KM 38 akibat perbaikan jalan',
    description: 'Alasan rinci terjadinya keterlambatan armada',
  })
  @IsOptional()
  @IsString()
  delayReason?: string;

  @ApiPropertyOptional({
    example: '2026-08-01T15:30:00.000Z',
    description: 'Estimasi jadwal baru jika terjadi penundaan waktu',
  })
  @IsOptional()
  @IsString()
  rescheduledTime?: string;
}
