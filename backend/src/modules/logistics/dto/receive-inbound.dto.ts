import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ReceiveInboundDto {
  @ApiProperty({
    example: 100,
    description: 'Physical item quantity received in good condition',
  })
  @IsInt({ message: 'Received quantity must be an integer' })
  @Min(0, { message: 'Received quantity cannot be negative' })
  receivedQuantity: number;

  @ApiProperty({
    example: 0,
    description: 'Item quantity damaged upon arrival',
  })
  @IsInt({ message: 'Damaged quantity must be an integer' })
  @Min(0, { message: 'Damaged quantity cannot be negative' })
  damagedQuantity: number;

  @ApiProperty({
    example: 0,
    description: 'Item quantity missing relative to cargo manifest',
  })
  @IsInt({ message: 'Missing quantity must be an integer' })
  @Min(0, { message: 'Missing quantity cannot be negative' })
  missingQuantity: number;

  @ApiProperty({
    example: 'GOOD',
    description: 'Overall physical condition of received goods (GOOD, DAMAGED, PARTIAL)',
  })
  @IsNotEmpty({ message: 'Receiving condition is required' })
  @IsString()
  condition: string;

  @ApiPropertyOptional({
    example: 'Seals intact, cold chain temperature optimally maintained at loading dock',
    description: 'Additional notes from warehouse receiving team',
  })
  @IsOptional()
  @IsString()
  receivingNotes?: string;
}
