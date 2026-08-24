import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomerDetailDto, UsersService } from './users.service';

@ApiTags('Users & Profiles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('customers')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Seluruh Pelanggan & Tenant (Admin Only)',
    description:
      'Mengambil daftar seluruh akun Customer/Tenant beserta statistik volume sewa gudang dan status tagihan faktur.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar customer berhasil diambil',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak mengakses direktori customer',
  })
  async findCustomers(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: CustomerDetailDto[] }> {
    const data = await this.usersService.findCustomers(currentUser);
    return {
      message: 'Daftar customer berhasil diambil',
      data,
    };
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Memperbarui Profil Pengguna (Update Profile)',
    description:
      'Mengubah data profil pengguna (nama, kontak, perusahaan, alamat, avatar). Hanya pemilik akun atau Admin yang diizinkan melakukan perubahan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik pengguna (misal: usr-admin-1 atau UUID)',
    example: 'usr-admin-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil pengguna berhasil diperbarui',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi form gagal atau data tidak valid',
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak diizinkan mengubah data profil pengguna lain',
  })
  @ApiResponse({
    status: 404,
    description: 'Pengguna tidak ditemukan',
  })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.updateProfile(id, dto, currentUser);
    return {
      message: 'Profil pengguna berhasil diperbarui',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Memperbarui Data Pengguna / Customer (Admin / Self)',
    description:
      'Mengubah data lengkap pengguna (nama, email, nomor kontak, perusahaan, alamat, dan status akun). Perubahan status hanya diizinkan untuk Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik pengguna',
    example: 'd3037ec9-c19c-455a-9e0e-9e57309d4b5b',
  })
  @ApiResponse({
    status: 200,
    description: 'Data pengguna berhasil diperbarui',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi gagal atau email sudah terdaftar',
  })
  @ApiResponse({
    status: 403,
    description: 'Akses ditolak',
  })
  @ApiResponse({
    status: 404,
    description: 'Pengguna tidak ditemukan',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.updateUser(id, dto, currentUser);
    return {
      message: 'Data pengguna berhasil diperbarui',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menghapus Akun Pengguna / Customer Secara Permanen (Admin Only)',
    description:
      'Menghapus akun pengguna beserta seluruh relasi dependensi (barang, faktur, mutasi, pesanan) secara transaksional.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik pengguna yang akan dihapus',
    example: 'd3037ec9-c19c-455a-9e0e-9e57309d4b5b',
  })
  @ApiResponse({
    status: 200,
    description: 'Pengguna berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Tidak dapat menghapus akun Admin yang sedang aktif',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak menghapus akun pengguna',
  })
  @ApiResponse({
    status: 404,
    description: 'Pengguna tidak ditemukan',
  })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string; deletedId: string }> {
    return this.usersService.deleteUser(id, currentUser);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Daftar Seluruh Pengguna (Admin Only)',
    description:
      'Mengambil daftar seluruh pengguna terdaftar dalam sistem dengan rincian peran (Admin, Customer, Driver).',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar pengguna berhasil diambil',
    type: [UserProfileDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Admin yang berhak melihat daftar seluruh pengguna',
  })
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto[] }> {
    const data = await this.usersService.findAll(currentUser);
    return {
      message: 'Daftar pengguna berhasil diambil',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan Data Detail Pengguna Berdasarkan ID',
    description:
      'Mengambil informasi lengkap profil pengguna tertentu. Pengguna hanya dapat melihat data dirinya sendiri kecuali Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID unik pengguna',
    example: 'usr-admin-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail pengguna berhasil diambil',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak diizinkan melihat data profil pengguna lain',
  })
  @ApiResponse({
    status: 404,
    description: 'Pengguna tidak ditemukan',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const data = await this.usersService.findById(id, currentUser);
    return {
      message: 'Detail pengguna berhasil diambil',
      data,
    };
  }
}
