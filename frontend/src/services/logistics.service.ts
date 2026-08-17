import { mockDb } from "@/mock/db/mock-db";
import { DeliveryOrder, Vehicle } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface ILogisticsService {
  getOrders(driverId?: string, customerId?: string): Promise<DeliveryOrder[]>;
  getOrderById(id: string): Promise<DeliveryOrder | null>;
  getVehicles(): Promise<Vehicle[]>;
  assignVehicle(
    vehicleId: string,
    driverId: string,
    driverName?: string
  ): Promise<Vehicle>;
  updateOrderStatus(
    orderId: string,
    status: DeliveryOrder["status"],
    location?: string,
    note?: string
  ): Promise<DeliveryOrder>;
  createOrder(order: Partial<DeliveryOrder>): Promise<DeliveryOrder>;
  submitPod(
    orderId: string,
    data: {
      recipientName: string;
      photoUrl: string;
      signatureData: string;
      rating?: number;
      note?: string;
    }
  ): Promise<DeliveryOrder>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpLogisticsService implements ILogisticsService {
  async getOrders(
    driverId?: string,
    customerId?: string
  ): Promise<DeliveryOrder[]> {
    const params: Record<string, any> = { limit: 100 };
    if (driverId) params.driverId = driverId;
    if (customerId) params.customerId = customerId;

    const res = await apiClient<{ items: any[]; totalItems: number }>(
      "/logistics/orders",
      { params }
    );

    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((item) => this.mapBackendOrderToFrontend(item));
  }

  async getOrderById(id: string): Promise<DeliveryOrder | null> {
    try {
      const res = await apiClient<any>(`/logistics/orders/${id}`);
      if (!res) return null;
      return this.mapBackendOrderToFrontend(res);
    } catch (err) {
      return null;
    }
  }

  async getVehicles(): Promise<Vehicle[]> {
    const list = await apiClient<Vehicle[]>("/logistics/vehicles");
    return list || [];
  }

  async assignVehicle(
    vehicleId: string,
    driverId: string,
    _driverName?: string
  ): Promise<Vehicle> {
    const res = await apiClient<Vehicle>("/logistics/vehicles/assign", {
      method: "POST",
      body: JSON.stringify({
        vehicleId,
        driverId,
      }),
    });
    return res;
  }

  async updateOrderStatus(
    orderId: string,
    status: DeliveryOrder["status"],
    location?: string,
    note?: string
  ): Promise<DeliveryOrder> {
    const res = await apiClient<any>(`/logistics/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        location,
        note,
      }),
    });
    return this.mapBackendOrderToFrontend(res);
  }

  async createOrder(order: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
    const payload: Record<string, any> = {
      type: order.type || "PICKUP",
      goodsItemIds:
        Array.isArray(order.goodsItemIds) && order.goodsItemIds.length > 0
          ? order.goodsItemIds
          : ["brg-001"],
      originAddress: order.originAddress || "Cakung Logistics Central Hub",
      originCity: order.originCity || "East Jakarta",
      destinationAddress:
        order.destinationAddress || "Recipient Destination Address",
      destinationCity: order.destinationCity || "South Jakarta",
      scheduledDate:
        order.scheduledDate || new Date().toISOString().split("T")[0],
      scheduledTimeSlot: order.scheduledTimeSlot || "08:00 - 12:00 WIB",
    };

    if (order.customerId) payload.customerId = order.customerId;
    if (order.vehicleId) payload.vehicleId = order.vehicleId;
    if (order.driverId) payload.driverId = order.driverId;
    if (order.distanceKm) payload.distanceKm = Number(order.distanceKm);
    if (order.estimatedDurationMins)
      payload.estimatedDurationMins = Number(order.estimatedDurationMins);

    const res = await apiClient<any>("/logistics/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return this.mapBackendOrderToFrontend(res);
  }

  async submitPod(
    orderId: string,
    data: {
      recipientName: string;
      photoUrl: string;
      signatureData: string;
      rating?: number;
      note?: string;
    }
  ): Promise<DeliveryOrder> {
    const payload: Record<string, any> = {
      recipientName: data.recipientName,
      proofOfDeliveryUrl: data.photoUrl,
      recipientSignature: data.signatureData,
    };
    if (data.rating != null) payload.driverRating = Number(data.rating);

    const res = await apiClient<any>(`/logistics/orders/${orderId}/pod`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapBackendOrderToFrontend(res);
  }

  private mapBackendOrderToFrontend(raw: any): DeliveryOrder {
    return {
      id: raw.id,
      orderNumber: raw.orderNumber || `ORD-${raw.id.substring(0, 8).toUpperCase()}`,
      type: raw.type,
      customerId: raw.customerId,
      customerName: raw.customerName || raw.customer?.name || "Customer",
      customerPhone: raw.customerPhone || raw.customer?.phone || "0812-3456-7890",
      goodsItemIds: Array.isArray(raw.goodsItemIds)
        ? raw.goodsItemIds
        : raw.items?.map((i: any) => i.goodsItemId || i.id) || [],
      goodsSummary: raw.goodsSummary || "WMS Cargo Commodity",
      totalVolumeM3: Number(raw.totalVolumeM3 || 0),
      totalWeightKg: Number(raw.totalWeightKg || 0),
      requiresReefer: Boolean(raw.requiresReefer),
      originAddress: raw.originAddress || "Cakung Logistics Central Hub",
      originCity: raw.originCity || "East Jakarta",
      destinationAddress: raw.destinationAddress || "Recipient Destination Address",
      destinationCity: raw.destinationCity || "South Jakarta",
      scheduledDate: raw.scheduledDate || raw.createdAt,
      scheduledTimeSlot: raw.scheduledTimeSlot || "08:00 - 12:00 WIB",
      driverId: raw.driverId,
      driverName: raw.driverName || raw.driver?.name,
      driverPhone: raw.driverPhone || raw.driver?.phone,
      vehicleId: raw.vehicleId,
      vehiclePlate: raw.vehiclePlate || raw.vehicle?.plateNumber,
      vehicleType: raw.vehicleType || raw.vehicle?.type,
      status: raw.status,
      estimatedDurationMins: Number(raw.estimatedDurationMins || 60),
      distanceKm: Number(raw.distanceKm || 25),
      isDelayed: Boolean(raw.isDelayed),
      delayReason: raw.delayReason,
      rescheduledTime: raw.rescheduledTime,
      proofOfDeliveryUrl: raw.proofOfDeliveryUrl,
      confirmedByCustomer: Boolean(raw.confirmedByCustomer || raw.status === "CONFIRMED" || raw.status === "DELIVERED"),
      confirmedByDriver: Boolean(raw.confirmedByDriver || raw.proofOfDeliveryUrl),
      confirmedByAdmin: Boolean(raw.confirmedByAdmin),
      confirmedAt: raw.confirmedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockLogisticsService implements ILogisticsService {
  async getOrders(
    driverId?: string,
    customerId?: string
  ): Promise<DeliveryOrder[]> {
    return mockDb.getOrders(driverId, customerId);
  }

  async getOrderById(id: string): Promise<DeliveryOrder | null> {
    const orders = await mockDb.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  }

  async getVehicles(): Promise<Vehicle[]> {
    return mockDb.getVehicles();
  }

  async assignVehicle(
    vehicleId: string,
    driverId: string,
    driverName?: string
  ): Promise<Vehicle> {
    return mockDb.assignVehicleDriver(vehicleId, driverId, driverName || "Driver");
  }

  async updateOrderStatus(
    orderId: string,
    status: DeliveryOrder["status"]
  ): Promise<DeliveryOrder> {
    return mockDb.updateOrderStatus(orderId, status);
  }

  async createOrder(order: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
    return mockDb.createOrder(order as DeliveryOrder);
  }

  async submitPod(
    orderId: string,
    data: {
      recipientName: string;
      photoUrl: string;
      signatureData: string;
      rating?: number;
      note?: string;
    }
  ): Promise<DeliveryOrder> {
    const updated = await mockDb.updateOrderStatus(orderId, "DELIVERED");
    return {
      ...updated,
      proofOfDeliveryUrl: data.photoUrl,
    };
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const logisticsService: ILogisticsService = isMock
  ? new MockLogisticsService()
  : new HttpLogisticsService();
