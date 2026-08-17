import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitPodDto {
  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
    description: 'URL foto dokumentasi serah terima kargo Digital POD (MinIO/S3)',
  })
  @IsString()
  @IsNotEmpty({ message: 'URL bukti foto serah terima wajib disertakan' })
  proofOfDeliveryUrl: string;

  @ApiProperty({
    example: 'Bpk. Ahmad Subarjo',
    description: 'Nama terang pihak penerima kargo',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama penerima barang wajib diisi' })
  recipientName: string;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    description: 'Data tanda tangan digital elektronik (E-signature base64/SVG)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tanda tangan digital penerima wajib disertakan' })
  recipientSignature: string;

  @ApiPropertyOptional({
    example: 5.0,
    description: 'Penilaian performa pengiriman driver (skala 1.0 - 5.0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1.0, { message: 'Rating minimal 1.0' })
  @Max(5.0, { message: 'Rating maksimal 5.0' })
  driverRating?: number;
}
