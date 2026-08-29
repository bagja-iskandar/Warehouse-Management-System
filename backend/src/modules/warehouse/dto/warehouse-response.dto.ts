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

  @ApiProperty({ example: 100.0, description: 'Maximum Volume Capacity in m3' })
  capacityM3: number;

  @ApiProperty({ example: 0.72, description: 'Current Used Volume in m3' })
  usedM3: number;

  @ApiProperty({ example: 99.28, description: 'Remaining Available Volume in m3' })
  availableM3: number;

  @ApiProperty({ example: 0.72, description: 'Volume Utilization Percentage' })
  volumeUtilizationPercent: number;

  @ApiProperty({ example: 5000.0, description: 'Maximum Weight / Load Capacity in kg' })
  maxWeightKg: number;

  @ApiProperty({ example: 15.0, description: 'Current Used Weight in kg' })
  usedWeightKg: number;

  @ApiProperty({ example: 4985.0, description: 'Remaining Available Weight in kg' })
  availableWeightKg: number;

  @ApiProperty({ example: 0.3, description: 'Weight Utilization Percentage' })
  weightUtilizationPercent: number;

  @ApiProperty({
    example: 'PARTIAL',
    description: 'Overall slot status: AVAILABLE | PARTIAL | OCCUPIED | MAINTENANCE',
  })
  status: SlotStatus | string;

  @ApiProperty({ example: 'Normal Load', description: 'Bottleneck capacity status' })
  capacityStatus: string;

  @ApiPropertyOptional({ example: -18.5 })
  temperatureCelsius?: number | null;

  @ApiPropertyOptional({ example: 85.0 })
  humidityPercent?: number | null;

  @ApiProperty({ example: 1, description: 'Jumlah SKU barang aktif yang tersimpan di slot ini' })
  currentGoodsCount: number;

  @ApiProperty({
    example: 1,
    description: 'Jumlah customer/tenant yang menyimpan barang di slot ini',
  })
  customerCount: number;

  @ApiProperty({ example: 10, description: 'Total kuantitas kemasan/paket fisik di slot ini' })
  totalPackagesCount: number;

  @ApiProperty({ example: ['brg-001'], description: 'Daftar ID barang yang tersimpan di slot ini' })
  currentGoodsIds: string[];

  @ApiPropertyOptional({ description: 'Daftar rincian lengkap barang yang tersimpan di slot ini' })
  storedGoods?: Array<{
    id: string;
    barcode: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    dimensions?: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    };
    unitVolumeM3?: number;
    volumeM3: number;
    unitWeightKg?: number;
    weightKg: number;
    status: string;
    currentTemp?: number | null;
    customerId: string;
    customerName: string;
    customerCompany?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    storageStartDate?: string | null;
    storageEndDate?: string | null;
  }>;
}

export class CustomerRentalSummaryDto {
  @ApiProperty({ example: 100.0, description: 'Customer rented volume capacity in m3' })
  rentedVolumeM3: number;

  @ApiProperty({ example: 10000.0, description: 'Customer rented weight capacity in kg' })
  rentedWeightKg: number;

  @ApiProperty({ example: '2026-08-25T00:00:00.000Z', description: 'Rental agreement start date' })
  startDate: string;

  @ApiProperty({
    example: '2027-08-25T00:00:00.000Z',
    description: 'Rental agreement expiration date',
  })
  endDate: string;

  @ApiProperty({ example: 12, description: 'Rental agreement duration in months' })
  durationMonths: number;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Rental agreement status: ACTIVE | EXPIRING_SOON | EXPIRED | PENDING_PAYMENT',
  })
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_PAYMENT';

  @ApiProperty({ example: false, description: 'Whether the rental agreement has expired' })
  isExpired: boolean;

  @ApiProperty({ enum: StorageZoneType, example: 'COLD_STORAGE' })
  storageType: StorageZoneType;

  @ApiPropertyOptional({ example: 5000000.0, description: 'Monthly rental fee (IDR)' })
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 'INV-202608-1001', description: 'Rental invoice number' })
  invoiceNumber?: string;
}

