import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlotStatus, StorageZoneType } from '@prisma/client';

export class WarehouseZoneSummaryDto {
  @ApiProperty({ example: 3500.0, description: 'Total kapasitas zona standar dalam m3' })
  standardCapacityM3: number;

  @ApiProperty({ example: 1500.0, description: 'Total kapasitas cold storage dalam m3' })
  coldStorageCapacityM3: number;

  @ApiPropertyOptional({ example: 0.0, description: 'Total kapasitas heavy duty dalam m3' })
  heavyDutyCapacityM3?: number;
}

export class StorageZoneResponseDto {
  @ApiProperty({ example: 'zone-ckg-cold' })
  id: string;

  @ApiProperty({ example: 'Zona Cold Storage Sub-Zero' })
  name: string;

  @ApiProperty({ enum: StorageZoneType, example: 'COLD_STORAGE' })
  type: StorageZoneType;

  @ApiProperty({ example: 1500.0 })
  capacityM3: number;

  @ApiProperty({ example: 850.0 })
  usedM3: number;

  @ApiPropertyOptional({ example: -25.0 })
  targetTempMin?: number | null;

  @ApiPropertyOptional({ example: -18.0 })
  targetTempMax?: number | null;
}

export class StorageSlotResponseDto {
  @ApiProperty({ example: 'slot-c01' })
  id: string;

  @ApiProperty({ example: 'wh-jkt-central' })
  warehouseId: string;

  @ApiPropertyOptional({ example: 'zone-ckg-cold' })
  zoneId?: string | null;

  @ApiProperty({ example: 'COLD-A01' })
  code: string;

  @ApiProperty({ enum: StorageZoneType, example: 'COLD_STORAGE' })
  zone: StorageZoneType;

  @ApiProperty({ example: 100.0 })
  capacityM3: number;

  @ApiProperty({ example: 85.0 })
  usedM3: number;

  @ApiPropertyOptional({ example: -18.5 })
  temperatureCelsius?: number | null;

  @ApiPropertyOptional({ example: 85.0 })
  humidityPercent?: number | null;

  @ApiProperty({ enum: SlotStatus, example: 'OCCUPIED' })
  status: SlotStatus;

  @ApiProperty({ example: 1, description: 'Jumlah SKU barang aktif yang tersimpan di slot ini' })
  currentGoodsCount: number;

  @ApiProperty({ example: ['brg-001'], description: 'Daftar ID barang yang tersimpan di slot ini' })
  currentGoodsIds: string[];
}

export class WarehouseListItemDto {
  @ApiProperty({ example: 'wh-jkt-central', description: 'ID unik fasilitas gudang' })
  id: string;

  @ApiProperty({ example: 'WH-CKG-01', description: 'Kode resmi gudang' })
  code: string;

  @ApiProperty({ example: 'Gudang Utama Cakung Logistics Hub' })
  name: string;

  @ApiProperty({ example: 'Kawasan Industri Pulo Gadung Kav. 12-14' })
  address: string;

  @ApiProperty({ example: 'Jakarta Timur' })
  city: string;

  @ApiProperty({ example: 5000.0, description: 'Kapasitas total dalam m3' })
  totalCapacityM3: number;

  @ApiProperty({ example: 3150.0, description: 'Kapasitas terpakai saat ini dalam m3' })
  usedCapacityM3: number;

  @ApiProperty({ example: 63.0, description: 'Persentase utilisasi kapasitas gudang (%)' })
  occupancyPercent: number;

  @ApiProperty({ example: 6, description: 'Total jumlah slot rak' })
  slotsCount: number;

  @ApiProperty({ example: 4, description: 'Jumlah slot rak yang terisi' })
  occupiedSlotsCount: number;

  @ApiProperty({ type: WarehouseZoneSummaryDto })
  zones: WarehouseZoneSummaryDto;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'Hendra Wijaya' })
  managerName: string;

  @ApiProperty({ example: '021-4609876' })
  contactPhone: string;

  @ApiProperty({ example: '2026-08-16T14:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-16T14:00:00.000Z' })
  updatedAt: string;
}

export class WarehouseDetailResponseDto extends WarehouseListItemDto {
  @ApiProperty({ type: [StorageZoneResponseDto] })
  zoneDetails: StorageZoneResponseDto[];

  @ApiProperty({ type: [StorageSlotResponseDto] })
  slots: StorageSlotResponseDto[];
}
