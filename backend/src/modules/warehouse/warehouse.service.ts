import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GoodsStorageStatus,
  InvoiceStatus,
  NotificationCategory,
  OrderStatus,
  OrderType,
  Prisma,
  RelatedEntityType,
  SlotStatus,
  StorageZoneType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { ChangeRentalWarehouseDto } from './dto/change-rental-warehouse.dto';
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
  zones: Array<{
    id: string;
    name: string;
    type: StorageZoneType;
    capacityM3: Prisma.Decimal | number;
    usedM3: Prisma.Decimal | number;
    targetTempMin?: Prisma.Decimal | number | null;
    targetTempMax?: Prisma.Decimal | number | null;
  }>;
  slots: Array<{
    id: string;
    warehouseId: string;
    zoneId?: string | null;
    code: string;
    zone: StorageZoneType;
    capacityM3: Prisma.Decimal | number;
    usedM3: Prisma.Decimal | number;
    status: SlotStatus;
    goodsItems?: Array<{
      id: string;
      volumeM3: Prisma.Decimal | number;
      status?: GoodsStorageStatus;
    }>;
  }>;
  goodsItems?: Array<{
    id: string;
    volumeM3: Prisma.Decimal | number;
    status?: GoodsStorageStatus;
  }>;
};

import { EventsService } from '../events/events.service';
import { DomainEventType } from '../events/events.types';
import {
  MASTER_STORAGE_RATES,
  DEFAULT_STORAGE_RATE_PER_M3,
  MINIMUM_MONTHLY_RENTAL_FEE,
  INVOICE_PAYMENT_GRACE_DAYS,
} from '../../common/constants/pricing.constants';
import { calculateMonthlyRentalFee } from '../../common/utils/calculation.util';
import { calculateSlotMetrics } from './utils/warehouse-slot-metrics.util';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  // Master rate per m3/month (IDR) from SSOT constants
  private readonly STORAGE_RATES = MASTER_STORAGE_RATES;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

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
              where: { status: GoodsStorageStatus.STORED },
              select: {
                id: true,
                barcode: true,
                name: true,
                quantity: true,
                unit: true,
                lengthCm: true,
                widthCm: true,
                heightCm: true,
                volumeM3: true,
                weightKg: true,
                category: true,
                status: true,
                currentTemp: true,
                storageStartDate: true,
                storageEndDate: true,
                customer: {
                  select: {
                    id: true,
                    name: true,
                    companyName: true,
                    email: true,
                    phone: true,
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
      throw new NotFoundException(`Warehouse facility with ID or code '${id}' not found`);
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

    // Real Dynamic Aggregation for all storage slots (Dual Volume + Weight Capacities)
    const slots: StorageSlotResponseDto[] = warehouse.slots.map((slot) => {
      const activeStored = slot.goodsItems.filter((g) => g.status === GoodsStorageStatus.STORED);
      const goodsIds = activeStored.map((g) => g.id);

      const {
        actualSlotUsedM3,
        availableM3,
        volPct,
        maxWeightKg,
        actualSlotUsedWeightKg,
        availableWeightKg,
        weightPct,
        capacityStatus,
        actualSlotStatus,
      } = calculateSlotMetrics(slot.capacityM3, activeStored, slot.usedM3, slot.status);

      const customerIds = new Set(activeStored.map((g) => g.customer?.id).filter(Boolean));

      const storedGoods = activeStored.map((g) => {
        const unitVol =
          g.quantity > 0
            ? Number((Number(g.volumeM3) / g.quantity).toFixed(6))
            : Number(g.volumeM3);
        const unitWeight =
          g.quantity > 0
            ? Number((Number(g.weightKg) / g.quantity).toFixed(2))
            : Number(g.weightKg);

        return {
          id: g.id,
          barcode: g.barcode,
          name: g.name,
          category: g.category,
          quantity: g.quantity,
          unit: g.unit || 'Packages',
          dimensions: {
            lengthCm: Number(g.lengthCm || 0),
            widthCm: Number(g.widthCm || 0),
            heightCm: Number(g.heightCm || 0),
          },
          unitVolumeM3: unitVol,
          volumeM3: Number(g.volumeM3),
          unitWeightKg: unitWeight,
          weightKg: Number(g.weightKg),
          status: g.status,
          currentTemp: g.currentTemp ? Number(g.currentTemp) : null,
          customerId: g.customer?.id,
          customerName: g.customer?.name || 'Customer Tenant',
          customerCompany: g.customer?.companyName || null,
          customerEmail: g.customer?.email || null,
          customerPhone: g.customer?.phone || null,
          storageStartDate: g.storageStartDate ? g.storageStartDate.toISOString() : null,
          storageEndDate: g.storageEndDate ? g.storageEndDate.toISOString() : null,
        };
      });

      return {
        id: slot.id,
        warehouseId: slot.warehouseId,
        zoneId: slot.zoneId,
        code: slot.code,
        zone: slot.zone,
        capacityM3: Number(slot.capacityM3),
        usedM3: actualSlotUsedM3,

        availableM3,
        volumeUtilizationPercent: volPct,
        maxWeightKg,
        usedWeightKg: actualSlotUsedWeightKg,
        availableWeightKg,
        weightUtilizationPercent: weightPct,
        status: actualSlotStatus,
        capacityStatus,
        temperatureCelsius: slot.temperatureCelsius ? Number(slot.temperatureCelsius) : null,
        humidityPercent: slot.humidityPercent ? Number(slot.humidityPercent) : null,
        currentGoodsCount: goodsIds.length,
        customerCount: customerIds.size,
        totalPackagesCount: activeStored.reduce((sum, g) => sum + g.quantity, 0),
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
    const occupiedSlotsCount = slots.filter(
      (s) => s.status === SlotStatus.OCCUPIED || s.usedM3 > 0,
    ).length;

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
   * Retrieves active warehouse facilities rented or occupied by the current Customer with live rental info & utilization metrics.
   */
  async getCustomerWarehouses(currentUser: AuthenticatedUser): Promise<WarehouseListItemDto[]> {
    if (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.ADMIN) {
      return [];
    }

    // 1. Find warehouses from goods owned by customer
    const goodsWarehouses = await this.prisma.goodsItem.findMany({
      where: {
        customerId: currentUser.id,
        status: { not: GoodsStorageStatus.CANCELLED },
      },
      select: { warehouseId: true },
      distinct: ['warehouseId'],
    });
    const goodsWhIds = goodsWarehouses.map((g) => g.warehouseId);

    // 2. Find warehouses from customer rental invoices
    const rentalInvoices = await this.prisma.invoice.findMany({
      where: {
        customerId: currentUser.id,
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: { items: true },
      orderBy: { issueDate: 'desc' },
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

    // Fetch all customer inventory across these warehouses
    const allCustomerGoods = await this.prisma.goodsItem.findMany({
      where: {
        customerId: currentUser.id,
        warehouseId: { in: warehouses.map((w) => w.id) },
        status: { not: GoodsStorageStatus.CANCELLED },
      },
      select: {
        id: true,
        warehouseId: true,
        volumeM3: true,
        weightKg: true,
        quantity: true,
        status: true,
        createdAt: true,
      },
    });

    return warehouses.map((wh) => {
      const baseDto = this.mapToListItemDto(wh);

      // Find rental invoices for this warehouse
      const whInvoices = rentalInvoices.filter((inv) =>
        inv.items.some(
          (it) =>
            it.goodsName?.includes(wh.code) ||
            it.description?.includes(wh.name) ||
            it.description?.includes(wh.code),
        ),
      );

      let rentedVolumeM3 = 0;
      let durationMonths = 12;
      let earliestStartDate: Date | null = null;
      let latestEndDate: Date | null = null;
      let storageType: StorageZoneType = StorageZoneType.COLD_STORAGE;
      let monthlyFee = 0;
      let latestInvoiceNum = '';
      let invoiceStatus: InvoiceStatus = InvoiceStatus.PAID;

      for (const inv of whInvoices) {
        for (const it of inv.items) {
          if (
            it.goodsName?.includes(wh.code) ||
            it.description?.includes(wh.name) ||
            it.description?.includes(wh.code)
          ) {
            rentedVolumeM3 += Number(it.volumeM3);
            latestInvoiceNum = inv.invoiceNumber;
            invoiceStatus = inv.status;

            // Parse storage zone type
            if (it.goodsName?.includes('STANDARD') || it.description?.includes('Standard')) {
              storageType = StorageZoneType.STANDARD;
            } else if (it.goodsName?.includes('HEAVY_DUTY') || it.description?.includes('Heavy')) {
              storageType = StorageZoneType.HEAVY_DUTY;
            } else {
              storageType = StorageZoneType.COLD_STORAGE;
            }

            // Parse duration
            const durationMatch = it.description?.match(/(\d+)\s*Months?/i);
            if (durationMatch) {
              durationMonths = parseInt(durationMatch[1], 10);
            }

            const itemStartDate = new Date(inv.issueDate);
            if (!earliestStartDate || itemStartDate < earliestStartDate) {
              earliestStartDate = itemStartDate;
            }

            const itemEndDate = new Date(
              itemStartDate.getTime() + durationMonths * 30.4375 * 24 * 60 * 60 * 1000,
            );
            if (!latestEndDate || itemEndDate > latestEndDate) {
              latestEndDate = itemEndDate;
            }

            monthlyFee += Number(it.subtotal) / Math.max(1, durationMonths);
          }
        }
      }

      // Default fallback if rented via legacy or goods only
      if (rentedVolumeM3 === 0) {
        rentedVolumeM3 = 50.0;
        earliestStartDate = new Date('2026-08-01T00:00:00.000Z');
        latestEndDate = new Date('2027-08-01T00:00:00.000Z');
        durationMonths = 12;
      }

      if (!earliestStartDate) earliestStartDate = new Date();
      if (!latestEndDate) {
        latestEndDate = new Date(
          earliestStartDate.getTime() + durationMonths * 30.4375 * 24 * 60 * 60 * 1000,
        );
      }

      const now = new Date();
      const isExpired = now.getTime() > latestEndDate.getTime();
      const rentedWeightKg = Number((rentedVolumeM3 * 100).toFixed(2));

      let rentalStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_PAYMENT' = 'ACTIVE';
      if (isExpired) {
        rentalStatus = 'EXPIRED';
      } else if (latestEndDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
        rentalStatus = 'EXPIRING_SOON';
      } else if (invoiceStatus === InvoiceStatus.UNPAID) {
        rentalStatus = 'PENDING_PAYMENT';
      }

      // Calculate customer inventory utilization in this warehouse
      const customerGoodsInWh = allCustomerGoods.filter(
        (g) => g.warehouseId === wh.id || g.warehouseId === wh.code,
      );

      const stored = customerGoodsInWh.filter(
        (g) =>
          g.status === GoodsStorageStatus.STORED ||
          g.status === GoodsStorageStatus.PENDING_DELIVERY ||
          g.status === GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
      );
      const storedVolumeM3 = Number(
        stored.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(4),
      );
      const storedWeightKg = Number(
        stored.reduce((sum, g) => sum + Number(g.weightKg), 0).toFixed(2),
      );

      const receiving = customerGoodsInWh.filter((g) => g.status === GoodsStorageStatus.INSPECTING);
      const receivingVolumeM3 = Number(
        receiving.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(4),
      );
      const receivingWeightKg = Number(
        receiving.reduce((sum, g) => sum + Number(g.weightKg), 0).toFixed(2),
      );

      const waitingInbound = customerGoodsInWh.filter(
        (g) =>
          g.status === GoodsStorageStatus.DRAFT ||
          g.status === GoodsStorageStatus.PENDING_PICKUP ||
          g.status === GoodsStorageStatus.IN_TRANSIT_INBOUND,
      );
      const waitingInboundVolumeM3 = Number(
        waitingInbound.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(4),
      );
      const waitingInboundWeightKg = Number(
        waitingInbound.reduce((sum, g) => sum + Number(g.weightKg), 0).toFixed(2),
      );

      const usedVolumeM3 = Number(
        (storedVolumeM3 + receivingVolumeM3 + waitingInboundVolumeM3).toFixed(4),
      );
      const usedWeightKg = Number(
        (storedWeightKg + receivingWeightKg + waitingInboundWeightKg).toFixed(2),
      );

      const availableVolumeM3 = Math.max(0, Number((rentedVolumeM3 - usedVolumeM3).toFixed(4)));
      const availableWeightKg = Math.max(0, Number((rentedWeightKg - usedWeightKg).toFixed(2)));

      const volumeUtilizationPercent =
        rentedVolumeM3 > 0 ? Number(((usedVolumeM3 / rentedVolumeM3) * 100).toFixed(1)) : 0;
      const weightUtilizationPercent =
        rentedWeightKg > 0 ? Number(((usedWeightKg / rentedWeightKg) * 100).toFixed(1)) : 0;

      return {
        ...baseDto,
        customerRental: {
          rentedVolumeM3,
          rentedWeightKg,
          startDate: earliestStartDate.toISOString(),
          endDate: latestEndDate.toISOString(),
          durationMonths,
          status: rentalStatus,
          isExpired,
          storageType,
          monthlyFee: Math.round(monthlyFee),
          invoiceNumber: latestInvoiceNum,
        },
        customerUtilization: {
          storedVolumeM3,
          storedWeightKg,
          storedCount: stored.length,
          receivingVolumeM3,
          receivingWeightKg,
          receivingCount: receiving.length,
          waitingInboundVolumeM3,
          waitingInboundWeightKg,
          waitingInboundCount: waitingInbound.length,
          usedVolumeM3,
          usedWeightKg,
          availableVolumeM3,
          availableWeightKg,
          volumeUtilizationPercent,
          weightUtilizationPercent,
        },
      };
    });
  }

  /**
   * Warehouse Space Rental Booking (Self-Service Rental Booking)
   */
  async rentSpace(
    dto: RentWarehouseSpaceDto,
    currentUser: AuthenticatedUser,
  ): Promise<RentalBookingResult> {
    if (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only Customers or Admins are authorized to rent warehouse space',
      );
    }

    // 1. Validate warehouse facility existence
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        OR: [{ id: dto.warehouseId }, { code: dto.warehouseId }],
      },
      include: { zones: true },
    });

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse facility with ID or code '${dto.warehouseId}' not found`,
      );
    }

    // 2. Calculate rental fees (SSOT Calculation Engine)
    const ratePerM3 = this.STORAGE_RATES[dto.storageType] || DEFAULT_STORAGE_RATE_PER_M3;
    const monthlyFee = calculateMonthlyRentalFee(
      dto.volumeM3,
      ratePerM3,
      MINIMUM_MONTHLY_RENTAL_FEE,
    );
    const grandTotal = monthlyFee * dto.durationMonths;

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const billingMonth = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dueDate = new Date(
      startDate.getTime() + INVOICE_PAYMENT_GRACE_DAYS * 24 * 60 * 60 * 1000,
    ); // Dynamic grace period (SSOT)

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const storageTypeLabel =
      dto.storageType === StorageZoneType.COLD_STORAGE
        ? 'Cold Storage Sub-zero (-18°C)'
        : dto.storageType === StorageZoneType.HEAVY_DUTY
          ? 'Heavy Duty Storage Zone'
          : 'Standard Dry Storage (24°C)';

    // 3. Execute atomic transaction in PostgreSQL via Prisma Transaction
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
          description: `Warehouse Space Rental (${storageTypeLabel} - ${dto.volumeM3} m³ x ${dto.durationMonths} Months • ${warehouse.name})`,
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
          title: 'Warehouse Space Rental Booking Registered',
          message: `Warehouse space rental request of ${dto.volumeM3} m³ (${storageTypeLabel}) at ${warehouse.name} has been successfully recorded. Invoice #${invoiceNumber} has been issued.`,
          category: NotificationCategory.BILLING_DUE,
          relatedEntityId: invoice.id,
          relatedEntityType: RelatedEntityType.INVOICE,
          actionUrl: '/customer/billing',
        },
      });

      return invoice;
    });

    // Real-Time Event Dispatching
    this.eventsService.publish({
      type: DomainEventType.INVOICE_CREATED,
      payload: {
        invoiceId: result.id,
        invoiceNumber,
        customerId: currentUser.id,
        billingMonth,
        totalAmount: grandTotal,
        status: InvoiceStatus.UNPAID,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
      },
      targetCustomerId: currentUser.id,
      targetInvoiceId: result.id,
    });

    this.eventsService.publish({
      type: DomainEventType.RENTAL_CAPACITY_CHANGED,
      payload: {
        customerId: currentUser.id,
        warehouseId: warehouse.id,
        storageType: dto.storageType,
        volumeM3: dto.volumeM3,
      },
      targetCustomerId: currentUser.id,
      targetWarehouseId: warehouse.id,
    });

    this.eventsService.publish({
      type: DomainEventType.WAREHOUSE_CAPACITY_CHANGED,
      payload: {
        warehouseId: warehouse.id,
        customerId: currentUser.id,
      },
      targetWarehouseId: warehouse.id,
      targetCustomerId: currentUser.id,
    });

    this.eventsService.publish({
      type: DomainEventType.NOTIFICATION_CREATED,
      payload: {
        recipientUserId: currentUser.id,
        title: 'Warehouse Space Rental Booking Registered',
        actionUrl: '/customer/billing',
      },
      targetCustomerId: currentUser.id,
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
   * Pre-Inbound Warehouse Transfer / Change Rental Facility
   * Allows Customers who have rented/paid for space to switch warehouse locations
   * BEFORE goods are physically received at the warehouse (Pre-Inbound).
   */
  async changeRentalWarehouse(
    dto: ChangeRentalWarehouseDto,
    currentUser: AuthenticatedUser,
  ): Promise<{
    message: string;
    sourceWarehouse: { id: string; code: string; name: string };
    targetWarehouse: { id: string; code: string; name: string };
    transferredGoodsCount: number;
    updatedOrdersCount: number;
    priceAdjustment?: {
      type: 'PAYMENT_REQUIRED' | 'CREDIT_RECORDED' | 'NO_CHANGE';
      amount: number;
      invoiceNumber?: string;
    };
  }> {
    if (currentUser.role !== UserRole.CUSTOMER && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only Customers or Admins are authorized to change warehouse rental allocation',
      );
    }

    if (dto.sourceWarehouseId === dto.targetWarehouseId) {
      throw new BadRequestException(
        'Destination warehouse must be different from source warehouse',
      );
    }

    const [sourceWarehouse, targetWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { OR: [{ id: dto.sourceWarehouseId }, { code: dto.sourceWarehouseId }] },
      }),
      this.prisma.warehouse.findFirst({
        where: { OR: [{ id: dto.targetWarehouseId }, { code: dto.targetWarehouseId }] },
      }),
    ]);

    if (!sourceWarehouse || !targetWarehouse) {
      throw new NotFoundException('Source or destination warehouse facility not found');
    }

    if (!targetWarehouse.isActive) {
      throw new BadRequestException(
        `Destination warehouse facility '${targetWarehouse.name}' is currently inactive`,
      );
    }

    const targetCustomerId = currentUser.id;

    // 1. Fetch all goods belonging to the customer in the source warehouse
    const customerGoodsInSource = await this.prisma.goodsItem.findMany({
      where: {
        customerId: targetCustomerId,
        warehouseId: sourceWarehouse.id,
      },
    });

    // 2. Pre-Inbound rule check: have any goods entered warehouse operations?
    const operationalStatuses: GoodsStorageStatus[] = [
      GoodsStorageStatus.INSPECTING,
      GoodsStorageStatus.STORED,
      GoodsStorageStatus.PENDING_DELIVERY,
      GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
      GoodsStorageStatus.DELIVERED,
    ];

    const hasOperationalGoods = customerGoodsInSource.some((g) =>
      operationalStatuses.includes(g.status),
    );

    if (hasOperationalGoods) {
      throw new BadRequestException(
        'Warehouse transfer is unavailable because inventory has already entered warehouse operations. Please use Physical Inventory Transfer.',
      );
    }

    // 3. Find active rental invoices belonging to the customer referencing the source warehouse
    const rentalInvoices = await this.prisma.invoice.findMany({
      where: {
        customerId: targetCustomerId,
        status: { not: InvoiceStatus.CANCELLED },
        items: {
          some: {
            goodsName: {
              startsWith: `Rental Space: ${sourceWarehouse.code}`,
            },
          },
        },
      },
      include: { items: true },
    });

    if (rentalInvoices.length === 0 && customerGoodsInSource.length === 0) {
      throw new BadRequestException(
        `Customer has no active rental contract or registered goods at facility ${sourceWarehouse.name}`,
      );
    }

    // 4. Execute transfer in atomic database transaction
    return await this.prisma.$transaction(async (tx) => {
      // 4a. Update DRAFT and PENDING_PICKUP goods to new warehouse
      let transferredCount = 0;
      const draftOrPendingGoods = customerGoodsInSource.filter(
        (g) =>
          g.status === GoodsStorageStatus.DRAFT || g.status === GoodsStorageStatus.PENDING_PICKUP,
      );

      if (draftOrPendingGoods.length > 0) {
        await tx.goodsItem.updateMany({
          where: {
            id: { in: draftOrPendingGoods.map((g) => g.id) },
          },
          data: {
            warehouseId: targetWarehouse.id,
          },
        });
        transferredCount = draftOrPendingGoods.length;

        // Create GoodsMutation for audit trail
        for (const g of draftOrPendingGoods) {
          await tx.goodsMutation.create({
            data: {
              goodsId: g.id,
              status: g.status,
              title: 'Pre-Inbound Warehouse Reassignment',
              description: `Storage warehouse facility allocation transferred from ${sourceWarehouse.name} to ${targetWarehouse.name} prior to physical receiving.`,
              actorId: currentUser.id,
              actorName: currentUser.name,
              actorRole: currentUser.role,
              location: `${targetWarehouse.name} (${targetWarehouse.city})`,
              timestamp: new Date(),
            },
          });
        }
      }

      // 4b. Update Delivery Order Inbound (PICKUP) with status PENDING_ASSIGNMENT
      let updatedOrdersCount = 0;
      const pendingInboundOrders = await tx.deliveryOrder.findMany({
        where: {
          customerId: targetCustomerId,
          type: OrderType.PICKUP,
          status: OrderStatus.PENDING_ASSIGNMENT,
          orderItems: {
            some: {
              goodsId: { in: draftOrPendingGoods.map((g) => g.id) },
            },
          },
        },
      });

      for (const order of pendingInboundOrders) {
        await tx.deliveryOrder.update({
          where: { id: order.id },
          data: {
            destinationAddress: targetWarehouse.address,
            destinationCity: targetWarehouse.city,
          },
        });
        updatedOrdersCount++;
      }

      // 4c. Update Invoice Items to reflect new warehouse
      for (const inv of rentalInvoices) {
        for (const item of inv.items) {
          if (item.goodsName && item.goodsName.includes(sourceWarehouse.code)) {
            const updatedGoodsName = item.goodsName.replace(
              sourceWarehouse.code,
              targetWarehouse.code,
            );
            const updatedDesc = item.description.replace(
              sourceWarehouse.name,
              targetWarehouse.name,
            );
            await tx.invoiceItem.update({
              where: { id: item.id },
              data: {
                goodsName: updatedGoodsName,
                description: updatedDesc,
              },
            });
          }
        }
      }

      // 4d. Notify Customer
      await tx.systemNotification.create({
        data: {
          recipientUserId: targetCustomerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Warehouse Rental Facility Transferred Successfully',
          message: `Your warehouse rental facility and ${transferredCount} pre-inbound inventory items have been successfully transferred from ${sourceWarehouse.name} to ${targetWarehouse.name}.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: targetWarehouse.id,
          relatedEntityType: RelatedEntityType.WAREHOUSE,
          actionUrl: '/customer/rental',
        },
      });

      return {
        message: `Warehouse rental facility successfully transferred from ${sourceWarehouse.name} to ${targetWarehouse.name}`,
        sourceWarehouse: {
          id: sourceWarehouse.id,
          code: sourceWarehouse.code,
          name: sourceWarehouse.name,
        },
        targetWarehouse: {
          id: targetWarehouse.id,
          code: targetWarehouse.code,
          name: targetWarehouse.name,
        },
        transferredGoodsCount: transferredCount,
        updatedOrdersCount,
        priceAdjustment: {
          type: 'NO_CHANGE',
          amount: 0,
        },
      };
    });
  }

  /**
   * Internal helper to map Prisma Warehouse entity to WarehouseListItemDto with live accounting.
   */
  private mapToListItemDto(warehouse: WarehouseWithRelations): WarehouseListItemDto {
    const totalCap = Number(warehouse.totalCapacityM3);

    // Live calculated used capacity from active STORED goods
    const calculatedUsedCap = warehouse.goodsItems
      ? Number(warehouse.goodsItems.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2))
      : Number(warehouse.usedCapacityM3);

    const actualUsedCap =
      calculatedUsedCap > 0 ? calculatedUsedCap : Number(warehouse.usedCapacityM3);
    const occupancyPercent =
      totalCap > 0 ? Number(((actualUsedCap / totalCap) * 100).toFixed(1)) : 0;

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

  /**
   * Retrieves deep slot inspection details including multi-tenant inventory list and telemetry.
   */
  async getSlotInventory(slotId: string, warehouseId?: string): Promise<StorageSlotResponseDto> {
    const slot = await this.prisma.storageSlot.findFirst({
      where: {
        id: slotId,
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        goodsItems: {
          where: { status: GoodsStorageStatus.STORED },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                companyName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Storage slot with ID '${slotId}' not found`);
    }

    const activeStored = slot.goodsItems;
    const goodsIds = activeStored.map((g) => g.id);

    const {
      actualSlotUsedM3,
      availableM3,
      volPct,
      maxWeightKg,
      actualSlotUsedWeightKg,
      availableWeightKg,
      weightPct,
      capacityStatus,
      actualSlotStatus,
    } = calculateSlotMetrics(slot.capacityM3, activeStored, slot.usedM3, slot.status);

    const customerIds = new Set(activeStored.map((g) => g.customer.id));

    const storedGoods = activeStored.map((g) => {
      const unitVol =
        g.quantity > 0 ? Number((Number(g.volumeM3) / g.quantity).toFixed(6)) : Number(g.volumeM3);
      const unitWeight =
        g.quantity > 0 ? Number((Number(g.weightKg) / g.quantity).toFixed(2)) : Number(g.weightKg);

      return {
        id: g.id,
        barcode: g.barcode,
        name: g.name,
        category: g.category,
        quantity: g.quantity,
        unit: g.unit || 'Packages',
        dimensions: {
          lengthCm: Number(g.lengthCm || 0),
          widthCm: Number(g.widthCm || 0),
          heightCm: Number(g.heightCm || 0),
        },
        unitVolumeM3: unitVol,
        volumeM3: Number(g.volumeM3),
        unitWeightKg: unitWeight,
        weightKg: Number(g.weightKg),
        status: g.status,
        currentTemp: g.currentTemp ? Number(g.currentTemp) : null,
        customerId: g.customer?.id,
        customerName: g.customer?.name || 'Customer Tenant',
        customerCompany: g.customer?.companyName || null,
        customerEmail: g.customer?.email || null,
        customerPhone: g.customer?.phone || null,
        storageStartDate: g.storageStartDate ? g.storageStartDate.toISOString() : null,
        storageEndDate: g.storageEndDate ? g.storageEndDate.toISOString() : null,
      };
    });

    return {
      id: slot.id,
      warehouseId: slot.warehouseId,
      zoneId: slot.zoneId,
      code: slot.code,
      zone: slot.zone,
      capacityM3: Number(slot.capacityM3),
      usedM3: actualSlotUsedM3,

      availableM3,
      volumeUtilizationPercent: volPct,
      maxWeightKg,
      usedWeightKg: actualSlotUsedWeightKg,
      availableWeightKg,
      weightUtilizationPercent: weightPct,
      status: actualSlotStatus,
      capacityStatus,
      temperatureCelsius: slot.temperatureCelsius ? Number(slot.temperatureCelsius) : null,
      humidityPercent: slot.humidityPercent ? Number(slot.humidityPercent) : null,
      currentGoodsCount: goodsIds.length,
      customerCount: customerIds.size,
      totalPackagesCount: activeStored.reduce((sum, g) => sum + g.quantity, 0),
      currentGoodsIds: goodsIds,
      storedGoods,
    };
  }
}
