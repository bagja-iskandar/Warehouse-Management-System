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

  @ApiProperty({ example: 'Barang Disimpan di Gudang' })
  title: string;

  @ApiProperty({
    example: 'Inspeksi suhu memenuhi syarat (-19.4 C). Ditempatkan di Slot COLD-A01.',
  })
  description: string;

  @ApiProperty({ example: 'Budi Santoso' })
  actorName: string;

  @ApiProperty({ example: 'Admin' })
  actorRole: string;

  @ApiPropertyOptional({ example: 'Slot COLD-A01, Gudang Cakung' })
  location?: string | null;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z' })
  timestamp: string;
}

export class GoodsWarehouseSummaryDto {
  @ApiProperty({ example: 'wh-jkt-central' })
  id: string;

  @ApiProperty({ example: 'WH-CKG-01' })
  code: string;

  @ApiProperty({ example: 'Gudang Utama Cakung Logistics Hub' })
  name: string;

  @ApiProperty({ example: 'Jakarta Timur' })
  city: string;
}

export class GoodsSlotSummaryDto {
  @ApiProperty({ example: 'slot-c01' })
  id: string;

  @ApiProperty({ example: 'COLD-A01' })
  code: string;

  @ApiProperty({ enum: StorageZoneType, example: 'COLD_STORAGE' })
  zone: StorageZoneType;

  @ApiPropertyOptional({ example: -18.5 })
  temperatureCelsius?: number | null;

  @ApiProperty({ enum: SlotStatus, example: 'OCCUPIED' })
  status: SlotStatus;
}

export class GoodsCustomerSummaryDto {
  @ApiProperty({ example: 'usr-cust-1' })
  id: string;

  @ApiProperty({ example: 'Siti Rahma' })
  name: string;

  @ApiPropertyOptional({ example: 'CV Fresh Frozen Nusantara' })
  companyName?: string | null;

  @ApiProperty({ example: 'customer@freshfoods.id' })
  email: string;

  @ApiProperty({ example: '081809876543' })
  phone: string;
}

export class GoodsListItemDto {
  @ApiProperty({ example: 'brg-001' })
  id: string;

  @ApiProperty({ example: 'BRG-2026-FROZEN-001', description: 'Nomor Barcode / SKU unik' })
  barcode: string;

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

  @ApiProperty({ example: 'Norwegian Salmon Fillet Grade A' })
  name: string;

  @ApiProperty({ enum: GoodsCategory, example: 'COLD_FOOD' })
  category: GoodsCategory;

  @ApiProperty({ example: 'Ikan salmon beku kualitas ekspor dalam kemasan insulated box vakum.' })
  description: string;

  @ApiProperty({ type: GoodsDimensionsDto })
  dimensions: GoodsDimensionsDto;

  @ApiProperty({ example: 30, description: 'Jumlah unit kuantitas barang' })
  quantity: number;

  @ApiProperty({ example: 'Master Box', description: 'Satuan unit kemasan barang' })
  unit: string;

  @ApiProperty({ example: true, description: 'Kebutuhan ruang pendingin Cold Storage' })
  requiresColdStorage: boolean;

  @ApiPropertyOptional({ example: -22.0, description: 'Batas bawah suhu target (C)' })
  targetTempMin?: number | null;

  @ApiPropertyOptional({ example: -18.0, description: 'Batas atas suhu target (C)' })
  targetTempMax?: number | null;

  @ApiPropertyOptional({ example: -19.4, description: 'Suhu aktual terkini sensor IoT (C)' })
  currentTemp?: number | null;

  @ApiProperty({ example: '2026-08-01T09:00:00.000Z', description: 'Tanggal mulai sewa gudang' })
  storageStartDate: string;

  @ApiPropertyOptional({ example: null, description: 'Tanggal akhir sewa gudang' })
  storageEndDate?: string | null;

  @ApiProperty({ example: 2400000.0, description: 'Tarif sewa bulanan (IDR)' })
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
