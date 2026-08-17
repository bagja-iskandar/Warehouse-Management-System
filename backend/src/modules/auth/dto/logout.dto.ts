import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Specific refresh token to revoke. If omitted, all active sessions for the user will be revoked.',
  })
  @IsOptional()
  @IsString({ message: 'Refresh token harus berupa string' })
  refreshToken?: string;
}
