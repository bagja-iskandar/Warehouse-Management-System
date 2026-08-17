import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelemetryLogDto {
  @ApiProperty({ example: '1', description: 'ID unik log telemetri' })
  id: string;

  @ApiPropertyOptional({ example: 'slot-c01' })
  slotId?: string | null;

  @ApiPropertyOptional({ example: 'COLD-A01' })
  slotCode?: string | null;

  @ApiPropertyOptional({ example: 'Gudang Utama Cakung Logistics Hub' })
  warehouseName?: string | null;

  @ApiPropertyOptional({ example: 'veh-01' })
  vehicleId?: string | null;

  @ApiPropertyOptional({ example: 'B 9821 WMS' })
  vehiclePlate?: string | null;

  @ApiProperty({ example: -19.4, description: 'Suhu tercatat (derajat Celsius)' })
  temperatureCelsius: number;

  @ApiPropertyOptional({ example: 85.0, description: 'Kelembaban tercatat (%)' })
  humidityPercent?: number | null;

  @ApiProperty({ example: false, description: 'Flag anomali suhu melebihi threshold -18.0 C' })
  isAnomaly: boolean;

  @ApiProperty({ example: '2026-08-17T10:00:00.000Z' })
  recordedAt: string;
}

export class ColdStorageSlotMonitoringDto {
  @ApiProperty({ example: 'slot-c01' })
  slotId: string;

  @ApiProperty({ example: 'COLD-A01' })
  slotCode: string;

  @ApiProperty({ example: 'wh-jkt-central' })
  warehouseId: string;

  @ApiProperty({ example: 'Gudang Utama Cakung Logistics Hub' })
  warehouseName: string;

  @ApiProperty({ example: 'WH-CKG-01' })
  warehouseCode: string;

  @ApiProperty({ example: -19.4, description: 'Suhu sensor terkini (C)' })
  currentTempCelsius: number;

  @ApiPropertyOptional({ example: 84.0 })
  humidityPercent?: number | null;

  @ApiProperty({ example: 'OCCUPIED' })
  status: string;

  @ApiProperty({ enum: ['SAFE', 'WARNING', 'CRITICAL'], example: 'SAFE' })
  condition: 'SAFE' | 'WARNING' | 'CRITICAL';

  @ApiProperty({ example: 1 })
  goodsCount: number;

  @ApiProperty({ example: ['Norwegian Salmon Fillet Grade A'], type: [String] })
  storedGoodsNames: string[];
}

export class ReeferVehicleMonitoringDto {
  @ApiProperty({ example: 'veh-01' })
  vehicleId: string;

  @ApiProperty({ example: 'B 9821 WMS' })
  plateNumber: string;

  @ApiProperty({ example: 'Isuzu Giga Reefer Cold Truck 5T' })
  name: string;

  @ApiPropertyOptional({ example: 'Agus Pratama (Driver)' })
  currentDriverName?: string | null;

  @ApiProperty({ example: -20.2, description: 'Suhu box pendingin kargo terkini (C)' })
  currentTempCelsius: number;

  @ApiPropertyOptional({ example: -25.0 })
  minTempCelsius?: number | null;

  @ApiProperty({ enum: ['SAFE', 'WARNING', 'CRITICAL'], example: 'SAFE' })
  condition: 'SAFE' | 'WARNING' | 'CRITICAL';

  @ApiProperty({ example: 'AVAILABLE' })
  status: string;
}

export class TelemetryMonitoringSummaryDto {
  @ApiProperty({ example: 4 })
  totalMonitoredSensors: number;

  @ApiProperty({ example: 0 })
  activeAnomaliesCount: number;

  @ApiProperty({ example: 3 })
  coldStorageSafeCount: number;

  @ApiProperty({ example: 1 })
  coldStorageWarningCount: number;

  @ApiProperty({ example: 0 })
  coldStorageCriticalCount: number;

  @ApiProperty({ example: -19.2 })
  averageColdTempCelsius: number;
}

export class TelemetryMonitoringResponseDto {
  @ApiProperty({ type: TelemetryMonitoringSummaryDto })
  summary: TelemetryMonitoringSummaryDto;

  @ApiProperty({ type: [ColdStorageSlotMonitoringDto] })
  slots: ColdStorageSlotMonitoringDto[];

  @ApiProperty({ type: [ReeferVehicleMonitoringDto] })
  vehicles: ReeferVehicleMonitoringDto[];
}
