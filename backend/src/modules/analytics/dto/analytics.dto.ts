import { ApiProperty } from '@nestjs/swagger';

export class WarehouseAnalyticsDto {
  @ApiProperty({ example: 1000 })
  totalCapacityM3: number;

  @ApiProperty({ example: 450.5 })
  usedCapacityM3: number;

  @ApiProperty({ example: 45.05 })
  utilizationPercent: number;

  @ApiProperty({ example: 130 })
  totalSlots: number;

  @ApiProperty({ example: 65 })
  occupiedSlots: number;

  @ApiProperty({ example: 60 })
  availableSlots: number;

  @ApiProperty({ example: 5 })
  maintenanceSlots: number;

  @ApiProperty({ example: 40 })
  coldStorageSlots: number;

  @ApiProperty({ example: 60 })
  standardSlots: number;

  @ApiProperty({ example: 30 })
  heavyDutySlots: number;

  @ApiProperty({
    example: {
      coldStorage: {
        totalSlots: 40,
        occupiedSlots: 25,
        usedM3: 200,
        capacityM3: 400,
        occupancyPercent: 62.5,
      },
      standard: {
        totalSlots: 60,
        occupiedSlots: 30,
        usedM3: 150,
        capacityM3: 400,
        occupancyPercent: 50,
      },
      heavyDuty: {
        totalSlots: 30,
        occupiedSlots: 10,
        usedM3: 100.5,
        capacityM3: 200,
        occupancyPercent: 33.33,
      },
    },
  })
  zonesBreakdown: {
    coldStorage: {
      totalSlots: number;
      occupiedSlots: number;
      usedM3: number;
      capacityM3: number;
      occupancyPercent: number;
    };
    standard: {
      totalSlots: number;
      occupiedSlots: number;
      usedM3: number;
      capacityM3: number;
      occupancyPercent: number;
    };
    heavyDuty: {
      totalSlots: number;
      occupiedSlots: number;
      usedM3: number;
      capacityM3: number;
      occupancyPercent: number;
    };
  };
}

export class GoodsAnalyticsDto {
  @ApiProperty({ example: 12 })
  totalSkus: number;

  @ApiProperty({ example: 1250 })
  totalQuantityKoli: number;

  @ApiProperty({ example: 450.5 })
  totalVolumeM3: number;

  @ApiProperty({ example: 6 })
  coldStorageSkusCount: number;

  @ApiProperty({ example: 4 })
  standardSkusCount: number;

  @ApiProperty({ example: 2 })
  heavyDutySkusCount: number;

  @ApiProperty({ example: 8 })
  storedCount: number;

  @ApiProperty({ example: 2 })
  pendingCount: number;

  @ApiProperty({ example: 2 })
  deliveredCount: number;
}

export class LogisticsAnalyticsDto {
  @ApiProperty({ example: 10 })
  totalOrders: number;

  @ApiProperty({ example: 3 })
  pendingAssignmentOrders: number;

  @ApiProperty({ example: 2 })
  loadingOrders: number;

  @ApiProperty({ example: 2 })
  inTransitOrders: number;

  @ApiProperty({ example: 3 })
  deliveredOrders: number;

  @ApiProperty({ example: 3 })
  verifiedPodOrders: number;

  @ApiProperty({ example: 4 })
  totalVehicles: number;

  @ApiProperty({ example: 2 })
  inServiceVehicles: number;

  @ApiProperty({ example: 2 })
  availableVehicles: number;

  @ApiProperty({ example: 2 })
  reeferVehiclesCount: number;

  @ApiProperty({ example: 98.5 })
  onTimeDeliveryRatePercent: number;
}

export class BillingAnalyticsDto {
  @ApiProperty({ example: 8 })
  totalInvoicesCount: number;

  @ApiProperty({ example: 4 })
  paidInvoicesCount: number;

  @ApiProperty({ example: 45000000 })
  paidRevenueRp: number;

  @ApiProperty({ example: 3 })
  pendingInvoicesCount: number;

  @ApiProperty({ example: 25000000 })
  pendingRevenueRp: number;

