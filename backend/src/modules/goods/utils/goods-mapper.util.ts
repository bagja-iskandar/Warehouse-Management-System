import { GoodsCategory, GoodsStorageStatus, Prisma } from '@prisma/client';
import {
  GoodsDetailResponseDto,
  GoodsHistoryEventDto,
  GoodsListItemDto,
} from '../dto/goods-response.dto';

export type GoodsItemWithRelations = Prisma.GoodsItemGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        name: true;
        companyName: true;
        email: true;
        phone: true;
      };
    };
    warehouse: {
      select: {
        id: true;
        code: true;
        name: true;
        city: true;
      };
    };
    slot: {
      select: {
        id: true;
        code: true;
        zone: true;
        temperatureCelsius: true;
        status: true;
      };
    };
  };
}>;

export type GoodsItemWithFullDetail = Prisma.GoodsItemGetPayload<{
  include: {
    customer: {
      select: {
        id: true;
        name: true;
        companyName: true;
        email: true;
        phone: true;
      };
    };
    warehouse: {
      select: {
        id: true;
        code: true;
        name: true;
        city: true;
      };
    };
    slot: {
      select: {
        id: true;
        code: true;
        zone: true;
        temperatureCelsius: true;
        status: true;
      };
    };
    history: true;
  };
}>;

export function getGoodsCategoryPrefix(category: GoodsCategory): string {
  switch (category) {
    case GoodsCategory.COLD_FOOD:
      return 'FROZEN';
    case GoodsCategory.FURNITURE:
      return 'FURN';
    case GoodsCategory.GENERAL_ELECTRONICS:
      return 'ELEC';
    case GoodsCategory.TEXTILE:
      return 'TEXT';
    default:
      return 'GEN';
  }
}

export function getGoodsMutationAuditInfo(
  status: GoodsStorageStatus,
  customNote?: string,
): { title: string; description: string } {
  switch (status) {
    case GoodsStorageStatus.PENDING_PICKUP:
      return {
        title: 'Pickup Request Submitted',
        description: customNote || 'Customer submitted WMS fleet pickup request.',
      };
    case GoodsStorageStatus.IN_TRANSIT_INBOUND:
      return {
        title: 'Goods In Transit (Inbound)',
        description:
          customNote || 'Driver picked up cargo and is in transit to the warehouse facility.',
      };
    case GoodsStorageStatus.INSPECTING:
      return {
        title: 'Cargo Inspection & Quality Check',
        description:
          customNote ||
          'Goods arrived at warehouse and are undergoing physical and temperature verification.',
      };
    case GoodsStorageStatus.STORED:
      return {
        title: 'Goods Stored in Rack Slot',
        description:
          customNote ||
          'Cargo inspection approved. Goods placed in designated warehouse storage rack slot.',
      };
    case GoodsStorageStatus.PENDING_DELIVERY:
      return {
        title: 'Outbound Dispatch Requested',
        description:
          customNote || 'Outbound delivery request submitted for transit to destination address.',
      };
    case GoodsStorageStatus.IN_TRANSIT_OUTBOUND:
      return {
        title: 'Goods In Transit (Outbound)',
        description:
          customNote ||
          'Driver is transporting cargo from warehouse to final destination recipient.',
      };
    case GoodsStorageStatus.DELIVERED:
      return {
        title: 'Goods Delivered to Recipient',
        description:
          customNote || 'Cargo handover complete. Rack slot and warehouse capacity released.',
      };
    case GoodsStorageStatus.CANCELLED:
      return {
        title: 'Storage Booking Cancelled',
        description: customNote || 'Goods storage process was cancelled by user or administrator.',
      };
    default:
      return {
        title: `Status Updated: ${status}`,
        description: customNote || `Goods status successfully updated to ${status}.`,
      };
  }
}

export function mapToGoodsListItemDto(item: GoodsItemWithRelations): GoodsListItemDto {
  return {
    id: item.id,
    barcode: item.barcode,
    customerId: item.customerId,
    customerName: item.customer.name,
    customerCompany: item.customer.companyName,
    warehouseId: item.warehouseId,
    warehouseName: item.warehouse.name,
    warehouseCode: item.warehouse.code,
    slotId: item.slotId,
    slotCode: item.slot?.code || null,
    name: item.name,
    category: item.category,
    description: item.description,
    dimensions: {
      lengthCm: Number(item.lengthCm),
      widthCm: Number(item.widthCm),
      heightCm: Number(item.heightCm),
      volumeM3: Number(item.volumeM3),
      weightKg: Number(item.weightKg),
    },
    quantity: item.quantity,
    unit: item.unit,
    requiresColdStorage: item.requiresColdStorage,
    targetTempMin: item.targetTempMin ? Number(item.targetTempMin) : null,
    targetTempMax: item.targetTempMax ? Number(item.targetTempMax) : null,
    currentTemp: item.currentTemp ? Number(item.currentTemp) : null,
    storageStartDate: item.storageStartDate.toISOString(),
    storageEndDate: item.storageEndDate ? item.storageEndDate.toISOString() : null,
    monthlyRentalFee: Number(item.monthlyRentalFee),
    status: item.status,
    imageUrl: item.imageUrl,
    qrCodeData: item.qrCodeData,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function mapToGoodsDetailDto(goods: GoodsItemWithFullDetail): GoodsDetailResponseDto {
  const baseItem = mapToGoodsListItemDto(goods);

  const history: GoodsHistoryEventDto[] = goods.history.map((h) => ({
    id: h.id,
    goodsId: h.goodsId,
    status: h.status,
    title: h.title,
    description: h.description,
    actorName: h.actorName,
    actorRole: h.actorRole,
    location: h.location,
    timestamp: h.timestamp.toISOString(),
  }));

  return {
    ...baseItem,
    warehouse: goods.warehouse,
    slot: goods.slot
      ? {
          id: goods.slot.id,
          code: goods.slot.code,
          zone: goods.slot.zone,
          temperatureCelsius: goods.slot.temperatureCelsius
            ? Number(goods.slot.temperatureCelsius)
            : null,
          status: goods.slot.status,
        }
      : null,
    customer: goods.customer,
    history,
  };
}
