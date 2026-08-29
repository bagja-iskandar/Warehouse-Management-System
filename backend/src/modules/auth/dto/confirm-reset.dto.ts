import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Secure reset token received from the reset request',
  })
  @IsNotEmpty({ message: 'Token wajib diisi' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewSecretPass2026!',
    description: 'New password to set (min 8 characters)',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @IsString({ message: 'Password baru harus berupa teks' })
  @MinLength(8, { message: 'Password baru minimal harus 8 karakter' })
  newPassword: string;
}
