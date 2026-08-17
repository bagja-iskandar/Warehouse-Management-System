import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGoodsDto {
  @ApiProperty({
    example: 'Norwegian Salmon Fillet Grade A',
    description: 'Nama SKU / produk barang',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: 'Nama barang wajib berupa teks' })
  @MinLength(2, { message: 'Nama barang minimal 2 karakter' })
  @MaxLength(200, { message: 'Nama barang maksimal 200 karakter' })
  name: string;

  @ApiProperty({
    enum: GoodsCategory,
    example: GoodsCategory.COLD_FOOD,
    description: 'Kategori barang (FURNITURE, COLD_FOOD, GENERAL_ELECTRONICS, TEXTILE)',
  })
  @IsEnum(GoodsCategory, { message: 'Kategori barang tidak valid' })
  category: GoodsCategory;

  @ApiProperty({
    example: 'Ikan salmon beku kualitas ekspor dalam kemasan insulated box vakum.',
    description: 'Deskripsi rinci spesifikasi barang',
  })
  @IsString({ message: 'Deskripsi wajib berupa teks' })
  @MinLength(5, { message: 'Deskripsi minimal 5 karakter' })
  description: string;

  @ApiProperty({ example: 120.0, description: 'Panjang per unit dalam cm (centimeter)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Panjang harus berupa angka numerik' })
  @Min(1, { message: 'Panjang minimal 1 cm' })
  lengthCm: number;

  @ApiProperty({ example: 80.0, description: 'Lebar per unit dalam cm (centimeter)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Lebar harus berupa angka numerik' })
  @Min(1, { message: 'Lebar minimal 1 cm' })
  widthCm: number;

  @ApiProperty({ example: 100.0, description: 'Tinggi per unit dalam cm (centimeter)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tinggi harus berupa angka numerik' })
  @Min(1, { message: 'Tinggi minimal 1 cm' })
  heightCm: number;

  @ApiProperty({ example: 450.0, description: 'Total berat keseluruhan dalam kg' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Berat harus berupa angka numerik' })
  @Min(0.1, { message: 'Berat minimal 0.1 kg' })
  weightKg: number;

  @ApiProperty({ example: 30, description: 'Jumlah unit kemasan barang', default: 1 })
  @Type(() => Number)
  @IsNumber({}, { message: 'Kuantitas harus berupa angka numerik' })
  @Min(1, { message: 'Kuantitas minimal 1 unit' })
  quantity: number;

  @ApiProperty({ example: 'Master Box', description: 'Satuan unit (misal: Box, Pallet, Pcs)' })
  @IsString({ message: 'Satuan unit wajib berupa teks' })
  @MinLength(1, { message: 'Satuan unit tidak boleh kosong' })
  unit: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Apakah membutuhkan penyimpanan Cold Storage sub-zero',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresColdStorage?: boolean = false;

  @ApiPropertyOptional({ example: -22.0, description: 'Suhu minimum yang dibutuhkan (C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetTempMin?: number;

  @ApiPropertyOptional({ example: -18.0, description: 'Suhu maksimum yang dibutuhkan (C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetTempMax?: number;

  @ApiProperty({
    example: 'wh-jkt-central',
    description: 'ID fasilitas gudang tujuan penyimpanan',
  })
  @IsString({ message: 'ID gudang wajib disertakan' })
  warehouseId: string;

  @ApiPropertyOptional({
    example: 'usr-cust-1',
    description:
      'ID Customer pemilik barang (Hanya berlaku untuk peran ADMIN; peran Customer akan otomatis menggunakan ID sendiri)',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Apakah memerlukan penjemputan armada WMS (Inbound Pickup)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  pickupRequired?: boolean = false;

  @ApiPropertyOptional({
    example: 'Kavling Cold Chain Sudirman Kav. 21, Jakarta Selatan',
    description: 'Alamat lokasi penjemputan jika pickupRequired bernilai true',
  })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional({
    example: '2026-08-01T08:00:00.000Z',
    description: 'Jadwal tanggal/waktu penjemputan',
  })
  @IsOptional()
  @IsString()
  pickupDate?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    description: 'URL foto dokumentasi kargo barang',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
