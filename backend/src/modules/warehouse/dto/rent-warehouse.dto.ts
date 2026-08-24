import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageZoneType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class RentWarehouseSpaceDto {
  @ApiProperty({
    description:
      'ID unik atau Kode fasilitas gudang tujuan sewa (misal: wh-jkt-central atau WH-CKG-01)',
    example: 'wh-jkt-central',
  })
  @IsString({ message: 'warehouseId harus berupa string' })
  @IsNotEmpty({ message: 'warehouseId wajib disertakan' })
  warehouseId: string;

  @ApiProperty({
    description: 'Tipe zona penyimpanan ruang sewa (STANDARD atau COLD_STORAGE)',
    enum: StorageZoneType,
    example: StorageZoneType.COLD_STORAGE,
  })
  @IsEnum(StorageZoneType, {
    message: 'storageType harus berupa salah satu dari: STANDARD, COLD_STORAGE, HEAVY_DUTY',
  })
  @IsNotEmpty({ message: 'storageType wajib disertakan' })
  storageType: StorageZoneType;

  @ApiProperty({
    description: 'Volume kapasitas ruang sewa yang diajukan dalam meter kubik (m3)',
    example: 50,
    minimum: 1,
    maximum: 5000,
  })
  @IsNumber({}, { message: 'volumeM3 harus berupa angka numerik' })
  @Min(1, { message: 'volumeM3 minimal 1 meter kubik' })
  @Max(5000, { message: 'volumeM3 maksimal 5,000 meter kubik per transaksi sewa' })
  volumeM3: number;

  @ApiProperty({
    description: 'Durasi masa kontrak sewa ruang gudang dalam hitungan bulan',
    example: 3,
    minimum: 1,
    maximum: 36,
  })
  @IsNumber({}, { message: 'durationMonths harus berupa angka' })
  @Min(1, { message: 'durationMonths minimal 1 bulan' })
  @Max(36, { message: 'durationMonths maksimal 36 bulan (3 tahun)' })
  durationMonths: number;

  @ApiPropertyOptional({
    description: 'Tanggal mulai sewa dalam format ISO-8601 (opsional, default hari ini)',
    example: '2026-08-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsString({ message: 'startDate harus berupa string tanggal ISO-8601' })
  startDate?: string;
}
