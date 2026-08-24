import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'usr-admin-1',
    name: 'Budi Santoso',
    email: 'admin@wms.id',
    passwordHash: '',
    role: UserRole.ADMIN,
    phone: '081234567890',
    avatarUrl: null,
    companyName: 'PT Logistik Prima Nusantara',
    address: 'Jakarta',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-08-16T14:00:00.000Z'),
    updatedAt: new Date('2026-08-16T14:00:00.000Z'),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Password123!', 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockImplementation((payload, options) => {
              if (options?.expiresIn === '7d') {
                return Promise.resolve('mock_refresh_token');
              }
              return Promise.resolve('mock_access_token');
            }),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.accessSecret') return 'test_access_secret';
              if (key === 'jwt.refreshSecret') return 'test_refresh_secret';
              if (key === 'jwt.accessExpiration') return '15m';
              if (key === 'jwt.refreshExpiration') return '7d';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should successfully authenticate user with valid credentials and return tokens without passwordHash', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as any);

      const result = await service.login({
        email: 'admin@wms.id',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(900);
      expect(result.user.email).toBe('admin@wms.id');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@wms.id',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.login({
          email: 'admin@wms.id',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user account is suspended', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(suspendedUser as any);

      await expect(
        service.login({
          email: 'admin@wms.id',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should successfully rotate tokens on valid refresh token', async () => {
      const mockPayload = { sub: 'usr-admin-1', email: 'admin@wms.id', role: UserRole.ADMIN };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(prisma.refreshToken, 'findFirst').mockResolvedValue({
        id: 'token-1',
        userId: 'usr-admin-1',
        tokenHash: 'hashed_token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        createdAt: new Date(),
      });
      jest.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as any);

      const result = await service.refreshTokens({
        refreshToken: 'mock_refresh_token',
      });

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'usr-admin-1', tokenHash: expect.any(String) },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException if refresh token signature is invalid', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens({ refreshToken: 'bad_token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is already revoked', async () => {
      const mockPayload = { sub: 'usr-admin-1', email: 'admin@wms.id', role: UserRole.ADMIN };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(prisma.refreshToken, 'findFirst').mockResolvedValue(null);

      await expect(service.refreshTokens({ refreshToken: 'revoked_token' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all user refresh tokens on logout without specific token', async () => {
      jest.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 2 } as any);

      const result = await service.logout('usr-admin-1');

      expect(result.success).toBe(true);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'usr-admin-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('getProfile', () => {
    it('should return safe user profile', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const profile = await service.getProfile('usr-admin-1');

      expect(profile.id).toBe('usr-admin-1');
      expect(profile.email).toBe('admin@wms.id');
      expect((profile as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile('unknown-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerCustomer', () => {
    const registerDto = {
      name: 'Hendra Pratama',
      email: 'newcustomer@freshfoods.id',
      phone: '081299887766',
      companyName: 'PT Fresh Foods Baru',
      address: 'Jl. Daan Mogot No. 10, Jakarta Barat',
      password: 'Password123!',
    };

    it('should successfully register customer, hash password, and return tokens with customer profile', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      const createdUser = {
        id: 'usr-new-1',
        name: registerDto.name,
        email: registerDto.email,
        passwordHash: 'hashed_password',
        role: UserRole.CUSTOMER,
        phone: registerDto.phone,
        avatarUrl: null,
        companyName: registerDto.companyName,
        address: registerDto.address,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-08-18T10:00:00.000Z'),
        updatedAt: new Date('2026-08-18T10:00:00.000Z'),
      };
      jest.spyOn(prisma.user, 'create').mockResolvedValue(createdUser as any);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as any);

      const result = await service.registerCustomer(registerDto);

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.role).toBe(UserRole.CUSTOMER);
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
        }),
      });
    });

    it('should throw ConflictException if company email is already registered', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(service.registerCustomer(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password and revoke active refresh tokens', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.refreshToken, 'updateMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.changePassword('usr-admin-1', {
        currentPassword: 'Password123!',
        newPassword: 'NewSecretPassword2026!',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password berhasil diperbarui');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-admin-1' },
        data: { passwordHash: expect.any(String) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'usr-admin-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.changePassword('usr-admin-1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewSecretPassword2026!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if new password is identical to current password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.changePassword('usr-admin-1', {
          currentPassword: 'Password123!',
          newPassword: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
