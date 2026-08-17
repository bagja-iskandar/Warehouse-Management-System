import { mockDb } from "@/mock/db/mock-db";
import { GoodsItem, CreateGoodsInput } from "@/types";
import { calculateVolumeM3, generateBarcodeId } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

export interface IGoodsService {
  getGoods(customerId?: string): Promise<GoodsItem[]>;
  getGoodsById(id: string): Promise<GoodsItem | null>;
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
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpGoodsService implements IGoodsService {
  async getGoods(customerId?: string): Promise<GoodsItem[]> {
    const params: Record<string, any> = { limit: 100 };
    if (customerId) {
      params.customerId = customerId;
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

  private mapBackendGoodsToFrontend(raw: any): GoodsItem {
    return {
      id: raw.id,
      barcode: raw.barcode,
      customerId: raw.customerId,
      customerName: raw.customerName || raw.customer?.name || "Customer",
      warehouseId: raw.warehouseId || raw.warehouse?.id || "wh-jkt-central",
      warehouseName:
        raw.warehouseName ||
        raw.warehouse?.name ||
        "Gudang Utama Cakung Logistics Hub",
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
      unit: raw.unit || "Koli",
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

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockGoodsService implements IGoodsService {
  async getGoods(customerId?: string): Promise<GoodsItem[]> {
    return mockDb.getGoods(customerId);
  }

  async getGoodsById(id: string): Promise<GoodsItem | null> {
    return mockDb.getGoodsById(id);
  }

  async createGoods(
    input: CreateGoodsInput,
    customerId: string,
    customerName: string
  ): Promise<GoodsItem> {
    const volumeM3 = calculateVolumeM3(
      input.dimensions.lengthCm,
      input.dimensions.widthCm,
      input.dimensions.heightCm
    );

    const ratePerM3 = input.requiresColdStorage ? 2500000 : 1000000;
    const monthlyFee = Math.max(500000, Math.round(volumeM3 * ratePerM3));

    const barcode = generateBarcodeId("BRG");
    const newGoods: GoodsItem = {
      id: `brg-${Date.now()}`,
      barcode,
      customerId,
      customerName,
      warehouseId: input.warehouseId,
      warehouseName: "Gudang Utama Cakung Logistics Hub",
      name: input.name,
      category: input.category,
      description: input.description,
      dimensions: {
        lengthCm: input.dimensions.lengthCm,
        widthCm: input.dimensions.widthCm,
        heightCm: input.dimensions.heightCm,
        volumeM3,
        weightKg: input.dimensions.weightKg,
      },
      quantity: input.quantity,
      unit: input.unit,
      requiresColdStorage: input.requiresColdStorage,
      targetTemperatureMin: input.requiresColdStorage ? -20 : undefined,
      targetTemperatureMax: input.requiresColdStorage ? -16 : undefined,
      storageStartDate: new Date().toISOString(),
      monthlyRentalFee: monthlyFee,
      status: input.pickupRequired ? "PENDING_PICKUP" : "STORED",
      qrCodeData: `WMS://ITEM/${barcode}`,
      history: [
        {
          id: `hist-${Date.now()}`,
          goodsId: `brg-${Date.now()}`,
          status: input.pickupRequired ? "PENDING_PICKUP" : "STORED",
          title: "Registrasi Barang Berhasil",
          description: `Barang didaftarkan oleh ${customerName}`,
          actorName: customerName,
          actorRole: "Customer",
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return mockDb.createGoods(newGoods);
  }

  async updateStatus(
    id: string,
    status: GoodsItem["status"],
    note?: string,
    _slotId?: string
  ): Promise<GoodsItem> {
    return mockDb.updateGoodsStatus(id, status, note);
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const goodsService: IGoodsService = isMock
  ? new MockGoodsService()
  : new HttpGoodsService();
