import { mockDb } from "@/mock/db/mock-db";
import { DeliveryOrder, Vehicle } from "@/types";

export interface ILogisticsService {
  getOrders(driverId?: string, customerId?: string): Promise<DeliveryOrder[]>;
  getVehicles(): Promise<Vehicle[]>;
  assignVehicle(vehicleId: string, driverId: string, driverName: string): Promise<Vehicle>;
  updateOrderStatus(orderId: string, status: DeliveryOrder["status"]): Promise<DeliveryOrder>;
  createOrder(order: DeliveryOrder): Promise<DeliveryOrder>;
}

export class MockLogisticsService implements ILogisticsService {
  async getOrders(driverId?: string, customerId?: string): Promise<DeliveryOrder[]> {
    return mockDb.getOrders(driverId, customerId);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return mockDb.getVehicles();
  }

  async assignVehicle(vehicleId: string, driverId: string, driverName: string): Promise<Vehicle> {
    return mockDb.assignVehicleDriver(vehicleId, driverId, driverName);
  }

  async updateOrderStatus(
    orderId: string,
    status: DeliveryOrder["status"]
  ): Promise<DeliveryOrder> {
    return mockDb.updateOrderStatus(orderId, status);
  }

  async createOrder(order: DeliveryOrder): Promise<DeliveryOrder> {
    return mockDb.createOrder(order);
  }
}

export const logisticsService: ILogisticsService = new MockLogisticsService();
