import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autentikasi Pengguna & Penerbitan Token (Login)',
    description:
      'Memverifikasi kredensial email dan password pengguna, lalu menerbitkan JWT Access Token dan Refresh Token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autentikasi berhasil',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Kredensial tidak valid atau akun disuspend',
  })
  async login(@Body() loginDto: LoginDto): Promise<{ message: string; data: LoginResponseDto }> {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Login berhasil',
      data: result,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrasi Akun Customer Baru (Customer Onboarding)',
    description:
      'Mendaftarkan profil customer perusahaan baru, menyimpan password terenkripsi, dan langsung menerbitkan JWT Access Token dan Refresh Token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registrasi berhasil dan token diterbitkan',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validasi form gagal atau data tidak lengkap',
  })
  @ApiResponse({
    status: 409,
    description: 'Email perusahaan sudah terdaftar dalam sistem',
  })
  async register(
    @Body() registerDto: RegisterCustomerDto,
  ): Promise<{ message: string; data: LoginResponseDto }> {
    const result = await this.authService.registerCustomer(registerDto);
    return {
      message: 'Registrasi customer berhasil',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pembaruan Access Token (Token Rotation)',
    description:
      'Memperbarui Access Token yang telah kedaluwarsa menggunakan Refresh Token yang valid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pembaruan token berhasil',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token tidak valid atau telah dicabut',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string; data: RefreshTokenResponseDto }> {
    const result = await this.authService.refreshTokens(refreshTokenDto);
    return {
      message: 'Pembaruan token berhasil',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Pengakhiran Sesi & Revoke Refresh Token (Logout)',
    description: 'Mencabut refresh token pengguna dan mengakhiri sesi aktif dari perangkat.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil dan token dicabut',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  async logout(
    @CurrentUser('id') userId: string,
    @Body() logoutDto: LogoutDto,
  ): Promise<{ message: string; data: LogoutResponseDto }> {
    const result = await this.authService.logout(userId, logoutDto.refreshToken);
    return {
      message: result.message,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mendapatkan Profil Pengguna Terotentikasi (Session Check)',
    description: 'Mengembalikan data profil lengkap pengguna yang saat ini sedang login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil pengguna berhasil diambil',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak disertakan',
  })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; data: UserProfileDto }> {
    const profile = await this.authService.getProfile(user.id);
    return {
      message: 'Profil pengguna berhasil diambil',
      data: profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Mengubah Password Pengguna Terotentikasi (Change Password)',
    description:
      'Memverifikasi password saat ini dan memperbarui dengan password baru. Merevoke seluruh refresh token aktif untuk keamanan sesi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil diperbarui',
  })
  @ApiResponse({
    status: 400,
    description: 'Password baru sama dengan password lama atau validasi gagal',
  })
  @ApiResponse({
    status: 401,
    description: 'Password saat ini tidak valid atau token tidak valid',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string; data: { success: boolean; message: string } }> {
    const result = await this.authService.changePassword(userId, changePasswordDto);
    return {
      message: result.message,
      data: result,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atur Ulang Password Pengguna (Direct Password Reset)',
    description:
      'Mengatur ulang kata sandi pengguna terdaftar secara langsung melalui email terverifikasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil diatur ulang',
  })
  @ApiResponse({
    status: 404,
    description: 'Email tidak ditemukan dalam sistem',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; data: { success: boolean; message: string } }> {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return {
      message: result.message,
      data: result,
    };
  }
}
