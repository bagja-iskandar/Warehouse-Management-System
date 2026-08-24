import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Haidar Nusantara',
    description: 'Updated full name / PIC',
  })
  @IsOptional()
  @IsString({ message: 'Nama lengkap harus berupa teks' })
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong jika disertakan' })
  name?: string;

  @ApiPropertyOptional({
    example: 'haidar@gmail.com',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format alamat email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    example: 'PT Haidar Food Nusantara',
    description: 'Updated corporate entity name',
  })
  @IsOptional()
  @IsString({ message: 'Nama perusahaan harus berupa teks' })
  companyName?: string;

  @ApiPropertyOptional({
    example: '081299887766',
    description: 'Updated phone or WhatsApp number',
  })
  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'Kawasan Industri Cakung Blok B-5, Jakarta Timur',
    description: 'Updated physical address',
  })
  @IsOptional()
  @IsString({ message: 'Alamat lengkap harus berupa teks' })
  address?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Account operational status',
  })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: 'Status pengguna harus berupa ACTIVE, SUSPENDED, atau PENDING_VERIFICATION',
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    description: 'Avatar image URL',
  })
  @IsOptional()
  @IsString({ message: 'URL avatar harus berupa teks' })
  avatarUrl?: string;
}
