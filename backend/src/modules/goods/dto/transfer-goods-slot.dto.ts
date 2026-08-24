import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class TransferGoodsSlotDto {
  @ApiProperty({
    example: 'slot-bdg-c02',
    description: 'ID UUID slot rak tujuan penyimpanan baru di fasilitas gudang yang sama',
  })
  @IsNotEmpty({ message: 'ID slot rak tujuan (targetSlotId) wajib disertakan' })
  @IsString({ message: 'ID slot rak tujuan wajib berupa string' })
  targetSlotId: string;

  @ApiProperty({
    example: 'Reorganisasi penataan kargo dingin dan optimalisasi kapasitas rak',
    description: 'Alasan operasional dilakukannya pemindahan slot rak barang',
    minLength: 3,
  })
  @IsNotEmpty({ message: 'Alasan pemindahan slot rak wajib diisi' })
  @IsString({ message: 'Alasan pemindahan rak wajib berupa teks' })
  @MinLength(3, { message: 'Alasan pemindahan minimal 3 karakter' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Dipindahkan ke rak tingkat 2 nomor 02 untuk memudahkan akses forklift',
    description: 'Catatan tambahan terkait penempatan fisik barang di slot baru',
  })
  @IsOptional()
  @IsString({ message: 'Catatan tambahan wajib berupa teks' })
  note?: string;
}
