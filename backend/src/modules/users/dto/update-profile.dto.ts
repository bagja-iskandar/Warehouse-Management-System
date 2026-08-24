import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Hendra Prasetya Wijaya',
    description: 'Updated PIC / Full Name',
  })
  @IsOptional()
  @IsString({ message: 'Nama lengkap harus berupa teks' })
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong jika disertakan' })
  name?: string;

  @ApiPropertyOptional({
    example: '081299887766',
    description: 'Updated phone / WhatsApp number',
  })
  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'PT Fresh Foods Indonesia Tbk',
    description: 'Updated company or corporate entity name',
  })
  @IsOptional()
  @IsString({ message: 'Nama perusahaan harus berupa teks' })
  companyName?: string;

  @ApiPropertyOptional({
    example: 'Kawasan Industri Cikarang Blok C-12, Bekasi',
    description: 'Updated physical company address',
  })
  @IsOptional()
  @IsString({ message: 'Alamat lengkap harus berupa teks' })
  address?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    description: 'Profile avatar image URL',
  })
  @IsOptional()
  @IsString({ message: 'URL avatar harus berupa teks' })
  avatarUrl?: string;
}
