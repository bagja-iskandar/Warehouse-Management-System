import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@prisma/client';
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/** TTL for password reset tokens: 1 hour */
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

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
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account is suspended. Please contact Administrator.');
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException('Your account is pending verification.');
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
   * Mendaftarkan akun customer baru, meng-hash password, dan langsung menerbitkan JWT tokens.
   */
  async registerCustomer(dto: RegisterCustomerDto): Promise<LoginResponseDto> {
    const emailNormalized = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new ConflictException('Email perusahaan sudah terdaftar dalam sistem');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: emailNormalized,
        passwordHash,
        phone: dto.phone.trim(),
        companyName: dto.companyName.trim(),
        address: dto.address.trim(),
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });

    // Generate token pair
    const tokens = await this.generateTokens({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Simpan hash refresh token ke database
    await this.saveRefreshToken(newUser.id, tokens.refreshToken);

    const userProfile: UserProfileDto = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatarUrl: newUser.avatarUrl,
      companyName: newUser.companyName,
      address: newUser.address,
      status: newUser.status,
      createdAt: newUser.createdAt.toISOString(),
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
      throw new UnauthorizedException('User profile not found');
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
   * Mengubah password pengguna, memverifikasi password lama, dan merevoke refresh token aktif.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or invalid session');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password cannot be the same as the old password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke seluruh active refresh tokens untuk keamanan sesi
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: { isRevoked: true },
    });

    return {
      success: true,
      message: 'Password successfully updated',
    };
  }

  /**
   * Step 1 of Secure Password Reset: Request a reset token.
   * Generates a cryptographically-secure one-time token, stores its SHA-256 hash
   * in the database with a 1-hour expiry. Always returns a generic success message
   * to prevent user enumeration attacks.
   *
   * NOTE: Token delivery (email/SMS) requires external infrastructure configuration.
   * In development, the raw token is returned in the response body for integration testing.
   * In production, REMOVE the token from the response and deliver it via a secure channel.
   */
  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Generic success message to prevent email enumeration
    if (!user || user.status === UserStatus.SUSPENDED) {
      return {
        success: true,
        message: 'If the email is registered and active, a reset token has been generated.',
      };
    }

    // Invalidate any existing unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    // Generate 64-byte cryptographically-secure raw token
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        isUsed: false,
      },
    });

    this.logger.log(
      `Password reset token generated for user ${user.id} (expires: ${expiresAt.toISOString()})`,
    );

    // TODO: In production, send rawToken via email/SMS and do NOT return it in the response.
    // For development/staging integration testing only:
    return {
      success: true,
      message: 'If the email is registered and active, a reset token has been generated.',
      resetToken: rawToken,
    };
  }

  /**
   * Step 2 of Secure Password Reset: Confirm reset using token.
   * Validates the hashed token, ensures it is unused and not expired,
   * updates the user password, marks the token used, and revokes all sessions.
   */
  async confirmPasswordReset(
    rawToken: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!rawToken || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    const tokenHash = this.hashToken(rawToken);

    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new BadRequestException(
        'Password reset token is invalid, expired, or has already been used.',
      );
    }

    if (resetRecord.user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account is suspended. Please contact administrator.');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Execute atomically: update password, mark token used, revoke all sessions
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    this.logger.log(`Password successfully reset for user ${resetRecord.userId}`);

    return {
      success: true,
      message: 'Password successfully reset. Please sign in with your new credentials.',
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
