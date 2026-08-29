import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoodsCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGoodsDto {
  @ApiProperty({
    example: 'Atlantic Salmon Fillet Premium',
    description: 'Goods name / SKU title',
    minLength: 2,
    maxLength: 200,
  })
  @IsString({ message: 'Goods name must be text' })
  @MinLength(2, { message: 'Goods name must be at least 2 characters' })
  @MaxLength(200, { message: 'Goods name cannot exceed 200 characters' })
  name: string;

  @ApiProperty({
    enum: GoodsCategory,
    example: GoodsCategory.COLD_FOOD,
    description: 'Goods category (FURNITURE, COLD_FOOD, GENERAL_ELECTRONICS, TEXTILE)',
  })
  @IsEnum(GoodsCategory, { message: 'Invalid goods category' })
  category: GoodsCategory;

  @ApiProperty({
    example: 'Export-grade frozen salmon fillet packed in vacuum-sealed insulated boxes.',
    description: 'Detailed goods description',
  })
  @IsString({ message: 'Description must be text' })
  @MinLength(5, { message: 'Description must be at least 5 characters' })
  description: string;

  @ApiProperty({ example: 120.0, description: 'Length per unit in cm' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Length must be a number' })
  @Min(1, { message: 'Length must be at least 1 cm' })
  lengthCm: number;

  @ApiProperty({ example: 80.0, description: 'Width per unit in cm' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Width must be a number' })
  @Min(1, { message: 'Width must be at least 1 cm' })
  widthCm: number;

  @ApiProperty({ example: 100.0, description: 'Height per unit in cm' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Height must be a number' })
  @Min(1, { message: 'Height must be at least 1 cm' })
  heightCm: number;

  @ApiProperty({ example: 450.0, description: 'Total weight in kg' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.1, { message: 'Weight must be at least 0.1 kg' })
  weightKg: number;

  @ApiProperty({ example: 30, description: 'Quantity of units', default: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be a whole number (integer)' })
  @Min(1, { message: 'Quantity must be at least 1 unit' })
  quantity: number;

  @ApiProperty({ example: 'Master Box', description: 'Packaging unit (e.g. Box, Pallet, Pcs)' })
  @IsString({ message: 'Packaging unit is required' })
  @MinLength(1, { message: 'Packaging unit cannot be empty' })
  unit: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Requires sub-zero cold storage facility',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresColdStorage?: boolean = false;

  @ApiPropertyOptional({ example: -22.0, description: 'Target minimum temperature (°C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetTempMin?: number;

  @ApiPropertyOptional({ example: -18.0, description: 'Target maximum temperature (°C)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetTempMax?: number;

  @ApiProperty({
    example: 'wh-jkt-central',
    description: 'Target warehouse facility ID',
  })
  @IsString({ message: 'Warehouse ID is required' })
  warehouseId: string;

  @ApiPropertyOptional({
    example: 'usr-cust-1',
    description: 'Customer owner ID (Admin only; Customer role automatically uses own ID)',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Requires inbound pickup service by fleet vehicle',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  pickupRequired?: boolean = false;

  @ApiPropertyOptional({
    example: 'Sudirman Cold Chain Hub, Kav. 21, South Jakarta',
    description: 'Pickup address if pickupRequired is true',
  })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional({
    example: '2026-08-01T08:00:00.000Z',
    description: 'Scheduled pickup timestamp',
  })
  @IsOptional()
  @IsString()
  pickupDate?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
    description: 'Cargo photo / document URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
