import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsStorageStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateGoodsStatusDto {
  @ApiProperty({
    enum: GoodsStorageStatus,
    example: GoodsStorageStatus.STORED,
    description: 'Status baru siklus penyimpanan barang dalam state machine',
  })
  @IsEnum(GoodsStorageStatus, { message: 'Status penyimpanan baru tidak valid' })
  status: GoodsStorageStatus;

  @ApiPropertyOptional({
    example: 'slot-c01',
    description:
      'ID slot rak tujuan (Wajib jika status berubah menjadi STORED dan belum dialokasikan sebelumnya)',
  })
  @IsOptional()
  @IsString({ message: 'ID slot rak harus berupa string' })
  slotId?: string;

  @ApiPropertyOptional({
    example: 'Slot COLD-A01, Gudang Cakung',
    description: 'Lokasi fisik aktual pergerakan barang untuk jejak audit',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'Inspeksi suhu memenuhi syarat (-19.4 C). Ditempatkan di Slot COLD-A01.',
    description: 'Catatan tambahan atau alasan perubahan status',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
