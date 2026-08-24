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
    example: 'Bukti transfer tidak terbaca / nominal tidak sesuai',
    description: 'Alasan penolakan bukti pembayaran (Wajib jika action = REJECT)',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Dana Rp 7.812.000 telah terverifikasi masuk ke rekening operasional WMS',
    description: 'Catatan admin terkait hasil verifikasi',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
