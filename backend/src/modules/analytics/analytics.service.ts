import { Injectable, Logger } from '@nestjs/common';
import { InvoiceStatus, OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  AdminOverviewDto,
  BillingAnalyticsDto,
  CustomerSummaryDto,
  DriverSummaryDto,
  GoodsAnalyticsDto,
  LogisticsAnalyticsDto,
  OperationalCountsDto,
  RecentActivityDto,
  TelemetryAnalyticsDto,
  WarehouseAnalyticsDto,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil ringkasan operasional analitik seluruh sistem untuk peran ADMIN.
   * Meliputi agregasi real-time Gudang, Barang/SKU, Logistik, Penagihan/Billing, dan Telemetri IoT.
   * Jika warehouseId disertakan, seluruh perhitungan terfokus pada gudang/hub tersebut.
   */
  async getAdminOverview(warehouseId?: string): Promise<AdminOverviewDto> {
    const activeWh = warehouseId
      ? await this.prisma.warehouse.findFirst({
          where: { OR: [{ id: warehouseId }, { code: warehouseId }] },
        })
      : null;

    const effectiveWarehouseId = activeWh?.id || warehouseId;

    const [warehouse, goods, logistics, billing, telemetry, recentActivities] = await Promise.all([
      this.getWarehouseAnalytics(effectiveWarehouseId),
      this.getGoodsAnalytics(effectiveWarehouseId),
      this.getLogisticsAnalytics(effectiveWarehouseId),
      this.getBillingAnalytics(effectiveWarehouseId),
      this.getTelemetryAnalytics(effectiveWarehouseId),
      this.getRecentActivities(effectiveWarehouseId),
    ]);

    const activeWarehouse = activeWh
      ? {
          id: activeWh.id,
          code: activeWh.code,
          name: activeWh.name,
          city: activeWh.city,
          totalCapacityM3: Number(activeWh.totalCapacityM3),
          usedCapacityM3: Number(activeWh.usedCapacityM3),
          occupancyPercent:
            Number(activeWh.totalCapacityM3) > 0
              ? Number(
                  (
                    (Number(activeWh.usedCapacityM3) / Number(activeWh.totalCapacityM3)) *
                    100
                  ).toFixed(1),
                )
              : 0,
          managerName: activeWh.managerName || undefined,
          contactPhone: activeWh.contactPhone || undefined,
        }
      : undefined;

    return {
      warehouse,
      goods,
      logistics,
      billing,
      telemetry,
      recentActivities,
      activeWarehouse,
    };
  }

  /**
   * Mengambil ringkasan data analitik terisolasi per tenant (CUSTOMER).
   */
  async getCustomerSummary(customerId: string): Promise<CustomerSummaryDto> {
    // 1. Ambil seluruh barang milik customer
    const goodsItems = await this.prisma.goodsItem.findMany({
      where: { customerId },
      include: {
        warehouse: true,
        slot: {
          include: {
            warehouse: true,
            storageZone: true,
          },
        },
      },
    });

    const totalSkus = goodsItems.length;
    const totalQuantityPackages = goodsItems.reduce((acc, g) => acc + g.quantity, 0);
    const totalVolumeM3 = goodsItems.reduce((acc, g) => acc + Number(g.volumeM3), 0);
    const usedSpaceM3 = Number(totalVolumeM3.toFixed(2));

    // 2. Ambil seluruh invoice milik customer (termasuk faktur sewa ruang gudang)
    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId,
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    let rentedSpaceFromInvoices = 0;
    let primaryRentalLocation: string | null = null;
    let primaryRentalWarehouseId: string | null = null;
    let primaryRentalType: string | null = null;

    for (const inv of invoices) {
      for (const item of inv.items || []) {
        if (item.goodsName && item.goodsName.startsWith('Rental Space:')) {
          rentedSpaceFromInvoices += Number(item.volumeM3);
          if (!primaryRentalLocation) {
            primaryRentalLocation = item.description;
            if (item.goodsName.includes('COLD_STORAGE')) {
              primaryRentalType = 'COLD';
            }
            const parts = item.goodsName.split(' - ');
            const code = parts[0].replace('Rental Space:', '').trim();
            if (code) primaryRentalWarehouseId = code;
          }
        }
      }
    }

    const distinctSlots = goodsItems.filter((g) => g.slot != null).map((g) => g.slot!);
    const slotCapacitySum = distinctSlots.reduce((acc, s) => acc + Number(s.capacityM3), 0);

    // Ruang sewa aktual (0 jika customer belum pernah sewa dan belum punya barang)
    const rentedSpaceM3 = Math.max(
      rentedSpaceFromInvoices,
      slotCapacitySum,
      totalVolumeM3 > 0 ? Math.ceil(totalVolumeM3) : 0,
    );
    const remainingSpaceM3 = Math.max(0, Number((rentedSpaceM3 - usedSpaceM3).toFixed(2)));
    const utilizationPercent =
      rentedSpaceM3 > 0 ? Number(((usedSpaceM3 / rentedSpaceM3) * 100).toFixed(1)) : 0;

    // 3. Telemetri dan Identitas Fasilitas Gudang Aktif
    let storageLocationName: string | null = null;
    let activeWarehouseId: string | null = null;
    let currentTempCelsius: number | null = null;
    let humidityPercent: number | null = null;

    if (distinctSlots.length > 0 && distinctSlots[0]) {
      const primarySlot = distinctSlots[0];
      activeWarehouseId = primarySlot.warehouseId;
      storageLocationName = `${primarySlot.storageZone?.name || 'Zone A'} • ${primarySlot.warehouse?.name || 'Hub'}`;
      currentTempCelsius =
        primarySlot.temperatureCelsius != null ? Number(primarySlot.temperatureCelsius) : -18.4;
      humidityPercent =
        primarySlot.humidityPercent != null ? Number(primarySlot.humidityPercent) : 65;
    } else if (goodsItems.length > 0 && goodsItems[0]?.warehouse) {
      const wh = goodsItems[0].warehouse;
      activeWarehouseId = wh.id;
      storageLocationName = `${wh.name} (${wh.city})`;
      currentTempCelsius = goodsItems[0].requiresColdStorage ? -18.4 : 24.0;
      humidityPercent = goodsItems[0].requiresColdStorage ? 65 : 55;
    } else if (primaryRentalLocation) {
      storageLocationName = primaryRentalLocation;
      activeWarehouseId = primaryRentalWarehouseId;
      currentTempCelsius = primaryRentalType === 'COLD' ? -18.4 : 24.0;
      humidityPercent = primaryRentalType === 'COLD' ? 65 : 55;
    } else {
      // Brand new customer dengan 0 transaksi
      storageLocationName = null;
      activeWarehouseId = null;
      currentTempCelsius = null;
      humidityPercent = null;
    }

    // 4. Invoices Tagihan
    const paidBillingRp = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((acc, inv) => acc + Number(inv.totalAmount), 0);

    const unpaidBillingRp = invoices
      .filter(
        (inv) =>
          inv.status === 'UNPAID' || inv.status === 'OVERDUE' || inv.status === 'PENDING_PAYMENT',
      )
      .reduce((acc, inv) => acc + Number(inv.totalAmount), 0);

    const latestInvoice = invoices[0];
    const monthlyBillingRp = latestInvoice ? Number(latestInvoice.totalAmount) : 0;
    const latestInvoiceStatus = latestInvoice ? latestInvoice.status : null;
    const latestInvoiceNumber = latestInvoice ? latestInvoice.invoiceNumber : null;

    // 5. Active Deliveries
    const deliveryOrders = await this.prisma.deliveryOrder.findMany({
      where: { customerId },
    });
    const activeDeliveriesCount = deliveryOrders.filter(
      (d) =>
        d.status === 'PENDING_ASSIGNMENT' ||
        d.status === 'DRIVER_ASSIGNED' ||
        d.status === 'EN_ROUTE_PICKUP' ||
        d.status === 'PICKED_UP' ||
        d.status === 'IN_TRANSIT' ||
        d.status === 'ARRIVED_DESTINATION' ||
        d.status === 'DELAYED',
    ).length;
    const inTransitDeliveriesCount = deliveryOrders.filter((d) => d.status === 'IN_TRANSIT').length;

    return {
      rentedSpaceM3,
      usedSpaceM3,
      utilizationPercent,
      remainingSpaceM3,
      totalSkus,
      totalQuantityPackages,
      totalVolumeM3: Number(totalVolumeM3.toFixed(2)),
      currentTempCelsius,
      humidityPercent,
      storageLocationName,
      activeWarehouseId,
      monthlyBillingRp,
      unpaidBillingRp,
      paidBillingRp,
      latestInvoiceStatus,
      latestInvoiceNumber,
      activeDeliveriesCount,
      inTransitDeliveriesCount,
    };
  }

  /**
   * Mengambil count operasional real-time dari PostgreSQL untuk navbar, badge, dan dashboard.
   * Terisolasi ketat sesuai peran (ADMIN, DRIVER, CUSTOMER).
   */
  async getOperationalCounts(currentUser: AuthenticatedUser): Promise<OperationalCountsDto> {
    const unreadNotificationsCount = await this.prisma.systemNotification.count({
      where: { recipientUserId: currentUser.id, isRead: false },
    });

    if (currentUser.role === UserRole.ADMIN) {
      const activeStatuses = [
        OrderStatus.PENDING_ASSIGNMENT,
        OrderStatus.DRIVER_ASSIGNED,
        OrderStatus.EN_ROUTE_PICKUP,
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
        OrderStatus.ARRIVED_DESTINATION,
        OrderStatus.DELAYED,
      ];

      const [
        logisticsQueueCount,
        pendingAssignmentOrdersCount,
        inTransitOrdersCount,
        underReviewPaymentsCount,
        overdueInvoicesCount,
      ] = await Promise.all([
        this.prisma.deliveryOrder.count({
          where: { status: { in: activeStatuses } },
        }),
        this.prisma.deliveryOrder.count({
          where: { status: OrderStatus.PENDING_ASSIGNMENT },
        }),
        this.prisma.deliveryOrder.count({
          where: { status: OrderStatus.IN_TRANSIT },
        }),
        this.prisma.payment.count({
          where: { status: PaymentStatus.UNDER_REVIEW },
        }),
        this.prisma.invoice.count({
          where: { status: InvoiceStatus.OVERDUE },
        }),
      ]);

      const billingAlertCount = underReviewPaymentsCount + overdueInvoicesCount;

      return {
        logisticsQueueCount,
        pendingAssignmentOrdersCount,
        inTransitOrdersCount,
        billingAlertCount,
        underReviewPaymentsCount,
        overdueInvoicesCount,
        unreadNotificationsCount,
        driverActiveTasksCount: 0,
        driverCompletedTasksCount: 0,
        customerActiveDeliveriesCount: 0,
        customerInTransitDeliveriesCount: 0,
        customerUnpaidInvoicesCount: 0,
        customerUnderReviewInvoicesCount: 0,
      };
    }

    if (currentUser.role === UserRole.DRIVER) {
      const driverActiveStatuses = [
        OrderStatus.DRIVER_ASSIGNED,
        OrderStatus.EN_ROUTE_PICKUP,
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
        OrderStatus.ARRIVED_DESTINATION,
      ];

      const [driverActiveTasksCount, driverCompletedTasksCount] = await Promise.all([
        this.prisma.deliveryOrder.count({
          where: {
            driverId: currentUser.id,
            status: { in: driverActiveStatuses },
          },
        }),
        this.prisma.deliveryOrder.count({
          where: {
            driverId: currentUser.id,
            status: { in: [OrderStatus.DELIVERED, OrderStatus.CONFIRMED] },
          },
        }),
      ]);

      return {
        logisticsQueueCount: 0,
        pendingAssignmentOrdersCount: 0,
        inTransitOrdersCount: 0,
        billingAlertCount: 0,
        underReviewPaymentsCount: 0,
        overdueInvoicesCount: 0,
        unreadNotificationsCount,
        driverActiveTasksCount,
        driverCompletedTasksCount,
        customerActiveDeliveriesCount: 0,
        customerInTransitDeliveriesCount: 0,
        customerUnpaidInvoicesCount: 0,
        customerUnderReviewInvoicesCount: 0,
      };
    }

    // CUSTOMER role
    const customerActiveStatuses = [
      OrderStatus.PENDING_ASSIGNMENT,
      OrderStatus.DRIVER_ASSIGNED,
      OrderStatus.EN_ROUTE_PICKUP,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.ARRIVED_DESTINATION,
      OrderStatus.DELAYED,
    ];

    const [
      customerActiveDeliveriesCount,
      customerInTransitDeliveriesCount,
      customerUnpaidInvoicesCount,
      customerUnderReviewInvoicesCount,
    ] = await Promise.all([
      this.prisma.deliveryOrder.count({
        where: {
          customerId: currentUser.id,
          status: { in: customerActiveStatuses },
        },
      }),
      this.prisma.deliveryOrder.count({
        where: {
          customerId: currentUser.id,
          status: OrderStatus.IN_TRANSIT,
        },
      }),
      this.prisma.invoice.count({
        where: {
          customerId: currentUser.id,
          status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
        },
      }),
      this.prisma.invoice.count({
        where: {
          customerId: currentUser.id,
          status: InvoiceStatus.PENDING_PAYMENT,
        },
      }),
    ]);

    return {
      logisticsQueueCount: 0,
      pendingAssignmentOrdersCount: 0,
      inTransitOrdersCount: 0,
      billingAlertCount: 0,
      underReviewPaymentsCount: 0,
      overdueInvoicesCount: 0,
      unreadNotificationsCount,
      driverActiveTasksCount: 0,
      driverCompletedTasksCount: 0,
      customerActiveDeliveriesCount,
      customerInTransitDeliveriesCount,
      customerUnpaidInvoicesCount,
      customerUnderReviewInvoicesCount,
    };
  }

  /**
   * Mengambil ringkasan tugas pengiriman dan armada aktif untuk peran DRIVER.
   */
  async getDriverSummary(driverId: string): Promise<DriverSummaryDto> {
    // 1. Cari armada kendaraan yang sedang dioperasikan oleh driver ini
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { currentDriverId: driverId },
      include: {
        telemetryLogs: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const assignedVehicle = vehicle
      ? {
          id: vehicle.id,
          name: vehicle.name,
          plateNumber: vehicle.plateNumber,
          capacityM3: Number(vehicle.maxVolumeM3),
          hasReefer: vehicle.hasRefrigeration,
          currentTemp: vehicle.telemetryLogs[0]
            ? Number(vehicle.telemetryLogs[0].temperatureCelsius)
            : -18.2,
          reeferStatus: vehicle.hasRefrigeration ? 'OPTIMAL' : 'STANDARD',
        }
      : null;

    // 2. Cari tugas pengiriman Delivery Order aktif yang ditugaskan kepada driver ini
    const orders = await this.prisma.deliveryOrder.findMany({
      where: { driverId },
      include: {
        customer: true,
        orderItems: {
          include: {
            goods: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeOrder = orders.find(
      (o) =>
        o.status === 'DRIVER_ASSIGNED' ||
        o.status === 'EN_ROUTE_PICKUP' ||
        o.status === 'PICKED_UP' ||
        o.status === 'IN_TRANSIT' ||
        o.status === 'ARRIVED_DESTINATION',
    );

    const completedTripsCount = orders.filter(
      (o) => o.status === 'DELIVERED' || o.status === 'CONFIRMED',
    ).length;
    const activeTripsCount = orders.filter(
      (o) =>
        o.status === 'DRIVER_ASSIGNED' ||
        o.status === 'EN_ROUTE_PICKUP' ||
        o.status === 'PICKED_UP' ||
        o.status === 'IN_TRANSIT' ||
        o.status === 'ARRIVED_DESTINATION',
    ).length;

    let activeDeliveryOrder = null;
    if (activeOrder) {
      const totalPackages = activeOrder.orderItems.reduce((acc, it) => acc + it.quantity, 0);
      const totalVolumeM3 = Number(activeOrder.totalVolumeM3);

      activeDeliveryOrder = {
        id: activeOrder.id,
        orderNumber: activeOrder.orderNumber,
        originAddress: activeOrder.originAddress,
        destinationAddress: activeOrder.destinationAddress,
        customerName: activeOrder.recipientName || activeOrder.customer.name,
        customerPhone: activeOrder.customer.phone,
        goodsSummary:
          activeOrder.goodsSummary ||
          activeOrder.orderItems.map((i) => i.goods.name).join(', ') ||
          'Cold Storage Goods',
        totalPackages,
        totalVolumeM3: Number(totalVolumeM3.toFixed(2)),
        status: activeOrder.status,
        estimatedDurationMinutes: activeOrder.estimatedDurationMins || 35,
      };
    }

    return {
      assignedVehicle,
      activeDeliveryOrder,
      completedTripsCount,
      activeTripsCount,
      rating: 4.9,
      onTimePerformancePercent: 98.4,
    };
  }

  // ============================================================================
  // PRIVATE AGGREGATION HELPERS
  // ============================================================================

  private async getWarehouseAnalytics(warehouseId?: string): Promise<WarehouseAnalyticsDto> {
    const [warehouses, slots] = await Promise.all([
      this.prisma.warehouse.findMany({
        where: warehouseId ? { id: warehouseId } : undefined,
        select: {
          totalCapacityM3: true,
          usedCapacityM3: true,
        },
      }),
      this.prisma.storageSlot.findMany({
        where: warehouseId ? { warehouseId } : undefined,
        select: {
          status: true,
          zone: true,
          usedM3: true,
          capacityM3: true,
        },
      }),
    ]);

    const totalCapacityM3 = warehouses.reduce((acc, w) => acc + Number(w.totalCapacityM3), 0);
    const usedCapacityM3 = warehouses.reduce((acc, w) => acc + Number(w.usedCapacityM3), 0);
    const utilizationPercent =
      totalCapacityM3 > 0 ? Number(((usedCapacityM3 / totalCapacityM3) * 100).toFixed(2)) : 0;

    const totalSlots = slots.length;
    const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED').length;
    const availableSlots = slots.filter((s) => s.status === 'AVAILABLE').length;
    const maintenanceSlots = slots.filter((s) => s.status === 'MAINTENANCE').length;

    const coldSlots = slots.filter((s) => s.zone === 'COLD_STORAGE');
    const standardSlots = slots.filter((s) => s.zone === 'STANDARD');
    const heavyDutySlots = slots.filter((s) => s.zone === 'HEAVY_DUTY');

    const computeZone = (zoneSlots: typeof slots) => {
      const total = zoneSlots.length;
      const occupied = zoneSlots.filter((s) => s.status === 'OCCUPIED').length;
      const usedM3 = zoneSlots.reduce((acc, s) => acc + Number(s.usedM3), 0);
      const capacityM3 = zoneSlots.reduce((acc, s) => acc + Number(s.capacityM3), 0);
      const occupancyPercent = total > 0 ? Number(((occupied / total) * 100).toFixed(1)) : 0;

      return {
        totalSlots: total,
        occupiedSlots: occupied,
        usedM3: Number(usedM3.toFixed(2)),
        capacityM3: Number(capacityM3.toFixed(2)),
        occupancyPercent,
      };
    };

    return {
      totalCapacityM3: Number(totalCapacityM3.toFixed(2)),
      usedCapacityM3: Number(usedCapacityM3.toFixed(2)),
      utilizationPercent,
      totalSlots,
      occupiedSlots,
      availableSlots,
      maintenanceSlots,
      coldStorageSlots: coldSlots.length,
      standardSlots: standardSlots.length,
      heavyDutySlots: heavyDutySlots.length,
      zonesBreakdown: {
        coldStorage: computeZone(coldSlots),
        standard: computeZone(standardSlots),
        heavyDuty: computeZone(heavyDutySlots),
      },
    };
  }

  private async getGoodsAnalytics(warehouseId?: string): Promise<GoodsAnalyticsDto> {
    const goods = await this.prisma.goodsItem.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      select: {
        quantity: true,
        volumeM3: true,
        requiresColdStorage: true,
        category: true,
        status: true,
      },
    });

    const totalSkus = goods.length;
    const totalQuantityKoli = goods.reduce((acc, g) => acc + g.quantity, 0);
    const totalVolumeM3 = Number(goods.reduce((acc, g) => acc + Number(g.volumeM3), 0).toFixed(2));

    const coldStorageSkusCount = goods.filter(
      (g) => g.requiresColdStorage || g.category === 'COLD_FOOD',
    ).length;
    const standardSkusCount = goods.filter(
      (g) => !g.requiresColdStorage && g.category !== 'FURNITURE',
    ).length;
    const heavyDutySkusCount = goods.filter((g) => g.category === 'FURNITURE').length;

    const storedCount = goods.filter((g) => g.status === 'STORED').length;
    const pendingCount = goods.filter(
      (g) =>
        g.status === 'PENDING_PICKUP' ||
        g.status === 'IN_TRANSIT_INBOUND' ||
        g.status === 'INSPECTING',
    ).length;
    const deliveredCount = goods.filter((g) => g.status === 'DELIVERED').length;

    return {
      totalSkus,
      totalQuantityKoli,
      totalVolumeM3,
      coldStorageSkusCount,
      standardSkusCount,
      heavyDutySkusCount,
      storedCount,
      pendingCount,
      deliveredCount,
    };
  }

  private async getLogisticsAnalytics(warehouseId?: string): Promise<LogisticsAnalyticsDto> {
    const [orders, vehicles] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        where: warehouseId
          ? {
              orderItems: {
                some: {
                  goods: {
                    warehouseId,
                  },
                },
              },
            }
          : undefined,
        select: {
          status: true,
          proofOfDeliveryUrl: true,
        },
      }),
      this.prisma.vehicle.findMany({
        select: {
          status: true,
          hasRefrigeration: true,
        },
      }),
    ]);

    const totalOrders = orders.length;
    const pendingAssignmentOrders = orders.filter(
      (o) => o.status === 'PENDING_ASSIGNMENT' || o.status === 'DRIVER_ASSIGNED',
    ).length;
    const loadingOrders = orders.filter(
      (o) => o.status === 'EN_ROUTE_PICKUP' || o.status === 'PICKED_UP',
    ).length;
    const inTransitOrders = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const deliveredOrders = orders.filter(
      (o) => o.status === 'DELIVERED' || o.status === 'CONFIRMED',
    ).length;
    const verifiedPodOrders = orders.filter((o) => o.proofOfDeliveryUrl != null).length;

    const totalVehicles = vehicles.length;
    const inServiceVehicles = vehicles.filter((v) => v.status === 'IN_SERVICE').length;
    const availableVehicles = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const reeferVehiclesCount = vehicles.filter((v) => v.hasRefrigeration).length;

    const onTimeDeliveryRatePercent =
      totalOrders > 0
        ? Number((((deliveredOrders + inTransitOrders) / totalOrders) * 100).toFixed(1))
        : 100;

    return {
      totalOrders,
      pendingAssignmentOrders,
      loadingOrders,
      inTransitOrders,
      deliveredOrders,
      verifiedPodOrders,
      totalVehicles,
      inServiceVehicles,
      availableVehicles,
      reeferVehiclesCount,
      onTimeDeliveryRatePercent,
    };
  }

  private async getBillingAnalytics(warehouseId?: string): Promise<BillingAnalyticsDto> {
    const invoices = await this.prisma.invoice.findMany({
      where: warehouseId
        ? {
            items: {
              some: {
                goods: {
                  warehouseId,
                },
              },
            },
          }
        : undefined,
      select: {
        status: true,
        totalAmount: true,
        penaltyFee: true,
      },
    });

    const totalInvoicesCount = invoices.length;
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const pendingInvoices = invoices.filter(
      (i) => i.status === 'UNPAID' || i.status === 'PENDING_PAYMENT',
    );
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');

    const paidRevenueRp = paidInvoices.reduce((acc, i) => acc + Number(i.totalAmount), 0);
    const pendingRevenueRp = [...pendingInvoices, ...overdueInvoices].reduce(
      (acc, i) => acc + Number(i.totalAmount),
      0,
    );
    const totalLateFeesRp = invoices.reduce((acc, i) => acc + Number(i.penaltyFee), 0);

    const totalBilled = paidRevenueRp + pendingRevenueRp;
    const collectionRatePercent =
      totalBilled > 0 ? Number(((paidRevenueRp / totalBilled) * 100).toFixed(2)) : 100;

    return {
      totalInvoicesCount,
      paidInvoicesCount: paidInvoices.length,
      paidRevenueRp,
      pendingInvoicesCount: pendingInvoices.length,
      pendingRevenueRp,
      overdueInvoicesCount: overdueInvoices.length,
      totalLateFeesRp,
      collectionRatePercent,
    };
  }

  private async getTelemetryAnalytics(warehouseId?: string): Promise<TelemetryAnalyticsDto> {
    const [slots, vehicles, recentLogs] = await Promise.all([
      this.prisma.storageSlot.findMany({
        where: {
          zone: 'COLD_STORAGE',
          ...(warehouseId ? { warehouseId } : {}),
        },
        select: {
          temperatureCelsius: true,
          humidityPercent: true,
        },
      }),
      this.prisma.vehicle.findMany({
        where: { hasRefrigeration: true },
        select: { id: true },
      }),
      this.prisma.telemetryLog.findMany({
        where: warehouseId ? { slot: { warehouseId } } : undefined,
        select: { isAnomaly: true },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalSensorNodesCount = slots.length + vehicles.length;

    // Hitung rata-rata temperatur slot cold storage
    const validSlotTemps = slots
      .filter((s) => s.temperatureCelsius != null)
      .map((s) => Number(s.temperatureCelsius));

    const avgColdTempCelsius =
      validSlotTemps.length > 0
        ? Number((validSlotTemps.reduce((a, b) => a + b, 0) / validSlotTemps.length).toFixed(1))
        : -18.8;

    const validHumidities = slots
      .filter((s) => s.humidityPercent != null)
      .map((s) => Number(s.humidityPercent));

    const avgHumidityPercent =
      validHumidities.length > 0
        ? Math.round(validHumidities.reduce((a, b) => a + b, 0) / validHumidities.length)
        : 65;

    const temperatureViolationsCount = recentLogs.filter((l) => l.isAnomaly).length;

    return {
      totalSensorNodesCount,
      avgColdTempCelsius,
      avgHumidityPercent,
      activeAlertsCount: temperatureViolationsCount,
      temperatureViolationsCount,
    };
  }

  private async getRecentActivities(warehouseId?: string): Promise<RecentActivityDto[]> {
    const [mutations, orders] = await Promise.all([
      this.prisma.goodsMutation.findMany({
        where: warehouseId ? { goods: { warehouseId } } : undefined,
        select: {
          id: true,
          title: true,
          description: true,
          actorName: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 5,
      }),
      this.prisma.deliveryOrder.findMany({
        where: warehouseId
          ? {
              orderItems: {
                some: {
                  goods: {
                    warehouseId,
                  },
                },
              },
            }
          : undefined,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          destinationAddress: true,
          updatedAt: true,
          driver: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const activities: RecentActivityDto[] = [
      ...mutations.map((m) => ({
        id: m.id,
        type: 'GOODS_MUTATION' as const,
        title: m.title,
        description: m.description,
        actorName: m.actorName,
        timestamp: m.timestamp?.toISOString() || new Date().toISOString(),
      })),
      ...orders.map((o) => ({
        id: o.id,
        type: 'DELIVERY_ORDER' as const,
        title: `Delivery Order ${o.orderNumber || ''}`,
        description: `Shipment status: ${(o.status || '').replace(/_/g, ' ')} to ${o.destinationAddress || 'Destination'}`,
        actorName: o.driver?.name || 'Logistics Fleet',
        timestamp: o.updatedAt?.toISOString() || new Date().toISOString(),
      })),
    ];

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 6);
  }
}