export class CustomerUtilizationDto {
  @ApiProperty({ example: 15.0, description: 'Volume of stored goods in rack slots (m3)' })
  storedVolumeM3: number;

  @ApiProperty({ example: 1500.0, description: 'Weight of stored goods in rack slots (kg)' })
  storedWeightKg: number;

  @ApiProperty({ example: 10, description: 'Count of stored items' })
  storedCount: number;

  @ApiProperty({
    example: 5.0,
    description: 'Volume of goods currently in receiving/inspection (m3)',
  })
  receivingVolumeM3: number;

  @ApiProperty({
    example: 500.0,
    description: 'Weight of goods currently in receiving/inspection (kg)',
  })
  receivingWeightKg: number;

  @ApiProperty({ example: 3, description: 'Count of receiving items' })
  receivingCount: number;

  @ApiProperty({ example: 3.5, description: 'Volume of goods waiting inbound/draft (m3)' })
  waitingInboundVolumeM3: number;

  @ApiProperty({ example: 350.0, description: 'Weight of goods waiting inbound/draft (kg)' })
  waitingInboundWeightKg: number;

  @ApiProperty({ example: 2, description: 'Count of waiting inbound items' })
  waitingInboundCount: number;

  @ApiProperty({ example: 23.5, description: 'Total volume used/committed by customer (m3)' })
  usedVolumeM3: number;

  @ApiProperty({ example: 2350.0, description: 'Total weight used/committed by customer (kg)' })
  usedWeightKg: number;

  @ApiProperty({ example: 76.5, description: 'Remaining available volume capacity (m3)' })
  availableVolumeM3: number;

  @ApiProperty({ example: 7650.0, description: 'Remaining available weight capacity (kg)' })
  availableWeightKg: number;

  @ApiProperty({ example: 23.5, description: 'Percentage of rented volume utilized (%)' })
  volumeUtilizationPercent: number;

  @ApiProperty({ example: 23.5, description: 'Percentage of rented weight utilized (%)' })
  weightUtilizationPercent: number;
}

export class WarehouseListItemDto {
  @ApiProperty({ example: 'wh-jkt-central', description: 'Unique warehouse facility ID' })
  id: string;

  @ApiProperty({ example: 'WH-CKG-01', description: 'Official warehouse code' })
  code: string;

  @ApiProperty({ example: 'Cakung Central Logistics Hub' })
  name: string;

  @ApiProperty({ example: 'Pulo Gadung Industrial Zone Kav. 12-14' })
  address: string;

  @ApiProperty({ example: 'East Jakarta' })
  city: string;

  @ApiProperty({ example: 5000.0, description: 'Total capacity in m3' })
  totalCapacityM3: number;

  @ApiProperty({ example: 3150.0, description: 'Currently utilized capacity in m3' })
  usedCapacityM3: number;

  @ApiProperty({ example: 63.0, description: 'Warehouse occupancy percentage (%)' })
  occupancyPercent: number;

  @ApiProperty({ example: 6, description: 'Total storage rack slots' })
  slotsCount: number;

  @ApiProperty({ example: 4, description: 'Occupied storage rack slots' })
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

  @ApiPropertyOptional({
    type: CustomerRentalSummaryDto,
    description: 'Customer rental details for this warehouse',
  })
  customerRental?: CustomerRentalSummaryDto;

  @ApiPropertyOptional({
    type: CustomerUtilizationDto,
    description: 'Customer utilization metrics for this warehouse',
  })
  customerUtilization?: CustomerUtilizationDto;
}

export class WarehouseDetailResponseDto extends WarehouseListItemDto {
  @ApiProperty({ type: [StorageZoneResponseDto] })
  zoneDetails: StorageZoneResponseDto[];

  @ApiProperty({ type: [StorageSlotResponseDto] })
  slots: StorageSlotResponseDto[];
}
