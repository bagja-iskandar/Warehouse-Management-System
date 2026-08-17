import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: 'usr-admin-1', description: 'Unique user identifier' })
  id: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'admin@wms.id', description: 'Registered email' })
  email: string;

  @ApiProperty({ enum: UserRole, example: 'ADMIN', description: 'Assigned RBAC role' })
  role: UserRole;

  @ApiProperty({ example: '081234567890', description: 'Phone contact number' })
  phone: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile avatar URL',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'PT Logistik Prima Nusantara', description: 'Company name' })
  companyName?: string | null;

  @ApiPropertyOptional({ example: 'Kawasan Industri Pulo Gadung', description: 'Physical address' })
  address?: string | null;

  @ApiProperty({ enum: UserStatus, example: 'ACTIVE', description: 'Current account status' })
  status: UserStatus;

  @ApiProperty({ example: '2026-08-16T14:00:00.000Z', description: 'Account creation timestamp' })
  createdAt: string;
}

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived JWT Access Token (default: 15m)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Long-lived JWT Refresh Token for token rotation (default: 7d)',
  })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer', description: 'HTTP Authorization Scheme' })
  tokenType: string;

  @ApiProperty({ example: 900, description: 'Access token expiration in seconds' })
  expiresIn: number;
}

export class LoginResponseDto extends AuthTokensDto {
  @ApiProperty({ type: UserProfileDto, description: 'Authenticated user profile' })
  user: UserProfileDto;
}

export class RefreshTokenResponseDto extends AuthTokensDto {}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Sesi berhasil diakhiri dan token di-revoke' })
  message: string;
}
