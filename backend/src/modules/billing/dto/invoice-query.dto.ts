import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: InvoiceStatus,
    description:
      'Filter berdasarkan status tagihan faktur (UNPAID, PENDING_PAYMENT, PAID, OVERDUE, CANCELLED)',
    example: InvoiceStatus.UNPAID,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, { message: 'Status invoice tidak valid' })
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    description: 'Filter tagihan milik Customer tertentu (Hanya diizinkan untuk peran ADMIN)',
    example: 'usr-cust-1',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan bulan periode penagihan (contoh: Agustus 2026)',
    example: 'Agustus 2026',
  })
  @IsOptional()
  @IsString()
  billingMonth?: string;

  @ApiPropertyOptional({
    description: 'Field pengurutan data tagihan',
    enum: ['dueDate', 'issueDate', 'createdAt', 'totalAmount'],
    default: 'dueDate',
  })
  @IsOptional()
  @IsIn(['dueDate', 'issueDate', 'createdAt', 'totalAmount'], {
    message: 'Field pengurutan tidak valid (pilihan: dueDate, issueDate, createdAt, totalAmount)',
  })
  sortBy?: string = 'dueDate';

  @ApiPropertyOptional({
    description: 'Arah pengurutan data',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'], {
    message: 'Arah pengurutan harus asc atau desc',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
