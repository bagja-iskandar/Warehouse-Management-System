import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan status dibaca (true / false)',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    enum: NotificationCategory,
    description: 'Filter berdasarkan kategori notifikasi',
  })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;
}
