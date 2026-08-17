import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUserProfile = {
    id: 'usr-admin-1',
    name: 'Budi Santoso',
    email: 'admin@wms.id',
    role: UserRole.ADMIN,
    phone: '081234567890',
    avatarUrl: null,
    companyName: 'PT Logistik Prima Nusantara',
    address: 'Jakarta',
    status: UserStatus.ACTIVE,
    createdAt: '2026-08-16T14:00:00.000Z',
  };

  const mockLoginResponse = {
    accessToken: 'mock_access_token',
    refreshToken: 'mock_refresh_token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: mockUserProfile,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockLoginResponse),
            refreshTokens: jest.fn().mockResolvedValue({
              accessToken: 'new_mock_access_token',
              refreshToken: 'new_mock_refresh_token',
              tokenType: 'Bearer',
              expiresIn: 900,
            }),
            logout: jest.fn().mockResolvedValue({
              success: true,
              message: 'Sesi berhasil diakhiri dan token telah dicabut',
            }),
            getProfile: jest.fn().mockResolvedValue(mockUserProfile),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return wrapped login response with message', async () => {
      const response = await controller.login({
        email: 'admin@wms.id',
        password: 'Password123!',
      });

      expect(response.message).toBe('Login berhasil');
      expect(response.data.accessToken).toBe('mock_access_token');
      expect(response.data.user.email).toBe('admin@wms.id');
    });
  });

  describe('refresh', () => {
    it('should return wrapped refresh tokens response', async () => {
      const response = await controller.refresh({
        refreshToken: 'mock_refresh_token',
      });

      expect(response.message).toBe('Pembaruan token berhasil');
      expect(response.data.accessToken).toBe('new_mock_access_token');
    });
  });

  describe('logout', () => {
    it('should return wrapped logout message', async () => {
      const response = await controller.logout('usr-admin-1', {});

      expect(response.message).toContain('berhasil');
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      const response = await controller.getMe({
        id: 'usr-admin-1',
        email: 'admin@wms.id',
        name: 'Budi Santoso',
        role: UserRole.ADMIN,
        phone: '081234567890',
        status: UserStatus.ACTIVE,
      });

      expect(response.message).toBe('Profil pengguna berhasil diambil');
      expect(response.data.id).toBe('usr-admin-1');
    });
  });
});
