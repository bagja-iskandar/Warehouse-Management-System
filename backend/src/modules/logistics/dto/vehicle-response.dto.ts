import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus, VehicleType } from '@prisma/client';

export class VehicleResponseDto {
  @ApiProperty({ example: 'veh-01' })
  id: string;

  @ApiProperty({ example: 'B 9821 WMS', description: 'Nomor plat kendaraan resmi' })
  plateNumber: string;

  @ApiProperty({ example: 'Isuzu Giga Reefer Cold Truck 5T' })
  name: string;

  @ApiProperty({ enum: VehicleType, example: 'REEFER_TRUCK' })
  type: VehicleType;

  @ApiProperty({ example: 5000.0, description: 'Kapasitas beban maksimal (kg)' })
  maxWeightKg: number;

  @ApiProperty({ example: 18.5, description: 'Kapasitas volume maksimal (m3)' })
  maxVolumeM3: number;

  @ApiProperty({ example: true, description: 'Ketersediaan unit pendingin kargo' })
  hasRefrigeration: boolean;

  @ApiPropertyOptional({
    example: -25.0,
    description: 'Suhu minimum yang dapat dicapai box pendingin (C)',
  })
  minTempCelsius?: number | null;

  @ApiProperty({ enum: VehicleStatus, example: 'IN_SERVICE' })
  status: VehicleStatus;

  @ApiPropertyOptional({
    example: 0,
    description: 'Jumlah order aktif yang sedang dijalankan armada',
  })
  activeOrdersCount?: number;

  @ApiPropertyOptional({ example: 'usr-driver-1' })
  currentDriverId?: string | null;

  @ApiPropertyOptional({ example: 'Agus Pratama' })
  currentDriverName?: string | null;

  @ApiPropertyOptional({ example: '081398765432' })
  currentDriverPhone?: string | null;

  @ApiProperty({ example: 'Jakarta Timur (Cakung Logistics Hub)' })
  locationCity: string;

  @ApiProperty({ example: '2026-08-16T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-16T14:00:00.000Z' })
  updatedAt: string;
}
