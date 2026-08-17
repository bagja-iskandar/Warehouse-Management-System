import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class TelemetryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'slot-c01',
    description: 'Filter log berdasarkan ID slot gudang',
  })
  @IsOptional()
  @IsString()
  slotId?: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description: 'Filter log berdasarkan ID kendaraan armada',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter log anomali suhu melebihi ambang batas threshold',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isAnomaly?: boolean;

  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    description: 'Filter log mulai dari tanggal tertentu',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-17T23:59:59.000Z',
    description: 'Filter log hingga tanggal tertentu',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
