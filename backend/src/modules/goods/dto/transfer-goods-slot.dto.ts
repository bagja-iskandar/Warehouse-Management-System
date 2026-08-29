import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class TransferGoodsSlotDto {
  @ApiProperty({
    example: 'slot-bdg-c02',
    description: 'Target storage slot ID in the same warehouse facility',
  })
  @IsNotEmpty({ message: 'Target slot ID (targetSlotId) is required' })
  @IsString({ message: 'Target slot ID must be a string' })
  targetSlotId: string;

  @ApiProperty({
    example: 'Cold cargo layout reorganization and rack capacity optimization',
    description: 'Operational reason for transferring goods storage slot',
    minLength: 3,
  })
  @IsNotEmpty({ message: 'Transfer reason is required' })
  @IsString({ message: 'Transfer reason must be text' })
  @MinLength(3, { message: 'Transfer reason must be at least 3 characters' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Relocated to level 2 rack #02 for improved forklift access',
    description: 'Additional notes regarding physical placement in new slot',
  })
  @IsOptional()
  @IsString({ message: 'Additional note must be text' })
  note?: string;
}
