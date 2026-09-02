export interface WarehouseAnalytics {
  totalCapacityM3: number;
  usedCapacityM3: number;
  utilizationPercent: number;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  maintenanceSlots: number;
  coldStorageSlots: number;
  standardSlots: number;
  heavyDutySlots: number;
  zonesBreakdown: {
    coldStorage: { totalSlots: number; occupiedSlots: number; usedM3: number; capacityM3: number; occupancyPercent: number };
    standard: { totalSlots: number; occupiedSlots: number; usedM3: number; capacityM3: number; occupancyPercent: number };
    heavyDuty: { totalSlots: number; occupiedSlots: number; usedM3: number; capacityM3: number; occupancyPercent: number };
  };
}

export interface GoodsAnalytics {
  totalSkus: number;
  totalQuantityKoli: number;
  totalVolumeM3: number;
  coldStorageSkusCount: number;
  standardSkusCount: number;
  heavyDutySkusCount: number;
  storedCount: number;
  pendingCount: number;
  deliveredCount: number;
}

export interface LogisticsAnalytics {
  totalOrders: number;
  pendingAssignmentOrders: number;
  loadingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  verifiedPodOrders: number;
  totalVehicles: number;
  inServiceVehicles: number;
  availableVehicles: number;
  reeferVehiclesCount: number;
  onTimeDeliveryRatePercent: number;
}

export interface BillingAnalytics {
  totalInvoicesCount: number;
  paidInvoicesCount: number;
  paidRevenueRp: number;
  pendingInvoicesCount: number;
  pendingRevenueRp: number;
  overdueInvoicesCount: number;
  totalLateFeesRp: number;
  collectionRatePercent: number;
}

export interface TelemetryAnalytics {
  totalSensorNodesCount: number;
  avgColdTempCelsius: number;
  avgHumidityPercent: number;
  activeAlertsCount: number;
  temperatureViolationsCount: number;
}

export interface RecentActivity {
  id: string;
  type: "GOODS_MUTATION" | "DELIVERY_ORDER" | "INVOICE";
  title: string;
  description: string;
  actorName: string;
  timestamp: string;
}

export interface ActiveWarehouseInfo {
  id: string;
  code: string;
  name: string;
  city: string;
  totalCapacityM3: number;
  usedCapacityM3: number;
  occupancyPercent: number;
  managerName?: string;
  contactPhone?: string;
}

export interface AdminOverview {
  warehouse: WarehouseAnalytics;
  goods: GoodsAnalytics;
  logistics: LogisticsAnalytics;
  billing: BillingAnalytics;
  telemetry: TelemetryAnalytics;
  recentActivities: RecentActivity[];
  activeWarehouse?: ActiveWarehouseInfo;
}

export interface CustomerSummary {
  rentedSpaceM3: number;
  usedSpaceM3: number;
  utilizationPercent: number;
  remainingSpaceM3: number;
  totalSkus: number;
  totalQuantityPackages: number;
  totalVolumeM3: number;
  currentTempCelsius: number;
  humidityPercent: number;
  storageLocationName: string;
  activeWarehouseId?: string;
  monthlyBillingRp: number;
  unpaidBillingRp: number;
  paidBillingRp: number;
  latestInvoiceStatus: string;
  latestInvoiceNumber: string;
  activeDeliveriesCount: number;
  inTransitDeliveriesCount: number;
}

export interface DriverSummary {
  assignedVehicle: {
    id: string;
    name: string;
    plateNumber: string;
    capacityM3: number;
    hasReefer: boolean;
    currentTemp?: number;
    reeferStatus?: string;
  } | null;
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
  completedTripsCount: number;
  activeTripsCount: number;
  rating: number;
  onTimePerformancePercent: number;
}

export interface OperationalCounts {
  logisticsQueueCount: number;
  pendingAssignmentOrdersCount: number;
  inTransitOrdersCount: number;
  billingAlertCount: number;
  underReviewPaymentsCount: number;
  overdueInvoicesCount: number;
  unreadNotificationsCount: number;
  driverActiveTasksCount: number;
  driverCompletedTasksCount: number;
  customerActiveDeliveriesCount: number;
  customerInTransitDeliveriesCount: number;
  customerUnpaidInvoicesCount: number;
  customerUnderReviewInvoicesCount: number;
}

