import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class IngestTelemetryDto {
  @ApiPropertyOptional({
    example: 'slot-c01',
    description: 'ID slot rak gudang Cold Storage yang dimonitor oleh sensor IoT',
  })
  @IsOptional()
  @IsString()
  slotId?: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description: 'ID kendaraan armada Reefer Truck yang dimonitor oleh sensor telemetri kargo',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({
    example: -19.4,
    description:
      'Pembacaan suhu aktual sensor dalam satuan derajat Celsius (Threshold Cold Storage: <= -18.0 C)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Nilai suhu harus berupa angka desimal valid' })
  @Min(-50.0, { message: 'Nilai suhu minimal -50.0 C' })
  @Max(60.0, { message: 'Nilai suhu maksimal 60.0 C' })
  temperatureCelsius: number;

  @ApiPropertyOptional({
    example: 85.0,
    description: 'Tingkat kelembaban relatif udara kargo (Relative Humidity %)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Nilai kelembaban harus berupa angka' })
  @Min(0.0)
  @Max(100.0)
  humidityPercent?: number;

  @ApiPropertyOptional({
    example: '2026-08-17T10:00:00.000Z',
    description: 'Waktu pencatatan sensor (Timestamp ISO 8601, default: waktu saat ini)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Format timestamp harus ISO 8601' })
  recordedAt?: string;
}
