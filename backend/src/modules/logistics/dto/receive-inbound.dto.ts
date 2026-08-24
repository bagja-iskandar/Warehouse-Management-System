import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ReceiveInboundDto {
  @ApiProperty({
    example: 100,
    description: 'Jumlah kuantitas barang fisik yang berhasil diterima dalam kondisi baik',
  })
  @IsInt({ message: 'Received quantity harus berupa bilangan bulat' })
  @Min(0, { message: 'Received quantity tidak boleh bernilai negatif' })
  receivedQuantity: number;

  @ApiProperty({
    example: 0,
    description: 'Jumlah kuantitas barang yang mengalami kerusakan saat tiba',
  })
  @IsInt({ message: 'Damaged quantity harus berupa bilangan bulat' })
  @Min(0, { message: 'Damaged quantity tidak boleh bernilai negatif' })
  damagedQuantity: number;

  @ApiProperty({
    example: 0,
    description: 'Jumlah kuantitas barang yang hilang / kurang dari surat jalan manifest',
  })
  @IsInt({ message: 'Missing quantity harus berupa bilangan bulat' })
  @Min(0, { message: 'Missing quantity tidak boleh bernilai negatif' })
  missingQuantity: number;

  @ApiProperty({
    example: 'GOOD',
    description: 'Kondisi fisik keseluruhan barang (GOOD, DAMAGED, PARTIAL)',
  })
  @IsNotEmpty({ message: 'Kondisi barang penerimaan wajib diisi' })
  @IsString()
  condition: string;

  @ApiPropertyOptional({
    example: 'Segel utuh, suhu cold chain terjaga optimal pada saat tiba di loading dock',
    description: 'Catatan tambahan tim receiving gudang',
  })
  @IsOptional()
  @IsString()
  receivingNotes?: string;
}
