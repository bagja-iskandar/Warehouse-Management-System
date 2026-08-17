import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus, VehicleType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class VehicleQueryDto {
  @ApiPropertyOptional({
    enum: VehicleType,
    description:
      'Filter berdasarkan tipe armada kendaraan (VAN, BOX_TRUCK_SMALL, REEFER_TRUCK, WING_BOX_LARGE)',
  })
  @IsOptional()
  @IsEnum(VehicleType, { message: 'Tipe kendaraan tidak valid' })
  type?: VehicleType;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    description:
      'Filter berdasarkan status operasional armada (AVAILABLE, IN_SERVICE, MAINTENANCE)',
  })
  @IsOptional()
  @IsEnum(VehicleStatus, { message: 'Status kendaraan tidak valid' })
  status?: VehicleStatus;

  @ApiPropertyOptional({
    description: 'Filter armada yang memiliki pendingin Cold Storage (Reefer)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasRefrigeration?: boolean;

  @ApiPropertyOptional({
    description: 'Pencarian nomor polisi, nama kendaraan, atau kota pangkalan',
    example: 'B 9821 WMS',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
