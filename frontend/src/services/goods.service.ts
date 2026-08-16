import { mockDb } from "@/mock/db/mock-db";
import { GoodsItem, CreateGoodsInput } from "@/types";
import { calculateVolumeM3, generateBarcodeId } from "@/lib/utils";

export interface IGoodsService {
  getGoods(customerId?: string): Promise<GoodsItem[]>;
  getGoodsById(id: string): Promise<GoodsItem | null>;
  createGoods(input: CreateGoodsInput, customerId: string, customerName: string): Promise<GoodsItem>;
  updateStatus(id: string, status: GoodsItem["status"], note?: string): Promise<GoodsItem>;
}

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

    // Rate calculation: Cold storage 2.5jt/m3, standard 1jt/m3
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
    note?: string
  ): Promise<GoodsItem> {
    return mockDb.updateGoodsStatus(id, status, note);
  }
}

export const goodsService: IGoodsService = new MockGoodsService();
