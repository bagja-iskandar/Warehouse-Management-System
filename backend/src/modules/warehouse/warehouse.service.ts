import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  GoodsStorageStatus,
  InvoiceStatus,
  NotificationCategory,
  Prisma,
  RelatedEntityType,
  SlotStatus,
  StorageZoneType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { RentWarehouseSpaceDto } from './dto/rent-warehouse.dto';
import { WarehouseQueryDto } from './dto/warehouse-query.dto';
import {
  StorageSlotResponseDto,
  StorageZoneResponseDto,
  WarehouseDetailResponseDto,
  WarehouseListItemDto,
} from './dto/warehouse-response.dto';

export interface RentalBookingResult {
  rental: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    storageType: StorageZoneType;
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

export type WarehouseWithRelations = {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  totalCapacityM3: Prisma.Decimal | number;
  usedCapacityM3: Prisma.Decimal | number;
  isActive: boolean;
  managerName: string;
  contactPhone: string;
  createdAt: Date;
  updatedAt: Date;
  zones: Array<{ id: string; name: string; type: StorageZoneType; capacityM3: Prisma.Decimal | number; usedM3: Prisma.Decimal | number; targetTempMin?: Prisma.Decimal | number | null; targetTempMax?: Prisma.Decimal | number | null }>;
  slots: Array<{ id: string; warehouseId: string; zoneId?: string | null; code: string; zone: StorageZoneType; capacityM3: Prisma.Decimal | number; usedM3: Prisma.Decimal | number; status: SlotStatus; goodsItems?: Array<{ id: string; volumeM3: Prisma.Decimal | number; status?: GoodsStorageStatus }> }>;
  goodsItems?: Array<{ id: string; volumeM3: Prisma.Decimal | number; status?: GoodsStorageStatus }>;
};

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  // Master rate per m3/month (IDR)
  private readonly STORAGE_RATES: Record<StorageZoneType, number> = {
    [StorageZoneType.COLD_STORAGE]: 150_000,
    [StorageZoneType.STANDARD]: 50_000,
    [StorageZoneType.HEAVY_DUTY]: 75_000,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil daftar semua fasilitas gudang beserta ringkasan kapasitas dan utilisasi slot real dari PostgreSQL.
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
          include: {
            goodsItems: {
              where: { status: GoodsStorageStatus.STORED },
              select: {
                id: true,
                volumeM3: true,
                status: true,
              },
            },
          },
        },
        goodsItems: {
          where: { status: GoodsStorageStatus.STORED },
          select: {
            id: true,
            volumeM3: true,
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
              select: {
                id: true,
                barcode: true,
                name: true,
                quantity: true,
                unit: true,
                volumeM3: true,
                weightKg: true,
                category: true,
                status: true,
                storageStartDate: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                    companyName: true,
                  },
                },
              },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Fasilitas gudang dengan ID atau kode '${id}' tidak ditemukan`);
    }

    const zoneDetails: StorageZoneResponseDto[] = warehouse.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      type: zone.type,
      capacityM3: Number(zone.capacityM3),
      usedM3: Number(zone.usedM3),
      targetTempMin: zone.targetTempMin ? Number(zone.targetTempMin) : null,
      targetTempMax: zone.targetTempMax ? Number(zone.targetTempMax) : null,
    }));

    // Real Dynamic Aggregation for all storage slots
    const slots: StorageSlotResponseDto[] = warehouse.slots.map((slot) => {
      const activeStored = slot.goodsItems.filter((g) => g.status === GoodsStorageStatus.STORED);
      const goodsIds = activeStored.map((g) => g.id);

      const calculatedSlotUsedM3 = Number(
        activeStored.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2),
      );
      // If DB has a manually synchronized usedM3 or calculated from active goods
      const actualSlotUsed = calculatedSlotUsedM3 > 0 ? calculatedSlotUsedM3 : Number(slot.usedM3);

      const actualSlotStatus =
        slot.status === SlotStatus.MAINTENANCE
          ? SlotStatus.MAINTENANCE
          : actualSlotUsed > 0
          ? SlotStatus.OCCUPIED
          : SlotStatus.AVAILABLE;

      const storedGoods = activeStored.map((g) => ({
        id: g.id,
        barcode: g.barcode,
        name: g.name,
        quantity: g.quantity,
        unit: g.unit,
        volumeM3: Number(g.volumeM3),
        weightKg: Number(g.weightKg),
        category: g.category,
        customerName: g.customer?.companyName || g.customer?.name || 'Customer',
        customerCompany: g.customer?.companyName || null,
        storageStartDate: g.storageStartDate ? g.storageStartDate.toISOString() : null,
      }));

      return {
        id: slot.id,
        warehouseId: slot.warehouseId,
        zoneId: slot.zoneId,
        code: slot.code,
        zone: slot.zone,
        capacityM3: Number(slot.capacityM3),
        usedM3: actualSlotUsed,
        temperatureCelsius: slot.temperatureCelsius ? Number(slot.temperatureCelsius) : null,
        humidityPercent: slot.humidityPercent ? Number(slot.humidityPercent) : null,
        status: actualSlotStatus,
        currentGoodsCount: goodsIds.length,
        currentGoodsIds: goodsIds,
        storedGoods,
      };
    });

    // Real Dynamic Aggregation for the entire warehouse
    const calculatedWarehouseUsedM3 = Number(
      slots.reduce((sum, s) => sum + s.usedM3, 0).toFixed(2),
    );
    const actualWarehouseUsed =
      calculatedWarehouseUsedM3 > 0 ? calculatedWarehouseUsedM3 : Number(warehouse.usedCapacityM3);
    const totalCap = Number(warehouse.totalCapacityM3);
    const occupancyPercent =
      totalCap > 0 ? Number(((actualWarehouseUsed / totalCap) * 100).toFixed(1)) : 0;
    const occupiedSlotsCount = slots.filter((s) => s.status === SlotStatus.OCCUPIED || s.usedM3 > 0).length;

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
      usedCapacityM3: actualWarehouseUsed,
      occupancyPercent,
      slotsCount: slots.length,
      occupiedSlotsCount,
      zones: {
        standardCapacityM3: standardCap,
        coldStorageCapacityM3: coldStorageCap,
        heavyDutyCapacityM3: heavyDutyCap,
      },
      zoneDetails,
      slots,
      isActive: warehouse.isActive,
      managerName: warehouse.managerName,
      contactPhone: warehouse.contactPhone,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    };
  }

  /**
   * Mengambil daftar fasilitas gudang yang sedang aktif disewa atau ditempati oleh Customer tertentu.
   */
  async getCustomerWarehouses(currentUser: AuthenticatedUser): Promise<WarehouseListItemDto[]> {
    if (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.ADMIN) {
      return [];
    }

    // 1. Cari warehouse dari goods yang dimiliki customer
    const goodsWarehouses = await this.prisma.goodsItem.findMany({
      where: { customerId: currentUser.id },
      select: { warehouseId: true },
      distinct: ['warehouseId'],
    });
    const goodsWhIds = goodsWarehouses.map((g) => g.warehouseId);

    // 2. Cari warehouse dari invoices sewa ruang milik customer
    const rentalInvoices = await this.prisma.invoice.findMany({
      where: {
        customerId: currentUser.id,
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: { items: true },
    });

    const invoiceWhCodes = new Set<string>();
    for (const inv of rentalInvoices) {
      for (const item of inv.items) {
        if (item.goodsName && item.goodsName.startsWith('Rental Space:')) {
          const parts = item.goodsName.split(' - ');
          const code = parts[0].replace('Rental Space:', '').trim();
          if (code) invoiceWhCodes.add(code);
        }
      }
    }

    const whereCondition: Prisma.WarehouseWhereInput = {
      OR: [{ id: { in: goodsWhIds } }, { code: { in: Array.from(invoiceWhCodes) } }],
    };

    if (goodsWhIds.length === 0 && invoiceWhCodes.size === 0) {
      return [];
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where: whereCondition,
      include: {
        zones: true,
        slots: {
          include: {
            goodsItems: {
              where: { status: GoodsStorageStatus.STORED },
              select: { id: true, volumeM3: true, status: true },
            },
          },
        },
        goodsItems: {
          where: { status: GoodsStorageStatus.STORED },
          select: { id: true, volumeM3: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    return warehouses.map((wh) => this.mapToListItemDto(wh));
  }

  /**
   * Transaksi Pemesanan Sewa Ruang Gudang (Self-Service Rental Booking)
   */
  async rentSpace(
    dto: RentWarehouseSpaceDto,
    currentUser: AuthenticatedUser,
  ): Promise<RentalBookingResult> {
    if (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya Customer atau Admin yang berhak menyewa ruang gudang');
    }

    // 1. Validasi keberadaan fasilitas gudang
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        OR: [{ id: dto.warehouseId }, { code: dto.warehouseId }],
      },
      include: { zones: true },
    });

    if (!warehouse) {
      throw new NotFoundException(
        `Fasilitas gudang dengan ID atau kode '${dto.warehouseId}' tidak ditemukan`,
      );
    }

    // 2. Hitung biaya sewa
    const ratePerM3 = this.STORAGE_RATES[dto.storageType] || 50_000;
    const monthlyFee = dto.volumeM3 * ratePerM3;
    const grandTotal = monthlyFee * dto.durationMonths;

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const billingMonth = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dueDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 hari jatuh tempo

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const storageTypeLabel =
      dto.storageType === StorageZoneType.COLD_STORAGE
        ? 'Cold Storage Sub-zero (-18°C)'
        : dto.storageType === StorageZoneType.HEAVY_DUTY
          ? 'Heavy Duty Storage Zone'
          : 'Standard Dry Storage (24°C)';

    // 3. Eksekusi transaksi atomik di PostgreSQL via Prisma Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: currentUser.id,
          billingMonth,
          issueDate: startDate,
          dueDate,
          subtotal: new Prisma.Decimal(grandTotal),
          penaltyFee: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(grandTotal),
          status: InvoiceStatus.UNPAID,
        },
      });

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: `Warehouse Space Rental (${storageTypeLabel} - ${dto.volumeM3} m³ x ${dto.durationMonths} Bulan • ${warehouse.name})`,
          goodsName: `Rental Space: ${warehouse.code} - ${dto.storageType}`,
          volumeM3: new Prisma.Decimal(dto.volumeM3),
          ratePerM3: new Prisma.Decimal(ratePerM3),
          subtotal: new Prisma.Decimal(grandTotal),
        },
      });

      await tx.systemNotification.create({
        data: {
          recipientUserId: currentUser.id,
          recipientRole: currentUser.role,
          title: 'Sewa Ruang Gudang Berhasil Didaftarkan',
          message: `Permohonan sewa ruang gudang sebesar ${dto.volumeM3} m³ (${storageTypeLabel}) di ${warehouse.name} telah berhasil dicatat. Faktur tagihan #${invoiceNumber} telah diterbitkan.`,
          category: NotificationCategory.BILLING_DUE,
          relatedEntityId: invoice.id,
          relatedEntityType: RelatedEntityType.INVOICE,
          actionUrl: '/customer/billing',
        },
      });

      return invoice;
    });

    return {
      rental: {
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        storageType: dto.storageType,
        volumeM3: dto.volumeM3,
        durationMonths: dto.durationMonths,
        ratePerM3,
        monthlyFee,
        grandTotal,
        startDate: startDate.toISOString(),
      },
      invoice: {
        id: result.id,
        invoiceNumber: result.invoiceNumber,
        billingMonth: result.billingMonth,
        issueDate: result.issueDate.toISOString(),
        dueDate: result.dueDate.toISOString(),
        subtotal: Number(result.subtotal),
        totalAmount: Number(result.totalAmount),
        status: result.status,
      },
    };
  }

  /**
   * Helper internal untuk memetakan entity Prisma Warehouse ke WarehouseListItemDto dengan live accounting.
   */
  private mapToListItemDto(warehouse: WarehouseWithRelations): WarehouseListItemDto {
    const totalCap = Number(warehouse.totalCapacityM3);

    // Live calculated used capacity from active STORED goods
    const calculatedUsedCap = warehouse.goodsItems
      ? Number(warehouse.goodsItems.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2))
      : Number(warehouse.usedCapacityM3);

    const actualUsedCap = calculatedUsedCap > 0 ? calculatedUsedCap : Number(warehouse.usedCapacityM3);
    const occupancyPercent = totalCap > 0 ? Number(((actualUsedCap / totalCap) * 100).toFixed(1)) : 0;

    const slotsCount = warehouse.slots.length;
    const occupiedSlotsCount = warehouse.slots.filter((s: any) => {
      if (s.goodsItems && Array.isArray(s.goodsItems)) {
        return s.goodsItems.length > 0;
      }
      return s.status === SlotStatus.OCCUPIED || Number(s.usedM3 || 0) > 0;
    }).length;

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
      usedCapacityM3: actualUsedCap,
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
