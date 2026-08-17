import { mockDb } from "@/mock/db/mock-db";
import { WarehouseDetail } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface IWarehouseService {
  getWarehouses(): Promise<WarehouseDetail[]>;
  getWarehouseById(id: string): Promise<WarehouseDetail | null>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpWarehouseService implements IWarehouseService {
  async getWarehouses(): Promise<WarehouseDetail[]> {
    const list = await apiClient<any[]>("/warehouses");
    return list.map((item) => ({
      ...item,
      slots: item.slots || [],
    }));
  }

  async getWarehouseById(id: string): Promise<WarehouseDetail | null> {
    try {
      const detail = await apiClient<WarehouseDetail>(`/warehouses/${id}`);
      return detail;
    } catch (err) {
      return null;
    }
  }
}

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockWarehouseService implements IWarehouseService {
  async getWarehouses(): Promise<WarehouseDetail[]> {
    return mockDb.getWarehouses();
  }

  async getWarehouseById(id: string): Promise<WarehouseDetail | null> {
    return mockDb.getWarehouseById(id);
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const warehouseService: IWarehouseService = isMock
  ? new MockWarehouseService()
  : new HttpWarehouseService();
