import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'admin@wms.id',
    description: 'Registered work email address of the account',
  })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

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
