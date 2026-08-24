import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterCustomerDto {
  @ApiProperty({
    example: 'Hendra Pratama',
    description: 'PIC / Full Name of the customer representative',
  })
  @IsNotEmpty({ message: 'PIC full name wajib diisi' })
  @IsString({ message: 'PIC full name harus berupa teks' })
  name: string;

  @ApiProperty({
    example: 'hendra@freshfoods.id',
    description: 'Company or corporate email address',
  })
  @IsNotEmpty({ message: 'Email perusahaan wajib diisi' })
  @IsEmail({}, { message: 'Format email perusahaan tidak valid' })
  email: string;

  @ApiProperty({
    example: '081299887766',
    description: 'Phone / WhatsApp contact number',
  })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  phone: string;

  @ApiProperty({
    example: 'PT Fresh Foods Indonesia',
    description: 'Registered business or company name',
  })
  @IsNotEmpty({ message: 'Nama perusahaan wajib diisi' })
  @IsString({ message: 'Nama perusahaan harus berupa teks' })
  companyName: string;

  @ApiProperty({
    example: 'Jl. Industri Raya No. 45, Jakarta Barat',
    description: 'Physical company / business address',
  })
  @IsNotEmpty({ message: 'Alamat lengkap wajib diisi' })
  @IsString({ message: 'Alamat lengkap harus berupa teks' })
  address: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account operational password (min 6 characters)',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @IsString({ message: 'Password harus berupa teks' })
  @MinLength(6, { message: 'Password minimal harus 6 karakter' })
  password: string;
}
