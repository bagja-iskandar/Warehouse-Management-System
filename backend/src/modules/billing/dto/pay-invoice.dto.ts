import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayInvoiceDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
    description: 'Metode pembayaran yang digunakan (BANK_TRANSFER, QRIS, VIRTUAL_ACCOUNT)',
  })
  @IsEnum(PaymentMethod, { message: 'Metode pembayaran tidak valid' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    description: 'URL bukti transfer / pembayaran dari penyimpanan objek (MinIO/S3)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Bukti transfer pembayaran wajib disertakan' })
  paymentProofUrl: string;

  @ApiProperty({
    example: 7812000.0,
    description: 'Nominal pembayaran yang disetorkan (Wajib sesuai dengan total tagihan faktur)',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Nominal pembayaran harus berupa angka valid' })
  @Min(1, { message: 'Nominal pembayaran minimal Rp 1' })
  amount: number;

  @ApiPropertyOptional({
    example: 'TRX-BCA-8891230192',
    description: 'Nomor referensi mutasi bank atau kode Virtual Account transaksi',
  })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({
    example: 'Pembayaran tagihan sewa Cold Storage periode Agustus 2026',
    description: 'Catatan tambahan dari customer',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