  @ApiProperty({ example: 1 })
  overdueInvoicesCount: number;

  @ApiProperty({ example: 750000 })
  totalLateFeesRp: number;

  @ApiProperty({ example: 64.29 })
  collectionRatePercent: number;
}

export class TelemetryAnalyticsDto {
  @ApiProperty({ example: 6 })
  totalSensorNodesCount: number;

  @ApiProperty({ example: -18.8 })
  avgColdTempCelsius: number;

  @ApiProperty({ example: 65 })
  avgHumidityPercent: number;

  @ApiProperty({ example: 0 })
  activeAlertsCount: number;

  @ApiProperty({ example: 0 })
  temperatureViolationsCount: number;
}

export class RecentActivityDto {
  @ApiProperty({ example: 'act-1' })
  id: string;

  @ApiProperty({ example: 'GOODS_MUTATION' })
  type: 'GOODS_MUTATION' | 'DELIVERY_ORDER' | 'INVOICE';

  @ApiProperty({ example: 'Import Wagyu Beef Received' })
  title: string;

  @ApiProperty({ example: '150 Packages placed into Slot A-01-01' })
  description: string;

  @ApiProperty({ example: 'Admin User' })
  actorName: string;

  @ApiProperty({ example: '2026-08-16T08:30:00.000Z' })
  timestamp: string;
}

export class ActiveWarehouseInfoDto {
  @ApiProperty({ example: 'wh-jkt-central' })
  id: string;

  @ApiProperty({ example: 'WH-CKG-01' })
  code: string;

  @ApiProperty({ example: 'Gudang Utama Cakung Logistics Hub' })
  name: string;

  @ApiProperty({ example: 'Jakarta Timur' })
  city: string;

  @ApiProperty({ example: 5000 })
  totalCapacityM3: number;

  @ApiProperty({ example: 3150 })
  usedCapacityM3: number;

  @ApiProperty({ example: 63.0 })
  occupancyPercent: number;

  @ApiProperty({ example: 'Hendra Wijaya', required: false })
  managerName?: string;

  @ApiProperty({ example: '021-4609876', required: false })
  contactPhone?: string;
}

export class AdminOverviewDto {
  @ApiProperty({ type: WarehouseAnalyticsDto })
  warehouse: WarehouseAnalyticsDto;

  @ApiProperty({ type: GoodsAnalyticsDto })
  goods: GoodsAnalyticsDto;

  @ApiProperty({ type: LogisticsAnalyticsDto })
  logistics: LogisticsAnalyticsDto;

  @ApiProperty({ type: BillingAnalyticsDto })
  billing: BillingAnalyticsDto;

  @ApiProperty({ type: TelemetryAnalyticsDto })
  telemetry: TelemetryAnalyticsDto;

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivities: RecentActivityDto[];

  @ApiProperty({ type: ActiveWarehouseInfoDto, required: false })
  activeWarehouse?: ActiveWarehouseInfoDto;
}

export class CustomerSummaryDto {
  @ApiProperty({ example: 250 })
  rentedSpaceM3: number;

  @ApiProperty({ example: 185 })
  usedSpaceM3: number;

  @ApiProperty({ example: 74.0 })
  utilizationPercent: number;

  @ApiProperty({ example: 65 })
  remainingSpaceM3: number;

  @ApiProperty({ example: 3 })
  totalSkus: number;

  @ApiProperty({ example: 450 })
  totalQuantityPackages: number;

  @ApiProperty({ example: 185 })
  totalVolumeM3: number;

  @ApiProperty({ example: -18.4, nullable: true })
  currentTempCelsius: number | null;

  @ApiProperty({ example: 65, nullable: true })
  humidityPercent: number | null;

  @ApiProperty({ example: 'Zone A Cold Storage • Cakung Hub', nullable: true })
  storageLocationName: string | null;

  @ApiProperty({ example: 'wh-jkt-central', nullable: true })
  activeWarehouseId: string | null;

  @ApiProperty({ example: 12500000 })
  monthlyBillingRp: number;

  @ApiProperty({ example: 0 })
  unpaidBillingRp: number;

  @ApiProperty({ example: 12500000 })
  paidBillingRp: number;

