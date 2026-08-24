import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockCustomerUser = {
    id: 'usr-cust-1',
    name: 'Hendra Pratama',
    email: 'customer@freshfoods.id',
    passwordHash: 'hashed_secret',
    role: UserRole.CUSTOMER,
    phone: '081299887766',
    avatarUrl: null,
    companyName: 'PT Fresh Foods Indonesia',
    address: 'Jakarta Barat',
    status: UserStatus.ACTIVE,
    createdAt: new Date('2026-08-16T14:00:00.000Z'),
    updatedAt: new Date('2026-08-16T14:00:00.000Z'),
  };

  const customerAuthUser: AuthenticatedUser = {
    id: 'usr-cust-1',
    email: 'customer@freshfoods.id',
    name: 'Hendra Pratama',
    role: UserRole.CUSTOMER,
    phone: '081299887766',
    avatarUrl: null,
    companyName: 'PT Fresh Foods Indonesia',
    address: 'Jakarta Barat',
    status: UserStatus.ACTIVE,
  };

  const adminAuthUser: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    avatarUrl: null,
    companyName: 'WMS Central',
    address: 'Jakarta',
    status: UserStatus.ACTIVE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should successfully update own profile', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCustomerUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockCustomerUser,
        name: 'Hendra Pratama Updated',
        companyName: 'PT Fresh Foods Sukses',
      } as any);

      const result = await service.updateProfile(
        'usr-cust-1',
        {
          name: 'Hendra Pratama Updated',
          companyName: 'PT Fresh Foods Sukses',
        },
        customerAuthUser,
      );

      expect(result.id).toBe('usr-cust-1');
      expect(result.name).toBe('Hendra Pratama Updated');
      expect(result.companyName).toBe('PT Fresh Foods Sukses');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should allow Admin to update any user profile', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCustomerUser as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockCustomerUser,
        name: 'Hendra Admin Edit',
      } as any);

      const result = await service.updateProfile(
        'usr-cust-1',
        { name: 'Hendra Admin Edit' },
        adminAuthUser,
      );

      expect(result.name).toBe('Hendra Admin Edit');
    });

    it('should throw ForbiddenException if customer tries to update another user profile', async () => {
      await expect(
        service.updateProfile('usr-cust-2', { name: 'Hacker Edit' }, customerAuthUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfile('usr-cust-1', { name: 'Test' }, customerAuthUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return list of users for Admin', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([mockCustomerUser as any]);

      const result = await service.findAll(adminAuthUser);

      expect(result.length).toBe(1);
      expect(result[0].email).toBe('customer@freshfoods.id');
    });

    it('should throw ForbiddenException if non-admin calls findAll', async () => {
      await expect(service.findAll(customerAuthUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return user detail for own profile', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCustomerUser as any);

      const result = await service.findById('usr-cust-1', customerAuthUser);

      expect(result.id).toBe('usr-cust-1');
      expect(result.email).toBe('customer@freshfoods.id');
    });

    it('should throw ForbiddenException if user tries to view another user detail', async () => {
      await expect(service.findById('usr-cust-2', customerAuthUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
