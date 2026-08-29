import { GoodsItem, CreateGoodsInput } from "@/types";
import { apiClient } from "@/lib/api-client";

export interface GoodsMutationItem {
  id: string;
  goodsId: string;
  sku: string;
  itemName: string;
  quantityKoli: number;
  volumeM3: number;
  slotCode: string;
  status: string;
  type: "INBOUND" | "OUTBOUND" | "TRANSFER";
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  location?: string;
  timestamp: string;
}

export interface IGoodsService {
  getGoods(
    customerIdOrOptions?:
      | string
      | {
          customerId?: string;
          warehouseId?: string;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
    warehouseId?: string
  ): Promise<GoodsItem[]>;
  getGoodsById(id: string): Promise<GoodsItem | null>;
  getMutations(customerId?: string): Promise<GoodsMutationItem[]>;
  createGoods(
    input: CreateGoodsInput,
    customerId: string,
    customerName: string
  ): Promise<GoodsItem>;
  updateStatus(
    id: string,
    status: GoodsItem["status"],
    note?: string,
    slotId?: string
  ): Promise<GoodsItem>;
  transferSlot(
    id: string,
    targetSlotId: string,
    reason: string,
    note?: string
  ): Promise<GoodsItem>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpGoodsService implements IGoodsService {
  async getGoods(
    customerIdOrOptions?:
      | string
      | {
          customerId?: string;
          warehouseId?: string;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
    warehouseIdArg?: string
  ): Promise<GoodsItem[]> {
    const params: Record<string, any> = { limit: 100 };
    if (typeof customerIdOrOptions === "object" && customerIdOrOptions !== null) {
      if (customerIdOrOptions.customerId) params.customerId = customerIdOrOptions.customerId;
      if (customerIdOrOptions.warehouseId) params.warehouseId = customerIdOrOptions.warehouseId;
      if (customerIdOrOptions.sortBy) params.sortBy = customerIdOrOptions.sortBy;
      if (customerIdOrOptions.sortOrder) params.sortOrder = customerIdOrOptions.sortOrder;
    } else {
      if (customerIdOrOptions) params.customerId = customerIdOrOptions;
      if (warehouseIdArg) params.warehouseId = warehouseIdArg;
    }

    const res = await apiClient<{ items: any[]; totalItems: number }>("/goods", {
      params,
    });

    const items = res?.items || (Array.isArray(res) ? res : []);

    return items.map((item) => this.mapBackendGoodsToFrontend(item));
  }

  async getGoodsById(id: string): Promise<GoodsItem | null> {
    try {
      const item = await apiClient<any>(`/goods/${id}`);
      if (!item) return null;
      return this.mapBackendGoodsToFrontend(item);
    } catch (err) {
      return null;
    }
  }

  async getMutations(customerId?: string): Promise<GoodsMutationItem[]> {
    try {
      const params: Record<string, any> = {};
      if (customerId) params.customerId = customerId;
      const res = await apiClient<GoodsMutationItem[]>("/goods/mutations", { params });
      return res || [];
    } catch {
      return [];
    }
  }

  async createGoods(
    input: CreateGoodsInput,
    _customerId: string,
    _customerName: string
  ): Promise<GoodsItem> {
    const payload = {
      name: input.name,
      category: input.category,
      description: input.description,
      lengthCm: Number(input.dimensions.lengthCm),
      widthCm: Number(input.dimensions.widthCm),
      heightCm: Number(input.dimensions.heightCm),
      weightKg: Number(input.dimensions.weightKg),
      quantity: Number(input.quantity),
      unit: input.unit,
      requiresColdStorage: Boolean(input.requiresColdStorage),
      targetTempMin: input.requiresColdStorage ? -22 : undefined,
      targetTempMax: input.requiresColdStorage ? -18 : undefined,
      warehouseId: input.warehouseId,
      pickupRequired: Boolean(input.pickupRequired),
      pickupAddress: input.pickupAddress,
      pickupDate: input.pickupDate
        ? new Date(input.pickupDate).toISOString()
        : undefined,
    };

    const res = await apiClient<any>("/goods", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return this.mapBackendGoodsToFrontend(res);
  }

  async updateStatus(
    id: string,
    status: GoodsItem["status"],
    note?: string,
    slotId?: string
  ): Promise<GoodsItem> {
    const payload: Record<string, any> = {
      status,
      note,
    };
    if (slotId) {
      payload.slotId = slotId;
    }

    const res = await apiClient<any>(`/goods/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    return this.mapBackendGoodsToFrontend(res);
  }

  async transferSlot(
    id: string,
    targetSlotId: string,
    reason: string,
    note?: string
  ): Promise<GoodsItem> {
    const payload = {
      targetSlotId,
      reason,
      note,
    };

    const res = await apiClient<any>(`/goods/${id}/transfer-slot`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return this.mapBackendGoodsToFrontend(res);
  }

  private mapBackendGoodsToFrontend(raw: any): GoodsItem {
    return {
      id: raw.id,
      barcode: raw.barcode,
      customerId: raw.customerId,
      customerName: raw.customerName || raw.customer?.name || "Customer",
      warehouseId: raw.warehouseId || raw.warehouse?.id || "",
      warehouseName:
        raw.warehouseName ||
        raw.warehouse?.name ||
        "Warehouse Hub",
      slotId: raw.slotId || raw.slot?.id,
      slotCode: raw.slotCode || raw.slot?.code,
      name: raw.name,
      category: raw.category,
      description: raw.description || "",
      dimensions: {
        lengthCm: raw.dimensions?.lengthCm || 0,
        widthCm: raw.dimensions?.widthCm || 0,
        heightCm: raw.dimensions?.heightCm || 0,
        volumeM3: raw.dimensions?.volumeM3 || 0,
        weightKg: raw.dimensions?.weightKg || 0,
      },
      quantity: raw.quantity,
      unit: raw.unit || "Package",
      requiresColdStorage: Boolean(raw.requiresColdStorage),
      targetTemperatureMin: raw.targetTempMin,
      targetTemperatureMax: raw.targetTempMax,
      currentTemperature: raw.currentTemp,
      storageStartDate: raw.storageStartDate || raw.createdAt,
      storageEndDate: raw.storageEndDate,
      monthlyRentalFee: Number(raw.monthlyRentalFee || 0),
      status: raw.status,
      imageUrl: raw.imageUrl,
      qrCodeData: raw.qrCodeData || `WMS://ITEM/${raw.barcode}`,
      history: Array.isArray(raw.history)
        ? raw.history.map((h: any) => ({
            id: h.id,
            goodsId: h.goodsId || raw.id,
            status: h.status,
            title: h.title,
            description: h.description,
            actorName: h.actorName || "System",
            actorRole: h.actorRole || "System",
            timestamp: h.timestamp || h.createdAt,
            location: h.location,
          }))
        : [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

export const goodsService: IGoodsService = new HttpGoodsService();
