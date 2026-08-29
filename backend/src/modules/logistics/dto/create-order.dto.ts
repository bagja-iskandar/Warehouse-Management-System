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
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'brg-001', description: 'Goods Item ID (GoodsItem)' })
  @IsString()
  @IsNotEmpty({ message: 'Goods ID is required' })
  goodsId: string;

  @ApiProperty({ example: 10, description: 'Quantity of items to pickup or deliver' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class CreateDeliveryOrderDto {
  @ApiProperty({
    enum: OrderType,
    example: OrderType.PICKUP,
    description:
      'Delivery order type: PICKUP (Inbound from customer to warehouse) or DELIVERY (Outbound from warehouse to destination address)',
  })
  @IsEnum(OrderType, { message: 'Invalid delivery order type' })
  type: OrderType;

  @ApiProperty({
    example: ['brg-001'],
    description: 'List of GoodsItem IDs to load onto fleet vehicle',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Must include at least 1 goods item' })
  @IsString({ each: true })
  goodsItemIds: string[];

  @ApiPropertyOptional({
    description: 'Detailed item breakdown with requested quantities (Optional)',
    type: [CreateOrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiPropertyOptional({
    example: 'wh-jkt-central',
    description: 'Origin or destination Warehouse Facility ID',
  })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiProperty({
    example: 'Sudirman Cold Chain Hub, Kav. 21, South Jakarta',
    description: 'Full origin / pickup address',
  })
  @IsString()
  @IsNotEmpty({ message: 'Origin address is required' })
  originAddress: string;

  @ApiProperty({ example: 'South Jakarta', description: 'Origin city' })
  @IsString()
  @IsNotEmpty({ message: 'Origin city is required' })
  originCity: string;

  @ApiProperty({
    example: 'Pulo Gadung Industrial Zone Kav. 12-14, East Jakarta',
    description: 'Full destination / drop-off address',
  })
  @IsString()
  @IsNotEmpty({ message: 'Destination address is required' })
  destinationAddress: string;

  @ApiProperty({ example: 'East Jakarta', description: 'Destination city' })
  @IsString()
  @IsNotEmpty({ message: 'Destination city is required' })
  destinationCity: string;

  @ApiProperty({
    example: '2026-08-01',
    description: 'Scheduled delivery date (format YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate: string;

  @ApiProperty({
    example: '08:00 - 12:00 WIB',
    description: 'Delivery time slot',
  })
  @IsString()
  @IsNotEmpty({ message: 'Time slot is required' })
  scheduledTimeSlot: string;

  @ApiPropertyOptional({
    example: 'veh-01',
    description: 'Assigned vehicle ID (Optional, can be allocated during dispatch)',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({
    example: 'usr-driver-1',
    description: 'Assigned driver ID (Optional)',
  })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({
    example: 'usr-cust-1',
    description: 'Target Customer ID (Admin only; Customer role automatically uses own ID)',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 28.5, description: 'Estimated route distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distanceKm?: number = 0;

  @ApiPropertyOptional({ example: 60, description: 'Estimated route duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedDurationMins?: number = 0;
}
