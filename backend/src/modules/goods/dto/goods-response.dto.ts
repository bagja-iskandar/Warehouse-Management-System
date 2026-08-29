import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsCategory, GoodsStorageStatus, SlotStatus, StorageZoneType } from '@prisma/client';

export class GoodsDimensionsDto {
  @ApiProperty({ example: 120.0, description: 'Panjang barang dalam cm' })
  lengthCm: number;

  @ApiProperty({ example: 80.0, description: 'Lebar barang dalam cm' })
  widthCm: number;

  @ApiProperty({ example: 100.0, description: 'Tinggi barang dalam cm' })
  heightCm: number;

  @ApiProperty({
    example: 0.96,
    description: 'Total volume kubikasi dalam m3 (P x L x T / 10^6 x Qty)',
  })
  volumeM3: number;

  @ApiProperty({ example: 450.0, description: 'Total berat dalam kg' })
  weightKg: number;
}

export class GoodsHistoryEventDto {
  @ApiProperty({ example: 'hist-01' })
  id: string;

  @ApiProperty({ example: 'brg-001' })
  goodsId: string;

  @ApiProperty({ enum: GoodsStorageStatus, example: 'STORED' })
  status: GoodsStorageStatus;

  @ApiProperty({ example: 'Goods Stored in Warehouse' })
  title: string;

  @ApiProperty({
    example: 'Temperature inspection verified (-19.4°C). Placed into Slot COLD-A01.',
  })
  description: string;

  @ApiProperty({ example: 'Budi Santoso' })
  actorName: string;

  @ApiProperty({ example: 'Admin' })
  actorRole: string;

  @ApiPropertyOptional({ example: 'Slot COLD-A01, Cakung Warehouse' })
  location?: string | null;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z' })
  timestamp: string;
}

export class GoodsWarehouseSummaryDto {
  @ApiProperty({ example: 'wh-jkt-central' })
  id: string;

  @ApiProperty({ example: 'WH-CKG-01' })
  code: string;

  @ApiProperty({ example: 'Cakung Central Logistics Hub' })
  name: string;

  @ApiProperty({ example: 'East Jakarta' })
  city: string;
}

export class GoodsSlotSummaryDto {
  @ApiProperty({ example: 'slot-c01' })
  id: string;

  @ApiProperty({ example: 'COLD-A01' })
  code: string;

  @ApiProperty({ enum: StorageZoneType, example: 'COLD_STORAGE' })
  zone: StorageZoneType;

  @ApiPropertyOptional({ example: 'Level 1 - Rack A' })
  location?: string | null;

  @ApiPropertyOptional({ example: -19.5 })
  temperatureCelsius?: number | null;

  @ApiProperty({ enum: SlotStatus, example: 'OCCUPIED' })
  status: SlotStatus;
}

export class GoodsCustomerSummaryDto {
  @ApiProperty({ example: 'usr-cust-1' })
  id: string;

  @ApiProperty({ example: 'PT Samudera Bahari Indonesia' })
  name: string;

  @ApiPropertyOptional({ example: 'PT Samudera Bahari Indonesia' })
  companyName?: string | null;

  @ApiProperty({ example: 'coldchain@samuderabahari.co.id' })
  email: string;

  @ApiProperty({ example: '081809876543' })
  phone: string;
}

export class GoodsListItemDto {
  @ApiProperty({ example: 'brg-001' })
  id: string;

  @ApiProperty({ example: 'BRG-2026-FROZEN-001' })
  barcode: string;

  @ApiPropertyOptional({ example: 'BRG-2026-FROZEN-001' })
  sku?: string;

  @ApiProperty({ example: 'usr-cust-1' })
  customerId: string;

  @ApiProperty({ example: 'Siti Rahma (Customer - Fresh Foods)' })
  customerName: string;

  @ApiPropertyOptional({ example: 'CV Fresh Frozen Nusantara' })
  customerCompany?: string | null;

  @ApiProperty({ example: 'wh-jkt-central' })
  warehouseId: string;

  @ApiProperty({ example: 'Gudang Utama Cakung Logistics Hub' })
  warehouseName: string;

  @ApiProperty({ example: 'WH-CKG-01' })
  warehouseCode: string;

  @ApiPropertyOptional({ example: 'slot-c01' })
  slotId?: string | null;

  @ApiPropertyOptional({ example: 'COLD-A01' })
  slotCode?: string | null;

  @ApiProperty({ example: 'Atlantic Salmon Fillet Premium' })
  name: string;

  @ApiProperty({ enum: GoodsCategory, example: 'COLD_FOOD' })
  category: GoodsCategory;

  @ApiProperty({
    example: 'Export-grade frozen salmon fillet packed in vacuum-sealed insulated boxes.',
  })
  description: string;

  @ApiProperty({ type: GoodsDimensionsDto })
  dimensions: GoodsDimensionsDto;

  @ApiProperty({ example: 30, description: 'Total item units count' })
  quantity: number;

  @ApiProperty({ example: 'Master Box', description: 'Packaging unit' })
  unit: string;

  @ApiProperty({ example: true, description: 'Cold storage refrigeration requirement' })
  requiresColdStorage: boolean;

  @ApiPropertyOptional({ example: -22.0, description: 'Target temperature lower bound (°C)' })
  targetTempMin?: number | null;

  @ApiPropertyOptional({ example: -18.0, description: 'Target temperature upper bound (°C)' })
  targetTempMax?: number | null;

  @ApiPropertyOptional({
    example: -19.4,
    description: 'Current actual IoT sensor temperature (°C)',
  })
  currentTemp?: number | null;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z', description: 'Storage rental start date' })
  storageStartDate: string;

  @ApiPropertyOptional({ example: null, description: 'Storage rental end date' })
  storageEndDate?: string | null;

  @ApiProperty({ example: 2400000.0, description: 'Monthly storage rental fee (IDR)' })
  monthlyRentalFee: number;

  @ApiProperty({ enum: GoodsStorageStatus, example: 'STORED' })
  status: GoodsStorageStatus;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
  })
  imageUrl?: string | null;

  @ApiProperty({ example: 'WMS://ITEM/brg-001?code=BRG-2026-FROZEN-001' })
  qrCodeData: string;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z' })
  updatedAt: string;
}

export class GoodsDetailResponseDto extends GoodsListItemDto {
  @ApiProperty({ type: GoodsWarehouseSummaryDto })
  warehouse: GoodsWarehouseSummaryDto;

  @ApiPropertyOptional({ type: GoodsSlotSummaryDto })
  slot?: GoodsSlotSummaryDto | null;

  @ApiProperty({ type: GoodsCustomerSummaryDto })
  customer: GoodsCustomerSummaryDto;

  @ApiProperty({ type: [GoodsHistoryEventDto] })
  history: GoodsHistoryEventDto[];
}
