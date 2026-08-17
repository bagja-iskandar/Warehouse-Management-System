import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDeliveryOrderDto {
  @ApiProperty({
    enum: OrderType,
    example: OrderType.PICKUP,
    description:
      'Jenis delivery order: PICKUP (Inbound dari customer ke gudang) atau DELIVERY (Outbound dari gudang ke alamat tujuan)',
  })
  @IsEnum(OrderType, { message: 'Tipe delivery order tidak valid' })
  type: OrderType;

  @ApiProperty({
    example: ['brg-001'],
    description: 'Daftar ID barang (GoodsItem) yang akan dimuat ke armada',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal harus menyertakan 1 ID barang' })
  @IsString({ each: true })
  goodsItemIds: string[];

  @ApiProperty({
    example: 'Kavling Cold Chain Sudirman Kav. 21, Jakarta Selatan',
    description: 'Alamat lengkap titik penjemputan / asal',
  })
  @IsString()
  @IsNotEmpty({ message: 'Alamat asal wajib diisi' })
  originAddress: string;

  @ApiProperty({ example: 'Jakarta Selatan', description: 'Kota titik asal' })
  @IsString()
  @IsNotEmpty({ message: 'Kota asal wajib diisi' })
  originCity: string;

  @ApiProperty({
    example: 'Kawasan Industri Pulo Gadung Kav. 12-14, Jakarta Timur',
    description: 'Alamat lengkap titik tujuan / pengantaran',
  })
  @IsString()
  @IsNotEmpty({ message: 'Alamat tujuan wajib diisi' })
  destinationAddress: string;

  @ApiProperty({ example: 'Jakarta Timur', description: 'Kota titik tujuan' })
  @IsString()
  @IsNotEmpty({ message: 'Kota tujuan wajib diisi' })
  destinationCity: string;

  @ApiProperty({
    example: '2026-08-01',
    description: 'Tanggal jadwal pengiriman (format YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tanggal jadwal wajib diisi' })
  scheduledDate: string;

  @ApiProperty({
    example: '08:00 - 12:00 WIB',
    description: 'Slot waktu jadwal pengiriman',
  })
  @IsString()
  @IsNotEmpty({ message: 'Slot waktu wajib diisi' })
  scheduledTimeSlot: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description:
      'ID kendaraan yang ditugaskan (Opsional, dapat dialokasikan saat penugasan armada)',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    example: 'usr-driver-1',
    description: 'ID driver yang ditugaskan (Opsional)',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    example: 'usr-cust-1',
    description:
      'ID Customer pemilik order (Hanya berlaku untuk peran ADMIN; peran Customer otomatis menggunakan ID sendiri)',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 28.5, description: 'Estimasi jarak tempuh rute dalam km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceKm?: number = 0;

  @ApiPropertyOptional({ example: 60, description: 'Estimasi durasi tempuh dalam menit' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedDurationMins?: number = 0;
}
