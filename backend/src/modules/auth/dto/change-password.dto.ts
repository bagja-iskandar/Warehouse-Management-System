import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'Password123!',
    description: 'Current active password for account verification',
  })
  @IsNotEmpty({ message: 'Password saat ini wajib diisi' })
  @IsString({ message: 'Password saat ini harus berupa teks' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecretPass2026!',
    description: 'New password to be set (min 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @IsString({ message: 'Password baru harus berupa teks' })
  @MinLength(6, { message: 'Password baru minimal harus 6 karakter' })
  newPassword: string;
}
