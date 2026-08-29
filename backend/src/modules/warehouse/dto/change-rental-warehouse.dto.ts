import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChangeRentalWarehouseDto {
  @ApiProperty({
    example: 'wh-jkt-central',
    description: 'Current source warehouse facility ID',
  })
  @IsString()
  @IsNotEmpty({ message: 'Source warehouse ID is required' })
  sourceWarehouseId: string;

  @ApiProperty({
    example: 'wh-bdg-01',
    description: 'Target warehouse facility ID for reallocation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Target warehouse ID is required' })
  targetWarehouseId: string;

  @ApiPropertyOptional({
    example: 'Change in logistics distribution center',
    description: 'Reason for warehouse transfer request',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
