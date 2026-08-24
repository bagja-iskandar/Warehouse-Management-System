import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  const mockAnalyticsService = {
    getAdminOverview: jest.fn(),
    getCustomerSummary: jest.fn(),
    getDriverSummary: jest.fn(),
  };

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@wms.id',
    name: 'Admin WMS',
    role: 'ADMIN',
    phone: '08123456789',
    status: 'ACTIVE',
  };

  const customerUser: AuthenticatedUser = {
    id: 'cust-1',
    email: 'customer@freshfoods.id',
    name: 'Customer User',
    role: 'CUSTOMER',
    phone: '08129988776',
    status: 'ACTIVE',
  };

  const driverUser: AuthenticatedUser = {
    id: 'drv-1',
    email: 'driver@wms.id',
    name: 'Driver Ahmad',
    role: 'DRIVER',
    phone: '08125544332',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAdminOverview', () => {
    it('should return admin analytics overview data', async () => {
      const mockOverview: any = {
        warehouse: { totalCapacityM3: 1000, usedCapacityM3: 450 },
        goods: { totalSkus: 10 },
        logistics: { totalOrders: 5 },
        billing: { paidRevenueRp: 12500000 },
        telemetry: { totalSensorNodesCount: 4 },
        recentActivities: [],
      };
      mockAnalyticsService.getAdminOverview.mockResolvedValue(mockOverview);

      const result = await controller.getAdminOverview();

      expect(result.message).toContain('berhasil diambil');
      expect(result.data).toEqual(mockOverview);
      expect(mockAnalyticsService.getAdminOverview).toHaveBeenCalled();
    });

    it('should forward warehouseId parameter to analytics service', async () => {
      const mockOverview: any = {
        warehouse: { totalCapacityM3: 3000, usedCapacityM3: 1400 },
        activeWarehouse: { code: 'WH-BDG-01', name: 'Gudang Distribusi Gedebage Cold Hub' },
      };
      mockAnalyticsService.getAdminOverview.mockResolvedValue(mockOverview);

      const result = await controller.getAdminOverview('wh-bdg-01');

      expect(result.data).toEqual(mockOverview);
      expect(mockAnalyticsService.getAdminOverview).toHaveBeenCalledWith('wh-bdg-01');
    });
  });

  describe('getCustomerSummary', () => {
    it('should return customer summary for authenticated customer', async () => {
      const mockSummary: any = {
        rentedSpaceM3: 250,
        usedSpaceM3: 185,
        totalSkus: 3,
      };
      mockAnalyticsService.getCustomerSummary.mockResolvedValue(mockSummary);

      const result = await controller.getCustomerSummary(customerUser);

      expect(result.data).toEqual(mockSummary);
      expect(mockAnalyticsService.getCustomerSummary).toHaveBeenCalledWith('cust-1');
    });

    it('should allow admin to specify target customerId', async () => {
      const mockSummary: any = { rentedSpaceM3: 300 };
      mockAnalyticsService.getCustomerSummary.mockResolvedValue(mockSummary);

      const result = await controller.getCustomerSummary(adminUser, 'target-cust-2');

      expect(result.data).toEqual(mockSummary);
      expect(mockAnalyticsService.getCustomerSummary).toHaveBeenCalledWith('target-cust-2');
    });
  });

  describe('getDriverSummary', () => {
    it('should return driver summary for authenticated driver', async () => {
      const mockSummary: any = {
        assignedVehicle: { plateNumber: 'B 9821 TKN' },
        activeTripsCount: 1,
      };
      mockAnalyticsService.getDriverSummary.mockResolvedValue(mockSummary);

      const result = await controller.getDriverSummary(driverUser);

      expect(result.data).toEqual(mockSummary);
      expect(mockAnalyticsService.getDriverSummary).toHaveBeenCalledWith('drv-1');
    });
  });
});
