import { mockDb } from "@/mock/db/mock-db";
import { WarehouseDetail } from "@/types";

export interface IWarehouseService {
  getWarehouses(): Promise<WarehouseDetail[]>;
  getWarehouseById(id: string): Promise<WarehouseDetail | null>;
}

export class MockWarehouseService implements IWarehouseService {
  async getWarehouses(): Promise<WarehouseDetail[]> {
    return mockDb.getWarehouses();
  }

  async getWarehouseById(id: string): Promise<WarehouseDetail | null> {
    return mockDb.getWarehouseById(id);
  }
}

export const warehouseService: IWarehouseService = new MockWarehouseService();