  @ApiProperty({ example: 'PAID', nullable: true })
  latestInvoiceStatus: string | null;

  @ApiProperty({ example: 'INV-2026-001', nullable: true })
  latestInvoiceNumber: string | null;

  @ApiProperty({ example: 1 })
  activeDeliveriesCount: number;

  @ApiProperty({ example: 1 })
  inTransitDeliveriesCount: number;
}

export class DriverSummaryDto {
  @ApiProperty({
    example: {
      id: 'veh-1',
      name: 'Isuzu Giga FVR Reefer Truck',
      plateNumber: 'B 9821 TKN',
      capacityM3: 12,
      hasReefer: true,
      currentTemp: -18.2,
      reeferStatus: 'OPTIMAL',
    },
  })
  assignedVehicle: {
    id: string;
    name: string;
    plateNumber: string;
    capacityM3: number;
    hasReefer: boolean;
    currentTemp?: number;
    reeferStatus?: string;
  } | null;

  @ApiProperty({
    example: {
      id: 'ord-1',
      orderNumber: 'DO-2026-001',
      originAddress: 'Cakung Logistics Central Hub (JKT-01) — Loading Dock 2',
      destinationAddress: 'FreshMarket Superstore BSD, South Tangerang',
      customerName: 'Mr. Hendra',
      customerPhone: '0812-9988-7766',
      goodsSummary: '150 Packages Wagyu Beef & Salmon (Reefer -18°C)',
      totalPackages: 150,
      totalVolumeM3: 75,
      status: 'IN_TRANSIT',
      estimatedDurationMinutes: 35,
    },
  })
  activeDeliveryOrder: {
    id: string;
    orderNumber: string;
    originAddress: string;
    destinationAddress: string;
    customerName: string;
    customerPhone: string;
    goodsSummary: string;
    totalPackages: number;
    totalVolumeM3: number;
    status: string;
    estimatedDurationMinutes?: number;
  } | null;

  @ApiProperty({ example: 142 })
  completedTripsCount: number;

  @ApiProperty({ example: 1 })
  activeTripsCount: number;

  @ApiProperty({ example: 4.9 })
  rating: number;

  @ApiProperty({ example: 98.4 })
  onTimePerformancePercent: number;
}

export class OperationalCountsDto {
  @ApiProperty({
    example: 4,
    description:
      'Total active operational logistics orders in queue (PENDING_ASSIGNMENT, DRIVER_ASSIGNED, EN_ROUTE_PICKUP, PICKED_UP, IN_TRANSIT, ARRIVED_DESTINATION, DELAYED)',
  })
  logisticsQueueCount: number;

  @ApiProperty({ example: 2 })
  pendingAssignmentOrdersCount: number;

  @ApiProperty({ example: 1 })
  inTransitOrdersCount: number;

  @ApiProperty({
    example: 1,
    description:
      'Billing items requiring attention (Under review payments + Overdue invoices for Admin)',
  })
  billingAlertCount: number;

  @ApiProperty({
    example: 1,
    description: 'Payments submitted by customers awaiting admin verification',
  })
  underReviewPaymentsCount: number;

  @ApiProperty({ example: 0 })
  overdueInvoicesCount: number;

  @ApiProperty({ example: 3, description: 'Unread system notifications count' })
  unreadNotificationsCount: number;

  @ApiProperty({
    example: 1,
    description: 'Active delivery tasks assigned to the authenticated driver',
  })
  driverActiveTasksCount: number;

  @ApiProperty({ example: 20 })
  driverCompletedTasksCount: number;

  @ApiProperty({ example: 2, description: 'Active delivery orders for the authenticated customer' })
  customerActiveDeliveriesCount: number;

  @ApiProperty({ example: 1 })
  customerInTransitDeliveriesCount: number;

  @ApiProperty({
    example: 1,
    description: 'Unpaid or overdue invoices for the authenticated customer',
  })
  customerUnpaidInvoicesCount: number;

  @ApiProperty({ example: 0, description: 'Invoices under review for the authenticated customer' })
  customerUnderReviewInvoicesCount: number;
}
