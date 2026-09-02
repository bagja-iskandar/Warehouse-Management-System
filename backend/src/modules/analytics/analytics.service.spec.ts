import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockPrisma = {
    warehouse: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    storageSlot: {
      findMany: jest.fn(),
    },
    goodsItem: {
      findMany: jest.fn(),
    },
    deliveryOrder: {
      findMany: jest.fn(),
    },
    vehicle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    telemetryLog: {
      findMany: jest.fn(),
    },
    goodsMutation: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminOverview', () => {
    it('should aggregate warehouse, goods, logistics, billing, telemetry, and activities accurately', async () => {
      mockPrisma.warehouse.findMany.mockResolvedValue([
        { totalCapacityM3: '1000.00', usedCapacityM3: '450.00' },
      ]);
      mockPrisma.storageSlot.findMany.mockResolvedValue([
        {
          id: 's1',
          status: 'OCCUPIED',
          zone: 'COLD_STORAGE',
          usedM3: '200',
          capacityM3: '400',
          temperatureCelsius: '-18.5',
          humidityPercent: '65',
        },
        {
          id: 's2',
          status: 'AVAILABLE',
          zone: 'STANDARD',
          usedM3: '0',
          capacityM3: '400',
          temperatureCelsius: '24.0',
          humidityPercent: '50',
        },
        {
          id: 's3',
          status: 'OCCUPIED',
          zone: 'HEAVY_DUTY',
          usedM3: '100',
          capacityM3: '200',
          temperatureCelsius: '25.0',
          humidityPercent: '55',
        },
      ]);
      mockPrisma.goodsItem.findMany.mockResolvedValue([
        {
          id: 'g1',
          quantity: 100,
          volumeM3: '50.00',
          category: 'COLD_FOOD',
          requiresColdStorage: true,
          status: 'STORED',
        },
        {
          id: 'g2',
          quantity: 20,
          volumeM3: '40.00',
          category: 'FURNITURE',
          requiresColdStorage: false,
          status: 'PENDING_PICKUP',
        },
      ]);
      mockPrisma.deliveryOrder.findMany.mockResolvedValue([
        {
          id: 'o1',
          status: 'DELIVERED',
          orderNumber: 'DO-01',
          destinationAddress: 'BSD',
          proofOfDeliveryUrl: 'https://pod.url',
          updatedAt: new Date(),
        },
        {
          id: 'o2',
          status: 'IN_TRANSIT',
          orderNumber: 'DO-02',
          destinationAddress: 'JKT',
          proofOfDeliveryUrl: null,
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.vehicle.findMany.mockResolvedValue([
        { id: 'v1', status: 'IN_SERVICE', hasRefrigeration: true },
        { id: 'v2', status: 'AVAILABLE', hasRefrigeration: false },
      ]);
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'i1', status: 'PAID', totalAmount: '12500000', penaltyFee: '0' },
        { id: 'i2', status: 'OVERDUE', totalAmount: '3850000', penaltyFee: '350000' },
      ]);
      mockPrisma.telemetryLog.findMany.mockResolvedValue([{ isAnomaly: false }]);
      mockPrisma.goodsMutation.findMany.mockResolvedValue([
        {
          id: 'm1',
          title: 'Goods Stored',
          description: 'Item stored in A-01',
          actorName: 'Admin',
          timestamp: new Date(),
        },
      ]);

      const result = await service.getAdminOverview();

      // Warehouse checks
      expect(result.warehouse.totalCapacityM3).toBe(1000);
      expect(result.warehouse.usedCapacityM3).toBe(450);
      expect(result.warehouse.utilizationPercent).toBe(45);
      expect(result.warehouse.totalSlots).toBe(3);
      expect(result.warehouse.occupiedSlots).toBe(2);
      expect(result.warehouse.availableSlots).toBe(1);

      // Goods checks
      expect(result.goods.totalSkus).toBe(2);
      expect(result.goods.totalQuantityKoli).toBe(120);
      expect(result.goods.totalVolumeM3).toBe(90);
      expect(result.goods.coldStorageSkusCount).toBe(1);
      expect(result.goods.heavyDutySkusCount).toBe(1);

      // Logistics checks
      expect(result.logistics.totalOrders).toBe(2);
      expect(result.logistics.inTransitOrders).toBe(1);
      expect(result.logistics.deliveredOrders).toBe(1);
      expect(result.logistics.verifiedPodOrders).toBe(1);
      expect(result.logistics.reeferVehiclesCount).toBe(1);

      // Billing checks
      expect(result.billing.totalInvoicesCount).toBe(2);
      expect(result.billing.paidRevenueRp).toBe(12500000);
      expect(result.billing.pendingRevenueRp).toBe(3850000);
      expect(result.billing.totalLateFeesRp).toBe(350000);
    });

    it('should handle empty database tables safely without NaN or zero-division errors', async () => {
      mockPrisma.warehouse.findMany.mockResolvedValue([]);
      mockPrisma.storageSlot.findMany.mockResolvedValue([]);
      mockPrisma.goodsItem.findMany.mockResolvedValue([]);
      mockPrisma.deliveryOrder.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.telemetryLog.findMany.mockResolvedValue([]);
      mockPrisma.goodsMutation.findMany.mockResolvedValue([]);

      const result = await service.getAdminOverview();

      expect(result.warehouse.totalCapacityM3).toBe(0);
      expect(result.warehouse.utilizationPercent).toBe(0);
      expect(result.goods.totalSkus).toBe(0);
      expect(result.logistics.totalOrders).toBe(0);
      expect(result.logistics.onTimeDeliveryRatePercent).toBe(100);
      expect(result.billing.collectionRatePercent).toBe(100);
    });

    it('should filter metrics by specific warehouseId when provided', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: 'wh-bdg-01',
        code: 'WH-BDG-01',
        name: 'Gudang Distribusi Gedebage Cold Hub',
        city: 'Bandung',
        totalCapacityM3: '3000.00',
        usedCapacityM3: '1400.00',
        managerName: 'Rian Nugraha',
        contactPhone: '022-7561234',
      });
      mockPrisma.warehouse.findMany.mockResolvedValue([
        { totalCapacityM3: '3000.00', usedCapacityM3: '1400.00' },
      ]);
      mockPrisma.storageSlot.findMany.mockResolvedValue([
        {
          id: 's-bdg-1',
          status: 'OCCUPIED',
          zone: 'COLD_STORAGE',
          usedM3: '80',
          capacityM3: '100',
          temperatureCelsius: '-19.2',
          humidityPercent: '82',
        },
        {
          id: 's-bdg-2',
          status: 'AVAILABLE',
          zone: 'COLD_STORAGE',
          usedM3: '0',
          capacityM3: '100',
          temperatureCelsius: '-20.5',
          humidityPercent: '80',
        },
      ]);
      mockPrisma.goodsItem.findMany.mockResolvedValue([
        {
          id: 'g-bdg-1',
          quantity: 40,
          volumeM3: '0.8',
          requiresColdStorage: true,
          category: 'COLD_FOOD',
          status: 'STORED',
        },
      ]);
      mockPrisma.deliveryOrder.findMany.mockResolvedValue([
        {
          id: 'o-bdg-1',
          orderNumber: 'ORD-BDG-01',
          status: 'IN_TRANSIT',
          destinationAddress: 'Dago Bandung',
          updatedAt: new Date(),
          proofOfDeliveryUrl: null,
        },
      ]);
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.telemetryLog.findMany.mockResolvedValue([]);
      mockPrisma.goodsMutation.findMany.mockResolvedValue([]);

      const result = await service.getAdminOverview('wh-bdg-01');

      expect(mockPrisma.warehouse.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: { equals: 'wh-bdg-01', mode: 'insensitive' } },
            { code: { equals: 'wh-bdg-01', mode: 'insensitive' } },
          ],
        },
      });
      expect(result.activeWarehouse).toBeDefined();
      expect(result.activeWarehouse?.code).toBe('WH-BDG-01');
      expect(result.activeWarehouse?.name).toBe('Gudang Distribusi Gedebage Cold Hub');
      expect(result.warehouse.totalCapacityM3).toBe(3000);
      expect(result.warehouse.usedCapacityM3).toBe(1400);
      expect(result.goods.totalSkus).toBe(1);
      expect(result.goods.totalVolumeM3).toBe(0.8);
      expect(result.telemetry.avgColdTempCelsius).toBe(-19.9); // (-19.2 + -20.5)/2 = -19.85 -> -19.9
    });
  });

  describe('getCustomerSummary', () => {
    it('should calculate tenant-isolated metrics correctly', async () => {
      mockPrisma.goodsItem.findMany.mockResolvedValue([
        {
          id: 'g1',
          quantity: 150,
          volumeM3: '75.00',
          slot: {
            id: 's1',
            capacityM3: '100',
            temperatureCelsius: '-18.4',
            humidityPercent: '65',
            storageZone: { name: 'Zone A' },
            warehouse: { name: 'Cakung Hub' },
          },
        },
      ]);
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'i1', invoiceNumber: 'INV-2026-001', status: 'PAID', totalAmount: '12500000' },
      ]);
      mockPrisma.deliveryOrder.findMany.mockResolvedValue([{ id: 'o1', status: 'IN_TRANSIT' }]);

      const result = await service.getCustomerSummary('cust-1');

      expect(result.totalSkus).toBe(1);
      expect(result.totalQuantityPackages).toBe(150);
      expect(result.totalVolumeM3).toBe(75);
      expect(result.currentTempCelsius).toBe(-18.4);
      expect(result.paidBillingRp).toBe(12500000);
      expect(result.inTransitDeliveriesCount).toBe(1);
    });
  });

  describe('getDriverSummary', () => {
    it('should return driver vehicle and active task summary', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Isuzu Giga FVR Reefer Truck',
        plateNumber: 'B 9821 TKN',
        maxVolumeM3: '12.00',
        hasRefrigeration: true,
        telemetryLogs: [{ temperatureCelsius: '-18.2' }],
      });
      mockPrisma.deliveryOrder.findMany.mockResolvedValue([
        {
          id: 'o1',
          orderNumber: 'DO-2026-001',
          originAddress: 'Cakung Hub',
          destinationAddress: 'BSD City',
          recipientName: 'Mr. Hendra',
          status: 'IN_TRANSIT',
          totalVolumeM3: '75.00',
          goodsSummary: '150 Packages Wagyu Beef',
          customer: { name: 'PT Fresh Foods', phone: '0812-9988-7766' },
          orderItems: [{ quantity: 150, goods: { name: 'Wagyu Beef' } }],
        },
      ]);

      const result = await service.getDriverSummary('drv-1');

      expect(result.assignedVehicle).toBeDefined();
      expect(result.assignedVehicle?.plateNumber).toBe('B 9821 TKN');
      expect(result.assignedVehicle?.currentTemp).toBe(-18.2);
      expect(result.activeDeliveryOrder).toBeDefined();
      expect(result.activeDeliveryOrder?.orderNumber).toBe('DO-2026-001');
      expect(result.activeTripsCount).toBe(1);
    });
  });
});
