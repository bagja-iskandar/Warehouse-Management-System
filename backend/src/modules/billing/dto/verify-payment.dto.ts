import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    enum: ['VERIFY', 'REJECT'],
    example: 'VERIFY',
    description:
      'Aksi verifikasi Admin: VERIFY (menerima dan menandai PAID) atau REJECT (menolak bukti pembayaran)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Aksi verifikasi wajib ditentukan' })
  @IsIn(['VERIFY', 'REJECT'], { message: "Aksi verifikasi harus bernilai 'VERIFY' atau 'REJECT'" })
  action: 'VERIFY' | 'REJECT';

  @ApiPropertyOptional({
    example: 'Dana Rp 7.812.000 telah terverifikasi masuk ke rekening operasional WMS',
    description: 'Catatan admin terkait hasil verifikasi atau alasan penolakan',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
