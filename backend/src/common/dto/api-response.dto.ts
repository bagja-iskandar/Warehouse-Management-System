import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseMetaDto {
  @ApiPropertyOptional({ example: 1, description: 'Current page number' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  limit?: number;

  @ApiPropertyOptional({ example: 50, description: 'Total item count across all pages' })
  totalItems?: number;

  @ApiPropertyOptional({ example: 5, description: 'Total pages available' })
  totalPages?: number;

  @ApiProperty({ example: '2026-08-16T19:30:00.000Z', description: 'ISO 8601 UTC timestamp' })
  timestamp: string;

  @ApiPropertyOptional({ example: '/api/v1/health/liveness', description: 'Request path' })
  path?: string;

  @ApiPropertyOptional({ example: 'req-uuid-1234', description: 'Unique correlation/request ID' })
  correlationId?: string;
}

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true, description: 'Status of the operation' })
  success: boolean;

  @ApiProperty({ example: 'Request successful', description: 'Human-readable message' })
  message: string;

  @ApiPropertyOptional({ description: 'Payload data' })
  data: T | null;

  @ApiProperty({ type: ResponseMetaDto, description: 'Response metadata' })
  meta: ResponseMetaDto;
}

export class ValidationErrorDetailDto {
  @ApiProperty({ example: 'email', description: 'Field that failed validation' })
  field: string;

  @ApiProperty({ example: 'Email format is invalid', description: 'Error description' })
  message: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Failed status' })
  success: boolean;

  @ApiProperty({ example: 'Validation failed', description: 'Error summary message' })
  message: string;

  @ApiProperty({ example: null, description: 'Null data payload on error' })
  data: null;

  @ApiPropertyOptional({
    type: [ValidationErrorDetailDto],
    description: 'Detailed field validation errors if applicable',
  })
  errors?: ValidationErrorDetailDto[];

  @ApiPropertyOptional({ example: 'CONFLICT', description: 'Standard business error code' })
  code?: string;

  @ApiProperty({ type: ResponseMetaDto, description: 'Response metadata' })
  meta: ResponseMetaDto;

  @ApiProperty({ example: 400, description: 'HTTP Status code' })
  statusCode: number;
}
