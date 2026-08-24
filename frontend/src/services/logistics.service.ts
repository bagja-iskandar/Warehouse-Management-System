import { mockDb } from "@/mock/db/mock-db";
import { DeliveryOrder, DeliveryOrderItem, Vehicle } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface ILogisticsService {
  getOrders(
    driverIdOrOptions?:
      | string
      | {
          driverId?: string;
          customerId?: string;
          status?: string;
          type?: string;
          warehouseId?: string;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
    customerId?: string
  ): Promise<DeliveryOrder[]>;
  getOrderById(id: string): Promise<DeliveryOrder | null>;
  getVehicles(): Promise<Vehicle[]>;
  assignVehicle(
    vehicleId: string,
    driverId: string,
    driverName?: string
  ): Promise<Vehicle>;
  updateOrderStatus(
    orderId: string,
    statusOrOptions:
      | DeliveryOrder["status"]
      | {
          status: DeliveryOrder["status"];
          location?: string;
          note?: string;
          driverId?: string;
          vehicleId?: string;
          isDelayed?: boolean;
          delayReason?: string;
          rescheduledTime?: string;
        },
    location?: string,
    note?: string,
    driverId?: string,
    vehicleId?: string
  ): Promise<DeliveryOrder>;
  createOrder(
    order: Partial<Omit<DeliveryOrder, "items">> & {
      items?: { goodsId: string; quantity: number }[];
      warehouseId?: string;
    }
  ): Promise<DeliveryOrder>;
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
  receiveInboundOrder(
    orderId: string,
    data: {
      receivedQuantity: number;
      damagedQuantity: number;
      missingQuantity: number;
      condition: string;
      receivingNotes?: string;
    }
  ): Promise<DeliveryOrder>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpLogisticsService implements ILogisticsService {
  async getOrders(
    driverIdOrOptions?:
      | string
      | {
          driverId?: string;
          customerId?: string;
          status?: string;
          type?: string;
          warehouseId?: string;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
    customerIdArg?: string
  ): Promise<DeliveryOrder[]> {
    const params: Record<string, any> = { limit: 100 };
    if (typeof driverIdOrOptions === "object" && driverIdOrOptions !== null) {
      if (driverIdOrOptions.driverId) params.driverId = driverIdOrOptions.driverId;
      if (driverIdOrOptions.customerId) params.customerId = driverIdOrOptions.customerId;
      if (driverIdOrOptions.status) params.status = driverIdOrOptions.status;
      if (driverIdOrOptions.type) params.type = driverIdOrOptions.type;
      if (driverIdOrOptions.warehouseId) params.warehouseId = driverIdOrOptions.warehouseId;
      if (driverIdOrOptions.sortBy) params.sortBy = driverIdOrOptions.sortBy;
      if (driverIdOrOptions.sortOrder) params.sortOrder = driverIdOrOptions.sortOrder;
    } else {
      if (driverIdOrOptions) params.driverId = driverIdOrOptions;
      if (customerIdArg) params.customerId = customerIdArg;
    }

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
    statusOrOptions:
      | DeliveryOrder["status"]
      | {
          status: DeliveryOrder["status"];
          location?: string;
          note?: string;
          driverId?: string;
          vehicleId?: string;
          isDelayed?: boolean;
          delayReason?: string;
          rescheduledTime?: string;
        },
    location?: string,
    note?: string,
    driverIdArg?: string,
    vehicleIdArg?: string
  ): Promise<DeliveryOrder> {
    const payload: Record<string, any> = {};

    if (typeof statusOrOptions === "object" && statusOrOptions !== null) {
      payload.status = statusOrOptions.status;
      if (statusOrOptions.location) payload.location = statusOrOptions.location;
      if (statusOrOptions.note) payload.note = statusOrOptions.note;
      if (statusOrOptions.driverId) payload.driverId = statusOrOptions.driverId;
      if (statusOrOptions.vehicleId) payload.vehicleId = statusOrOptions.vehicleId;
      if (statusOrOptions.isDelayed !== undefined)
        payload.isDelayed = statusOrOptions.isDelayed;
      if (statusOrOptions.delayReason)
        payload.delayReason = statusOrOptions.delayReason;
      if (statusOrOptions.rescheduledTime)
        payload.rescheduledTime = statusOrOptions.rescheduledTime;
    } else {
      payload.status = statusOrOptions;
      if (location) payload.location = location;
      if (note) payload.note = note;
      if (driverIdArg) payload.driverId = driverIdArg;
      if (vehicleIdArg) payload.vehicleId = vehicleIdArg;
    }

    const res = await apiClient<any>(`/logistics/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return this.mapBackendOrderToFrontend(res);
  }

  async createOrder(
    order: Partial<Omit<DeliveryOrder, "items">> & {
      items?: { goodsId: string; quantity: number }[];
      warehouseId?: string;
    }
  ): Promise<DeliveryOrder> {
    const goodsItemIds =
      order.items && order.items.length > 0
        ? Array.from(new Set(order.items.map((i) => i.goodsId)))
        : Array.isArray(order.goodsItemIds)
        ? order.goodsItemIds
        : [];

    const payload: Record<string, any> = {
      type: order.type || "PICKUP",
      goodsItemIds,
      originAddress: order.originAddress || "Origin Address",
      originCity: order.originCity || "Jakarta",
      destinationAddress:
        order.destinationAddress || "Destination Address",
      destinationCity: order.destinationCity || "Jakarta",
      scheduledDate:
        order.scheduledDate || new Date().toISOString().split("T")[0],
      scheduledTimeSlot: order.scheduledTimeSlot || "08:00 - 12:00 WIB",
    };

    if (order.items && order.items.length > 0) payload.items = order.items;
    if (order.warehouseId) payload.warehouseId = order.warehouseId;
    if (order.customerId) payload.customerId = order.customerId;
    if (order.vehicleId) payload.vehicleId = order.vehicleId;
    if (order.driverId) payload.driverId = order.driverId;
    if (order.distanceKm != null) payload.distanceKm = Number(order.distanceKm);
    if (order.estimatedDurationMins != null)
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

  async receiveInboundOrder(
    orderId: string,
    data: {
      receivedQuantity: number;
      damagedQuantity: number;
      missingQuantity: number;
      condition: string;
      receivingNotes?: string;
    }
  ): Promise<DeliveryOrder> {
    const payload = {
      receivedQuantity: Number(data.receivedQuantity),
      damagedQuantity: Number(data.damagedQuantity),
      missingQuantity: Number(data.missingQuantity),
      condition: data.condition,
      receivingNotes: data.receivingNotes,
    };

    const res = await apiClient<any>(`/logistics/orders/${orderId}/receive`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return this.mapBackendOrderToFrontend(res);
  }

  private mapBackendOrderToFrontend(raw: any): DeliveryOrder {
    const mappedItems: DeliveryOrderItem[] =
      Array.isArray(raw.items) && raw.items.length > 0
        ? raw.items.map((it: any) => ({
            id: it.id,
            goodsId: it.goodsId || it.id,
            name: it.name || "Cargo Item",
            barcode: it.barcode || "",
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "Packages",
            requiresColdStorage: Boolean(it.requiresColdStorage),
          }))
        : Array.isArray(raw.orderItems) && raw.orderItems.length > 0
        ? raw.orderItems.map((oi: any) => ({
            id: oi.id,
            goodsId: oi.goodsId || oi.goods?.id,
            name: oi.goods?.name || oi.name || "Cargo Item",
            barcode: oi.goods?.barcode || oi.barcode || "",
            quantity: Number(oi.quantity) || 1,
            unit: oi.goods?.unit || oi.unit || "Packages",
            requiresColdStorage: Boolean(oi.goods?.requiresColdStorage),
          }))
        : [];

    const computedTotalPackages =
      typeof raw.totalPackages === "number" && raw.totalPackages > 0
        ? raw.totalPackages
        : mappedItems.length > 0
        ? mappedItems.reduce((acc, i) => acc + (i.quantity || 0), 0)
        : 1;

    return {
      id: raw.id,
      orderNumber: raw.orderNumber || raw.id,
      type: raw.type,
      customerId: raw.customerId,
      customerName: raw.customerName || raw.customer?.name || "",
      customerPhone: raw.customerPhone || raw.customer?.phone || "",
      goodsItemIds: Array.isArray(raw.goodsItemIds)
        ? raw.goodsItemIds
        : mappedItems.map((i) => i.goodsId || i.id).filter(Boolean) as string[],
      goodsSummary: raw.goodsSummary || "",
      items: mappedItems,
      totalPackages: computedTotalPackages,
      totalVolumeM3: Number(raw.totalVolumeM3 || 0),
      totalWeightKg: Number(raw.totalWeightKg || 0),
      requiresReefer: Boolean(raw.requiresReefer),
      originAddress: raw.originAddress || "",
      originCity: raw.originCity || "",
      destinationAddress: raw.destinationAddress || "",
      destinationCity: raw.destinationCity || "",
      scheduledDate: raw.scheduledDate || raw.createdAt,
      scheduledTimeSlot: raw.scheduledTimeSlot || "",
      driverId: raw.driverId || undefined,
      driverName: raw.driverName || raw.driver?.name || undefined,
      driverPhone: raw.driverPhone || raw.driver?.phone || undefined,
      vehicleId: raw.vehicleId || undefined,
      vehiclePlate: raw.vehiclePlate || raw.vehicle?.plateNumber || undefined,
      vehicleType: raw.vehicleType || raw.vehicle?.type || undefined,
      status: raw.status,
      estimatedDurationMins: Number(raw.estimatedDurationMins || 0),
      distanceKm: Number(raw.distanceKm || 0),
      isDelayed: Boolean(raw.isDelayed),
      delayReason: raw.delayReason || undefined,
      rescheduledTime: raw.rescheduledTime || undefined,
      proofOfDeliveryUrl: raw.proofOfDeliveryUrl || undefined,
      confirmedByCustomer: Boolean(raw.confirmedByCustomer || raw.status === "CONFIRMED"),
      confirmedByDriver: Boolean(raw.confirmedByDriver || !!raw.proofOfDeliveryUrl),
      confirmedByAdmin: Boolean(raw.confirmedByAdmin),
      confirmedAt: raw.confirmedAt || undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      // Pass through full relations if returned from backend
      orderItems: raw.orderItems,
      driver: raw.driver,
      vehicle: raw.vehicle,
      customer: raw.customer,
    } as any;
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

  async receiveInboundOrder(
    orderId: string,
    data: {
      receivedQuantity: number;
      damagedQuantity: number;
      missingQuantity: number;
      condition: string;
      receivingNotes?: string;
    }
  ): Promise<DeliveryOrder> {
    return mockDb.updateOrderStatus(orderId, "DELIVERED");
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const logisticsService: ILogisticsService = isMock
  ? new MockLogisticsService()
  : new HttpLogisticsService();
