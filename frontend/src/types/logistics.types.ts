export type VehicleType = "VAN" | "BOX_TRUCK_SMALL" | "REEFER_TRUCK" | "WING_BOX_LARGE";

export type OrderType = "PICKUP" | "DELIVERY";

export type OrderStatus =
  | "PENDING_ASSIGNMENT"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_DESTINATION"
  | "DELIVERED"
  | "CONFIRMED"
  | "DELAYED"
  | "CANCELLED";

export interface Vehicle {
  id: string;
  plateNumber: string; // e.g. "B 9821 WMS"
  name: string;
  type: VehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  hasRefrigeration: boolean;
  minTempCelsius?: number;
  status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE";
  currentDriverId?: string;
  currentDriverName?: string;
  locationCity: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string; // e.g. "ORD-2026-092"
  type: OrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  goodsItemIds: string[];
  goodsSummary: string; // e.g. "2x Frozen Salmon Box, 1x Frozen Beef"
  totalVolumeM3: number;
  totalWeightKg: number;
  requiresReefer: boolean;

  originAddress: string;
  originCity: string;
  destinationAddress: string;
  destinationCity: string;

  scheduledDate: string;
  scheduledTimeSlot: string;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;

  vehicleId?: string;
  vehiclePlate?: string;
  vehicleType?: VehicleType;

  status: OrderStatus;
  estimatedDurationMins: number;
  distanceKm: number;

  isDelayed?: boolean;
  delayReason?: string;
  rescheduledTime?: string;

  proofOfDeliveryUrl?: string;
  confirmedByCustomer?: boolean;
  confirmedByDriver?: boolean;
  confirmedByAdmin?: boolean;
  confirmedAt?: string;

  createdAt: string;
  updatedAt: string;
}
