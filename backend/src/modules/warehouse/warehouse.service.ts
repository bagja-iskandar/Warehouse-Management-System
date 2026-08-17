import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import {
  StorageSlotResponseDto,
  StorageZoneResponseDto,
  WarehouseDetailResponseDto,
  WarehouseListItemDto,
} from './dto/warehouse-response.dto';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil daftar semua fasilitas gudang beserta ringkasan kapasitas dan utilisasi slot.
   */
  async findAll(query: WarehouseQueryDto): Promise<WarehouseListItemDto[]> {
    const where: Prisma.WarehouseWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      include: {
        zones: true,
        slots: {
          select: {
            id: true,
            status: true,
            zone: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return warehouses.map((wh) => this.mapToListItemDto(wh));
  }

  /**
   * Mengambil detail lengkap fasilitas gudang berdasarkan ID atau Kode unik, termasuk zona dan visualisasi slot.
   */
  async findById(id: string): Promise<WarehouseDetailResponseDto> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        zones: {
          orderBy: { name: 'asc' },
        },
        slots: {
          include: {
            goodsItems: {
              select: { id: true },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Fasilitas gudang dengan ID atau kode '${id}' tidak ditemukan`);
    }

    const baseItem = this.mapToListItemDto(warehouse);

    const zoneDetails: StorageZoneResponseDto[] = warehouse.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      type: zone.type,
      capacityM3: Number(zone.capacityM3),
      usedM3: Number(zone.usedM3),
      targetTempMin: zone.targetTempMin ? Number(zone.targetTempMin) : null,
      targetTempMax: zone.targetTempMax ? Number(zone.targetTempMax) : null,
    }));

    const slots: StorageSlotResponseDto[] = warehouse.slots.map((slot) => {
      const goodsIds = slot.goodsItems.map((g) => g.id);
      return {
        id: slot.id,
        warehouseId: slot.warehouseId,
        zoneId: slot.zoneId,
        code: slot.code,
        zone: slot.zone,
        capacityM3: Number(slot.capacityM3),
        usedM3: Number(slot.usedM3),
        temperatureCelsius: slot.temperatureCelsius ? Number(slot.temperatureCelsius) : null,
        humidityPercent: slot.humidityPercent ? Number(slot.humidityPercent) : null,
        status: slot.status,
        currentGoodsCount: goodsIds.length,
        currentGoodsIds: goodsIds,
      };
    });

    return {
      ...baseItem,
      zoneDetails,
      slots,
    };
  }

  /**
   * Helper internal untuk memetakan entity Prisma Warehouse ke WarehouseListItemDto.
   */
  private mapToListItemDto(
    warehouse: Prisma.WarehouseGetPayload<{
      include: {
        zones: true;
        slots: {
          select: {
            id: true;
            status: true;
            zone: true;
          };
        };
      };
    }>,
  ): WarehouseListItemDto {
    const totalCap = Number(warehouse.totalCapacityM3);
    const usedCap = Number(warehouse.usedCapacityM3);
    const occupancyPercent = totalCap > 0 ? Number(((usedCap / totalCap) * 100).toFixed(1)) : 0;

    const slotsCount = warehouse.slots.length;
    const occupiedSlotsCount = warehouse.slots.filter((s) => s.status === 'OCCUPIED').length;

    let standardCap = 0;
    let coldStorageCap = 0;
    let heavyDutyCap = 0;

    for (const zone of warehouse.zones) {
      const cap = Number(zone.capacityM3);
      if (zone.type === 'STANDARD') standardCap += cap;
      else if (zone.type === 'COLD_STORAGE') coldStorageCap += cap;
      else if (zone.type === 'HEAVY_DUTY') heavyDutyCap += cap;
    }

    return {
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      totalCapacityM3: totalCap,
      usedCapacityM3: usedCap,
      occupancyPercent,
      slotsCount,
      occupiedSlotsCount,
      zones: {
        standardCapacityM3: standardCap,
        coldStorageCapacityM3: coldStorageCap,
        heavyDutyCapacityM3: heavyDutyCap,
      },
      isActive: warehouse.isActive,
      managerName: warehouse.managerName,
      contactPhone: warehouse.contactPhone,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    };
  }
}
