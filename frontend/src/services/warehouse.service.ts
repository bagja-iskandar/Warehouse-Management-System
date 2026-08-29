import { WarehouseDetail } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface RentSpaceInput {
  warehouseId: string;
  storageType: "COLD_STORAGE" | "STANDARD" | "HEAVY_DUTY";
  volumeM3: number;
  durationMonths: number;
  startDate?: string;
}

export interface RentSpaceResponse {
  rental: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    storageType: string;
    volumeM3: number;
    durationMonths: number;
    ratePerM3: number;
    monthlyFee: number;
    grandTotal: number;
    startDate: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    totalAmount: number;
    status: string;
  };
}

export interface ChangeRentalWarehouseInput {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  reason?: string;
}

export interface ChangeRentalWarehouseResponse {
  message: string;
  sourceWarehouse: { id: string; code: string; name: string };
  targetWarehouse: { id: string; code: string; name: string };
  transferredGoodsCount: number;
  updatedOrdersCount: number;
  priceAdjustment?: {
    type: string;
    amount: number;
  };
}

export interface IWarehouseService {
  getWarehouses(): Promise<WarehouseDetail[]>;
  getCustomerActiveWarehouses(): Promise<WarehouseDetail[]>;
  getWarehouseById(id: string): Promise<WarehouseDetail | null>;
  rentSpace(input: RentSpaceInput): Promise<RentSpaceResponse>;
  changeRentalWarehouse(input: ChangeRentalWarehouseInput): Promise<ChangeRentalWarehouseResponse>;
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

  async getCustomerActiveWarehouses(): Promise<WarehouseDetail[]> {
    try {
      const list = await apiClient<any[]>("/warehouses/customer/active");
      return (list || []).map((item) => ({
        ...item,
        slots: item.slots || [],
      }));
    } catch {
      return [];
    }
  }

  async getWarehouseById(id: string): Promise<WarehouseDetail | null> {
    try {
      const detail = await apiClient<WarehouseDetail>(`/warehouses/${id}`);
      return detail;
    } catch {
      return null;
    }
  }

  async rentSpace(input: RentSpaceInput): Promise<RentSpaceResponse> {
    return await apiClient<RentSpaceResponse>("/warehouses/rent", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async changeRentalWarehouse(input: ChangeRentalWarehouseInput): Promise<ChangeRentalWarehouseResponse> {
    return await apiClient<ChangeRentalWarehouseResponse>("/warehouses/change-rental-warehouse", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export const warehouseService: IWarehouseService = new HttpWarehouseService();
