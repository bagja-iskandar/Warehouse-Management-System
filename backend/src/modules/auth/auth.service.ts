import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  AuthTokensDto,
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mengautentikasi pengguna berdasarkan email dan password, kemudian menerbitkan access token dan refresh token.
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Akun Anda dinonaktifkan / disuspend. Hubungi Administrator.',
      );
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Akun Anda masih dalam proses verifikasi email / registrasi.',
      );
    }

    // Generate token pair
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Simpan hash refresh token ke database
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const userProfile: UserProfileDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      companyName: user.companyName,
      address: user.address,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      ...tokens,
      user: userProfile,
    };
  }

  /**
   * Memperbarui Access Token menggunakan Refresh Token dengan mekanisme Token Rotation.
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'wms_development_super_secret_refresh_jwt_key_2026';

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid atau telah kedaluwarsa');
    }

    const tokenHash = this.hashToken(refreshToken);

    // Cari sesi refresh token di database
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      // Jika token sudah di-revoke atau tidak ditemukan, lakukan tindakan keamanan
      throw new UnauthorizedException('Refresh token telah dicabut atau sesi telah berakhir');
    }

    // Revoke token lama (Token Rotation)
    await this.prisma.refreshToken.updateMany({
      where: { userId: payload.sub, tokenHash },
      data: { isRevoked: true },
    });

    // Pastikan user masih aktif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Akun pengguna tidak valid atau sedang disuspend');
    }

    // Terbitkan token pair baru
    const newTokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Simpan refresh token baru
    await this.saveRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  /**
   * Mengakhiri sesi pengguna dan mencabut (revoke) refresh token aktif.
   */
  async logout(userId: string, refreshToken?: string): Promise<LogoutResponseDto> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          tokenHash,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
    } else {
      // Revoke semua sesi aktif milik pengguna
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          isRevoked: false,
        },
        data: { isRevoked: true },
      });
    }

    return {
      success: true,
      message: 'Sesi berhasil diakhiri dan token berhasil dicabut',
    };
  }

  /**
   * Mengambil profil lengkap pengguna yang sedang terotentikasi.
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Profil pengguna tidak ditemukan');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      companyName: user.companyName,
      address: user.address,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Helper internal untuk membuat Access Token dan Refresh Token JWT.
   */
  private async generateTokens(payload: JwtPayload): Promise<AuthTokensDto> {
    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') ||
      'wms_development_super_secret_access_jwt_key_2026';
    const accessExpiration = this.configService.get<string>('jwt.accessExpiration') || '15m';

    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      'wms_development_super_secret_refresh_jwt_key_2026';
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(
        { ...payload, jti: crypto.randomUUID() },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiration as any,
        },
      ),
    ]);

    // Hitung perkiraan expiresIn dalam detik (15m = 900 detik)
    const expiresInSeconds = this.parseDurationToSeconds(accessExpiration);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Helper internal untuk menyimpan hashed refresh token ke database.
   */
  private async saveRefreshToken(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') || '7d';
    const expiryDays = this.parseDurationToDays(refreshExpiration);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        isRevoked: false,
      },
    });
  }

  /**
   * Hash token menggunakan SHA-256 untuk penyimpanan aman di tabel refresh_tokens.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse durasi string (e.g. '15m', '1h', '7d') ke detik.
   */
  private parseDurationToSeconds(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  /**
   * Parse durasi string ke hari (default 7 hari).
   */
  private parseDurationToDays(duration: string): number {
    if (duration.endsWith('d')) {
      return parseInt(duration.slice(0, -1), 10) || 7;
    }
    return 7;
  }
}
