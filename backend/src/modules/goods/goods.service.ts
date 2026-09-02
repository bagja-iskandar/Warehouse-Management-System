import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GoodsCategory,
  GoodsStorageStatus,
  InvoiceStatus,
  NotificationCategory,
  OrderStatus,
  Prisma,
  RelatedEntityType,
  SlotStatus,
  StorageZoneType,
  UserRole,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { GoodsQueryDto } from './dto/goods-query.dto';
import { GoodsDetailResponseDto, GoodsListItemDto } from './dto/goods-response.dto';
import { TransferGoodsSlotDto } from './dto/transfer-goods-slot.dto';
import { UpdateGoodsStatusDto } from './dto/update-goods-status.dto';

import {
  MASTER_STORAGE_RATES,
  MINIMUM_MONTHLY_RENTAL_FEE,
} from '../../common/constants/pricing.constants';
import {
  calculateVolumeM3,
  calculateTotalVolumeM3,
  calculateMonthlyRentalFee,
} from '../../common/utils/calculation.util';
import {
  ALLOWED_GOODS_TRANSITIONS,
  validateGoodsRolePermissionOnTransition,
} from './utils/goods-state-machine.util';
import {
  getGoodsCategoryPrefix,
  getGoodsMutationAuditInfo,
  mapToGoodsListItemDto,
  mapToGoodsDetailDto,
} from './utils/goods-mapper.util';

export interface PaginatedGoodsResult {
  items: GoodsListItemDto[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class GoodsService {
  private readonly logger = new Logger(GoodsService.name);

  // Master tarif sewa bulanan per m3 (IDR) from SSOT constants
  private readonly STANDARD_RATE_PER_M3 = MASTER_STORAGE_RATES[StorageZoneType.STANDARD];
  private readonly COLD_STORAGE_RATE_PER_M3 = MASTER_STORAGE_RATES[StorageZoneType.COLD_STORAGE];
  private readonly HEAVY_DUTY_RATE_PER_M3 = MASTER_STORAGE_RATES[StorageZoneType.HEAVY_DUTY];
  private readonly MINIMUM_MONTHLY_FEE = MINIMUM_MONTHLY_RENTAL_FEE;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Pendaftaran master barang (SKU) baru dengan kalkulasi volume otomatis server-side,
   * penentuan tarif sewa bulanan, dan penjanaan kode barcode/QR unik dalam transaksi atomik.
   */
  async create(
    dto: CreateGoodsDto,
    currentUser: AuthenticatedUser,
  ): Promise<GoodsDetailResponseDto> {
    // 0. Enforce Demo Portfolio Limit (Maximum 10 Goods)
    const MAX_DEMO_GOODS_LIMIT = 10;
    const currentGoodsCount = await this.prisma.goodsItem.count();
    if (currentGoodsCount >= MAX_DEMO_GOODS_LIMIT) {
      throw new BadRequestException(
        `Demo limit reached. Maximum ${MAX_DEMO_GOODS_LIMIT} goods items are allowed in this demo environment.`,
      );
    }

    // 1. Tentukan pemilik barang (Customer ID) berdasarkan hak akses peran
    let targetCustomerId: string;
    if (currentUser.role === UserRole.CUSTOMER) {
      targetCustomerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      targetCustomerId = dto.customerId || currentUser.id;
    } else {
      throw new ForbiddenException(
        'Only Customers or Admins are authorized to register new inventory',
      );
    }

    // 2. Validate Customer and Warehouse Facility Existence
    const [customer, warehouse] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetCustomerId },
        select: { id: true, name: true, companyName: true, email: true, phone: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { OR: [{ id: dto.warehouseId }, { code: dto.warehouseId }] },
        select: { id: true, code: true, name: true, city: true, isActive: true, zones: true },
      }),
    ]);

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${targetCustomerId}' not found`);
    }

    if (!warehouse || !warehouse.isActive) {
      throw new NotFoundException(
        `Warehouse facility with ID or code '${dto.warehouseId}' not found or is currently inactive`,
      );
    }

    // 3. Server-Side Volume and Weight Calculation
    const volumePerItemM3 = calculateVolumeM3(dto.lengthCm, dto.widthCm, dto.heightCm);
    const totalVolumeM3 = calculateTotalVolumeM3(volumePerItemM3, dto.quantity);
    const requestedWeightKg = Number(dto.weightKg);

    // 4. Monthly Rental Fee Calculation
    const isCold = Boolean(dto.requiresColdStorage || dto.category === GoodsCategory.COLD_FOOD);
    const ratePerM3 = isCold ? this.COLD_STORAGE_RATE_PER_M3 : this.STANDARD_RATE_PER_M3;
    const monthlyRentalFee = calculateMonthlyRentalFee(
      totalVolumeM3,
      ratePerM3,
      this.MINIMUM_MONTHLY_FEE,
    );

    // 5. Generate Barcode & QR Code
    const categoryCode = getGoodsCategoryPrefix(dto.category);
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();

    const barcode = `BRG-2026-${categoryCode}-${randomSuffix}`;
    const initialStatus = dto.pickupRequired
      ? GoodsStorageStatus.PENDING_PICKUP
      : GoodsStorageStatus.DRAFT;

    const startDate = new Date();

    // 6. Execute Capacity Verification, Registration & Initial Mutation in Atomic Transaction
    const createdGoods = await this.prisma.$transaction(async (tx) => {
      // 6-lock: Explicit row-level lock on Customer to serialize concurrent registration requests
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${targetCustomerId} FOR UPDATE`;

      // 6a. Query Customer's Rental Agreements for this Warehouse
      const rentalInvoices = await tx.invoice.findMany({
        where: {
          customerId: targetCustomerId,
          status: { not: InvoiceStatus.CANCELLED },
          items: {
            some: {
              OR: [
                { goodsName: { contains: warehouse.code } },
                { description: { contains: warehouse.name } },
                { description: { contains: warehouse.code } },
              ],
            },
          },
        },
        include: { items: true },
        orderBy: { issueDate: 'desc' },
      });

      let totalRentedVolumeM3 = 0;
      let latestEndDate: Date | null = null;
      let storageType: StorageZoneType | null = null;

      for (const inv of rentalInvoices) {
        for (const it of inv.items || []) {
          if (
            it.goodsName?.includes(warehouse.code) ||
            it.description?.includes(warehouse.name) ||
            it.description?.includes(warehouse.code)
          ) {
            totalRentedVolumeM3 += Number(it.volumeM3);

            if (!storageType) {
              if (it.goodsName?.includes('STANDARD') || it.description?.includes('Standard')) {
                storageType = StorageZoneType.STANDARD;
              } else if (
                it.goodsName?.includes('HEAVY_DUTY') ||
                it.description?.includes('Heavy')
              ) {
                storageType = StorageZoneType.HEAVY_DUTY;
              } else if (
                it.goodsName?.includes('COLD_STORAGE') ||
                it.description?.includes('Cold')
              ) {
                storageType = StorageZoneType.COLD_STORAGE;
              }
            }

            let durationMonths = 12;
            const durationMatch = it.description?.match(/(\d+)\s*Months?/i);
            if (durationMatch) {
              durationMonths = parseInt(durationMatch[1], 10);
            }

            const itemEndDate = new Date(
              new Date(inv.issueDate).getTime() + durationMonths * 30.4375 * 24 * 60 * 60 * 1000,
            );
            if (!latestEndDate || itemEndDate > latestEndDate) {
              latestEndDate = itemEndDate;
            }
          }
        }
      }

      // Check if customer has an existing legacy allocation or require booking
      if (totalRentedVolumeM3 === 0) {
        const existingGoodsCount = await tx.goodsItem.count({
          where: { customerId: targetCustomerId, warehouseId: warehouse.id },
        });
        if (currentUser.role === UserRole.CUSTOMER && existingGoodsCount === 0) {
          throw new BadRequestException(
            'You do not have active storage space in this warehouse facility. Please book warehouse space rental first.',
          );
        }
        // Fallback default allocation for legacy records
        totalRentedVolumeM3 = 50.0;
        latestEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }

      // Determine fallback storage capability if not explicit in invoice
      if (!storageType) {
        const hasColdZone = warehouse.zones
          ? warehouse.zones.some((z) => z.type === StorageZoneType.COLD_STORAGE)
          : false;
        const hasStdZone = warehouse.zones
          ? warehouse.zones.some((z) => z.type === StorageZoneType.STANDARD)
          : false;
        if (warehouse.name.toLowerCase().includes('cold') || (hasColdZone && !hasStdZone)) {
          storageType = StorageZoneType.COLD_STORAGE;
        } else {
          storageType = StorageZoneType.STANDARD;
        }
      }

      // 6-storage: Validate Goods Storage Condition vs Warehouse Capability
      const isGoodsCold = Boolean(
        dto.requiresColdStorage || dto.category === GoodsCategory.COLD_FOOD,
      );

      if (storageType === StorageZoneType.COLD_STORAGE) {
        if (!isGoodsCold) {
          throw new BadRequestException(
            `Storage condition mismatch: Selected warehouse rental at '${warehouse.name}' is a Cold Storage facility (-18°C Sub-zero) and only accepts cold storage cargo. Ambient / Standard Dry goods cannot be registered to this facility.`,
          );
        }
      } else {
        if (isGoodsCold) {
          throw new BadRequestException(
            `Storage condition mismatch: Selected warehouse rental at '${warehouse.name}' is a Standard Ambient facility and does not support sub-zero Cold Storage cargo.`,
          );
        }
      }

      // 6b. Check Rental Expiration
      const now = new Date();
      if (latestEndDate && now.getTime() > latestEndDate.getTime()) {
        throw new BadRequestException(
          'Your warehouse space rental agreement has expired. Please renew your rental space before registering new inventory.',
        );
      }

      // 6c. Check Occupied Volume & Weight from Active Inventory (Excluding CANCELLED & DELIVERED)
      const activeGoods = await tx.goodsItem.findMany({
        where: {
          customerId: targetCustomerId,
          warehouseId: warehouse.id,
          status: {
            notIn: [GoodsStorageStatus.CANCELLED, GoodsStorageStatus.DELIVERED],
          },
        },
        select: { volumeM3: true, weightKg: true },
      });

      const currentOccupiedVolume = Number(
        activeGoods.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(4),
      );
      const currentOccupiedWeight = Number(
        activeGoods.reduce((sum, g) => sum + Number(g.weightKg), 0).toFixed(2),
      );

      const totalRentedWeightKg = Number((totalRentedVolumeM3 * 100).toFixed(2));
      const remainingVolume = Number((totalRentedVolumeM3 - currentOccupiedVolume).toFixed(4));
      const remainingWeight = Number((totalRentedWeightKg - currentOccupiedWeight).toFixed(2));

      // 6d. Validate Volume Capacity Limit
      if (currentOccupiedVolume + totalVolumeM3 > totalRentedVolumeM3 + 0.0001) {
        throw new BadRequestException(
          `Warehouse rental volume capacity exceeded. Total rented: ${totalRentedVolumeM3.toFixed(2)} m³, currently used: ${currentOccupiedVolume.toFixed(2)} m³, remaining: ${Math.max(0, remainingVolume).toFixed(2)} m³, requested: ${totalVolumeM3.toFixed(2)} m³. Please reduce package quantity or upgrade your warehouse rental space.`,
        );
      }

      // 6e. Validate Weight Capacity Limit
      if (currentOccupiedWeight + requestedWeightKg > totalRentedWeightKg + 0.01) {
        throw new BadRequestException(
          `Warehouse rental weight capacity exceeded. Total rented: ${totalRentedWeightKg.toFixed(2)} kg, currently used: ${currentOccupiedWeight.toFixed(2)} kg, remaining: ${Math.max(0, remainingWeight).toFixed(2)} kg, requested: ${requestedWeightKg.toFixed(2)} kg. Please reduce package quantity or upgrade your warehouse rental space.`,
        );
      }

      // 6f. Create Goods Item
      const goods = await tx.goodsItem.create({
        data: {
          barcode,
          customerId: targetCustomerId,
          warehouseId: warehouse.id,
          name: dto.name,
          category: dto.category,
          description: dto.description,
          lengthCm: dto.lengthCm,
          widthCm: dto.widthCm,
          heightCm: dto.heightCm,
          volumeM3: totalVolumeM3,
          weightKg: requestedWeightKg,
          quantity: dto.quantity,
          unit: dto.unit,
          requiresColdStorage: isCold,
          targetTempMin: dto.targetTempMin || (isCold ? -22.0 : null),
          targetTempMax: dto.targetTempMax || (isCold ? -18.0 : null),
          currentTemp: isCold ? -19.4 : null,
          storageStartDate: startDate,
          monthlyRentalFee,
          status: initialStatus,
          imageUrl: dto.imageUrl || null,
          qrCodeData: `WMS://ITEM/${barcode}?wh=${warehouse.code}`,
        },
      });

      // Record initial audit mutation
      await tx.goodsMutation.create({
        data: {
          goodsId: goods.id,
          status: initialStatus,
          title: dto.pickupRequired ? 'Pickup Request Submitted' : 'New Goods Registered (Draft)',
          description: dto.pickupRequired
            ? `Customer registered inventory and requested WMS fleet pickup to: ${dto.pickupAddress || 'Customer profile address'}.`
            : `Goods successfully registered in WMS Nusantara with Draft status.`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          location: dto.pickupAddress || warehouse.name,
          timestamp: startDate,
        },
      });

      // 7. Emit Transactional Notifications to Customer and Admins
      await this.notificationsService.createNotification(
        {
          recipientUserId: targetCustomerId,
          recipientRole: UserRole.CUSTOMER,
          title: dto.pickupRequired ? 'Pickup Request Submitted' : 'Goods Registered Successfully',
          message: `Goods "${goods.name}" (SKU: ${goods.barcode}) with quantity ${goods.quantity} ${goods.unit} registered successfully.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/customer/goods',
        },
        tx,
      );

      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: dto.pickupRequired ? 'New Pickup Request' : 'New Goods Registration',
          message: `Tenant "${customer.name}" registered goods "${goods.name}" (${goods.quantity} ${goods.unit}) at ${warehouse.name}.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/admin/goods',
        },
        tx,
      );

      return goods;
    });

    return this.findById(createdGoods.id, currentUser);
  }

  /**
   * Recalculates and updates the real-time occupied volume and status for a specific storage slot
   * based on all active STORED goods currently residing in that slot.
   */
  async recalculateSlotCapacity(slotId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const db = tx || this.prisma;
    const slot = await db.storageSlot.findUnique({
      where: { id: slotId },
      include: {
        goodsItems: {
          where: { status: GoodsStorageStatus.STORED },
          select: { volumeM3: true },
        },
      },
    });

    if (!slot) return 0;

    const actualUsedM3 = Number(
      slot.goodsItems.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2),
    );

    let nextStatus: SlotStatus = SlotStatus.AVAILABLE;

    if (slot.status === SlotStatus.MAINTENANCE) {
      nextStatus = SlotStatus.MAINTENANCE;
    } else if (actualUsedM3 === 0) {
      nextStatus = SlotStatus.AVAILABLE;
    } else {
      nextStatus = SlotStatus.OCCUPIED;
    }

    await db.storageSlot.update({
      where: { id: slotId },
      data: {
        usedM3: actualUsedM3,
        status: nextStatus,
      },
    });

    return actualUsedM3;
  }

  /**
   * Recalculates and updates the real-time used capacity for a warehouse facility
   * based on all active STORED goods currently placed in that warehouse.
   */
  async recalculateWarehouseCapacity(
    warehouseId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = tx || this.prisma;
    const storedGoods = await db.goodsItem.findMany({
      where: {
        warehouseId,
        status: GoodsStorageStatus.STORED,
      },
      select: { volumeM3: true },
    });

    const actualWarehouseUsedM3 = Number(
      storedGoods.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2),
    );

    await db.warehouse.update({
      where: { id: warehouseId },
      data: {
        usedCapacityM3: actualWarehouseUsedM3,
      },
    });

    return actualWarehouseUsedM3;
  }

  /**
   * Reconciles all storage slots and warehouses against currently stored goods in PostgreSQL.
   */
  async reconcileAllCapacity(
    tx?: Prisma.TransactionClient,
  ): Promise<{ slotsUpdated: number; warehousesUpdated: number }> {
    const db = tx || this.prisma;
    const allSlots = await db.storageSlot.findMany({ select: { id: true } });
    for (const s of allSlots) {
      await this.recalculateSlotCapacity(s.id, db);
    }

    const allWarehouses = await db.warehouse.findMany({ select: { id: true } });
    for (const w of allWarehouses) {
      await this.recalculateWarehouseCapacity(w.id, db);
    }

    return { slotsUpdated: allSlots.length, warehousesUpdated: allWarehouses.length };
  }

  /**
   * Transisi status barang terkontrol (State Machine) dengan alokasi slot rak,
   * pembaruan utilisasi kapasitas gudang, dan pencatatan jejak audit mutasi atomik.
   */
  async updateStatus(
    id: string,
    dto: UpdateGoodsStatusDto,
    currentUser: AuthenticatedUser,
  ): Promise<GoodsDetailResponseDto> {
    // 1. Ambil data barang saat ini
    const goods = await this.prisma.goodsItem.findFirst({
      where: {
        OR: [{ id }, { barcode: id }],
      },
      include: {
        warehouse: true,
        slot: true,
      },
    });

    if (!goods) {
      throw new NotFoundException(`Goods with ID or barcode '${id}' not found`);
    }

    // 2. Anti-IDOR Enforcement
    if (currentUser.role === UserRole.CUSTOMER && goods.customerId !== currentUser.id) {
      throw new NotFoundException(`Goods with ID or barcode '${id}' not found`);
    }

    const currentStatus = goods.status;
    const newStatus = dto.status;
    const oldSlotId = goods.slotId;

    // 3. RBAC / Authorization Check
    validateGoodsRolePermissionOnTransition(currentUser.role, newStatus);

    // 4. State Machine Validation
    const allowedNextStatuses = ALLOWED_GOODS_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Status transition from '${currentStatus}' to '${newStatus}' is not allowed in WMS state machine.`,
      );
    }

    // 5. Execute State Transition, Slot Allocation & Audit Mutation in Atomic Transaction
    await this.prisma.$transaction(async (tx) => {
      let targetSlotId = goods.slotId;

      // Case A: Transition to STORED -> Rack Slot Allocation & Capacity Validation
      if (newStatus === GoodsStorageStatus.STORED) {
        if (
          currentStatus !== GoodsStorageStatus.INSPECTING &&
          currentStatus !== GoodsStorageStatus.STORED
        ) {
          throw new BadRequestException(
            `Put-Away rejected. Goods must be in 'INSPECTING' status (physically verified at receiving dock) before rack slot allocation. Current status: '${currentStatus}'.`,
          );
        }

        targetSlotId = dto.slotId || goods.slotId;
        if (!targetSlotId) {
          throw new BadRequestException(
            'Rack slot ID (slotId) is required when transitioning status to STORED',
          );
        }

        const slot = await tx.storageSlot.findUnique({
          where: { id: targetSlotId },
        });

        if (!slot) {
          throw new NotFoundException(`Rack slot with ID '${targetSlotId}' not found`);
        }

        if (slot.warehouseId !== goods.warehouseId) {
          throw new BadRequestException(
            'The selected rack slot is not located in the same warehouse facility as the goods',
          );
        }

        if (slot.status === SlotStatus.MAINTENANCE) {
          throw new BadRequestException(`Rack slot '${slot.code}' is currently under MAINTENANCE`);
        }

        if (goods.requiresColdStorage && slot.zone !== StorageZoneType.COLD_STORAGE) {
          throw new BadRequestException(
            `Goods require Cold Storage facility, but slot '${slot.code}' is located in '${slot.zone}' zone`,
          );
        }

        // Aggregate actual stored occupancy (Volume and Weight) from database
        const existingStoredInSlot = await tx.goodsItem.aggregate({
          where: {
            slotId: targetSlotId,
            status: GoodsStorageStatus.STORED,
            id: { not: goods.id },
          },
          _sum: { volumeM3: true, weightKg: true },
        });

        const currentSlotUsedM3 = Number(existingStoredInSlot._sum.volumeM3 || 0);
        const currentSlotUsedWeightKg = Number(existingStoredInSlot._sum.weightKg || 0);
        const slotCapacityM3 = Number(slot.capacityM3);
        const slotMaxWeightKg = slotCapacityM3 * 50; // Standard industrial rack rating: 50 kg/m3

        const goodsVol = Number(goods.volumeM3);
        const goodsWeight = Number(goods.weightKg);

        const availableM3 = Math.max(0, Number((slotCapacityM3 - currentSlotUsedM3).toFixed(2)));
        const availableWeightKg = Math.max(
          0,
          Number((slotMaxWeightKg - currentSlotUsedWeightKg).toFixed(1)),
        );

        // 1. Validate Volume Constraint
        if (goodsVol > availableM3) {
          const excessVol = (goodsVol - availableM3).toFixed(2);
          throw new BadRequestException(
            `Cannot put away this inventory. Rack volume capacity would be exceeded by ${excessVol} m³. Slot '${slot.code}' only has ${availableM3} m³ available, while this goods requires ${goodsVol} m³.`,
          );
        }

        // 2. Validate Weight Constraint
        if (goodsWeight > availableWeightKg) {
          const excessWeight = (goodsWeight - availableWeightKg).toFixed(1);
          throw new BadRequestException(
            `Cannot put away this inventory. Rack weight capacity would be exceeded by ${excessWeight} kg. Slot '${slot.code}' only has ${availableWeightKg} kg load capacity available, while this goods weighs ${goodsWeight} kg.`,
          );
        }

        // Update goods data to STORED
        await tx.goodsItem.update({
          where: { id: goods.id },
          data: {
            status: newStatus,
            slotId: targetSlotId,
          },
        });

        // Recalculate target slot & old slot capacity dynamically
        await this.recalculateSlotCapacity(targetSlotId, tx);
        if (oldSlotId && oldSlotId !== targetSlotId) {
          await this.recalculateSlotCapacity(oldSlotId, tx);
        }

        // Recalculate warehouse capacity dynamically
        await this.recalculateWarehouseCapacity(goods.warehouseId, tx);
      } else {
        // Case B: Transition to non-STORED status
        const finalSlotId =
          newStatus === GoodsStorageStatus.DELIVERED || newStatus === GoodsStorageStatus.CANCELLED
            ? null
            : targetSlotId;

        await tx.goodsItem.update({
          where: { id: goods.id },
          data: {
            status: newStatus,
            slotId: finalSlotId,
          },
        });

        // Free source slot capacity if applicable
        if (oldSlotId) {
          await this.recalculateSlotCapacity(oldSlotId, tx);
        }

        // Recalculate warehouse capacity dynamically
        await this.recalculateWarehouseCapacity(goods.warehouseId, tx);
      }

      // Fetch slot details for audit logging
      let allocatedSlotCode = '';
      let allocatedSlotZone = '';
      if (targetSlotId) {
        const slotRecord = await tx.storageSlot.findUnique({
          where: { id: targetSlotId },
          select: { code: true, zone: true },
        });
        if (slotRecord) {
          allocatedSlotCode = slotRecord.code;
          allocatedSlotZone = slotRecord.zone;
        }
      }

      // Record audit mutation
      let mutationTitle = `Status Updated: ${newStatus}`;
      let mutationDesc = dto.note || `Goods status transitioned to ${newStatus}.`;
      let mutationLocation = dto.location || goods.warehouse.name;

      if (newStatus === GoodsStorageStatus.STORED) {
        mutationTitle = 'Goods Stored in Rack Slot (Put-Away)';
        mutationDesc =
          dto.note ||
          `Goods placed in rack slot ${allocatedSlotCode} (${allocatedSlotZone}) by Admin (${currentUser.name}). Operational temperature verified.`;
        mutationLocation = `${goods.warehouse.name} — ${allocatedSlotZone} / Slot ${allocatedSlotCode}`;
      } else {
        const auditInfo = getGoodsMutationAuditInfo(newStatus, dto.note);
        mutationTitle = auditInfo.title;
        mutationDesc = auditInfo.description;
      }

      await tx.goodsMutation.create({
        data: {
          goodsId: goods.id,
          status: newStatus,
          title: mutationTitle,
          description: mutationDesc,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          location: mutationLocation,
          timestamp: new Date(),
        },
      });

      // Notification to Customer Owner
      const custNotifTitle =
        newStatus === GoodsStorageStatus.STORED
          ? 'Goods Stored in Warehouse Rack'
          : `Goods Status: ${newStatus}`;
      const custNotifMsg =
        newStatus === GoodsStorageStatus.STORED
          ? `Goods "${goods.name}" (${goods.barcode}) placed in rack slot ${allocatedSlotCode} (${allocatedSlotZone}) at ${goods.warehouse.name}.`
          : `Storage status for "${goods.name}" (${goods.barcode}) updated to ${newStatus}.`;

      await this.notificationsService.createNotification(
        {
          recipientUserId: goods.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: custNotifTitle,
          message: custNotifMsg,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/customer/goods',
        },
        tx,
      );

      // If Put-Away, notify all Admins
      if (newStatus === GoodsStorageStatus.STORED) {
        await this.notificationsService.notifyRole(
          UserRole.ADMIN,
          {
            title: 'Put-Away Completed',
            message: `Goods "${goods.name}" placed in rack slot ${allocatedSlotCode} (${goods.warehouse.name}).`,
            category: NotificationCategory.GOODS_STORED,
            relatedEntityId: goods.id,
            relatedEntityType: RelatedEntityType.GOODS,
            actionUrl: '/admin/goods',
          },
          tx,
        );

        // Periksa apakah barang ini terkait dengan Delivery Order Inbound (PICKUP)
        // yang berstatus DELIVERED -> Jika semua barang dalam order tersebut sudah STORED, ubah order menjadi CONFIRMED
        const relatedInboundOrders = await tx.deliveryOrder.findMany({
          where: {
            type: 'PICKUP',
            status: OrderStatus.DELIVERED,
            orderItems: {
              some: { goodsId: goods.id },
            },
          },
          include: {
            orderItems: {
              include: { goods: true },
            },
          },
        });

        for (const inbOrder of relatedInboundOrders) {
          const isAllItemsStored = inbOrder.orderItems.every(
            (oi) => oi.goodsId === goods.id || oi.goods.status === GoodsStorageStatus.STORED,
          );
          if (isAllItemsStored) {
            await tx.deliveryOrder.update({
              where: { id: inbOrder.id },
              data: {
                status: OrderStatus.CONFIRMED,
                confirmedAt: new Date(),
              },
            });
          }
        }
      }
    });

    return this.findById(goods.id, currentUser);
  }

  /**
   * Pemindahan barang antar slot rak penyimpanan dalam fasilitas gudang yang sama (Rack Transfer / Goods Movement).
   * Memvalidasi status barang (harus STORED), kompatibilitas zona suhu, kapasitas sisa slot tujuan,
   * serta memperbarui kapasitas rak secara atomik dan mencatat jejak riwayat mutasi presisi.
   */
  async transferSlot(
    id: string,
    dto: TransferGoodsSlotDto,
    currentUser: AuthenticatedUser,
  ): Promise<GoodsDetailResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to perform rack slot transfers');
    }

    // 1. Fetch current goods record
    const goods = await this.prisma.goodsItem.findFirst({
      where: { OR: [{ id }, { barcode: id }] },
      include: {
        warehouse: true,
        slot: true,
      },
    });

    if (!goods) {
      throw new NotFoundException(`Goods with ID or barcode '${id}' not found`);
    }

    if (goods.status !== GoodsStorageStatus.STORED || !goods.slotId) {
      throw new BadRequestException(
        `Goods can only be transferred between rack slots if in STORED status (Current status: ${goods.status})`,
      );
    }

    if (goods.slotId === dto.targetSlotId) {
      throw new BadRequestException('Destination slot is the same as the current storage slot.');
    }

    const sourceSlot = goods.slot;
    if (!sourceSlot) {
      throw new BadRequestException('Source storage slot record is invalid.');
    }

    // 2. Validate target slot
    const targetSlot = await this.prisma.storageSlot.findUnique({
      where: { id: dto.targetSlotId },
    });

    if (!targetSlot) {
      throw new NotFoundException(`Target rack slot with ID '${dto.targetSlotId}' not found.`);
    }

    if (targetSlot.warehouseId !== goods.warehouseId) {
      throw new BadRequestException(
        'Target rack slot must be in the same warehouse facility as the goods.',
      );
    }

    if (targetSlot.status === SlotStatus.MAINTENANCE) {
      throw new BadRequestException(
        `Target rack slot '${targetSlot.code}' is currently under MAINTENANCE.`,
      );
    }

    if (goods.requiresColdStorage && targetSlot.zone !== StorageZoneType.COLD_STORAGE) {
      throw new BadRequestException(
        `Goods require Cold Storage facility, but target slot '${targetSlot.code}' is located in '${targetSlot.zone}' zone.`,
      );
    }

    // Calculate real target slot occupancy (Volume and Weight) from database
    const existingTargetStored = await this.prisma.goodsItem.aggregate({
      where: {
        slotId: targetSlot.id,
        status: GoodsStorageStatus.STORED,
        id: { not: goods.id },
      },
      _sum: { volumeM3: true, weightKg: true },
    });

    const targetSlotUsedM3 = Number(existingTargetStored._sum.volumeM3 || 0);
    const targetSlotUsedWeightKg = Number(existingTargetStored._sum.weightKg || 0);
    const targetSlotCapM3 = Number(targetSlot.capacityM3);
    const targetSlotMaxWeightKg = targetSlotCapM3 * 50;

    const goodsVol = Number(goods.volumeM3);
    const goodsWeight = Number(goods.weightKg);

    const targetAvailVolM3 = Math.max(0, Number((targetSlotCapM3 - targetSlotUsedM3).toFixed(2)));
    const targetAvailWeightKg = Math.max(
      0,
      Number((targetSlotMaxWeightKg - targetSlotUsedWeightKg).toFixed(1)),
    );

    // 1. Validate Target Volume Constraint
    if (goodsVol > targetAvailVolM3) {
      const excessVol = (goodsVol - targetAvailVolM3).toFixed(2);
      throw new BadRequestException(
        `Cannot transfer this goods. Target rack volume capacity would be exceeded by ${excessVol} m³. Slot '${targetSlot.code}' only has ${targetAvailVolM3} m³ available, while this goods requires ${goodsVol} m³.`,
      );
    }

    // 2. Validate Target Weight Constraint
    if (goodsWeight > targetAvailWeightKg) {
      const excessWeight = (goodsWeight - targetAvailWeightKg).toFixed(1);
      throw new BadRequestException(
        `Cannot transfer this goods. Target rack weight capacity would be exceeded by ${excessWeight} kg. Slot '${targetSlot.code}' only has ${targetAvailWeightKg} kg load capacity available, while this goods weighs ${goodsWeight} kg.`,
      );
    }

    // 3. Execute transfer in atomic database transaction
    await this.prisma.$transaction(async (tx) => {
      // Update slot ID of goods
      await tx.goodsItem.update({
        where: { id: goods.id },
        data: {
          slotId: targetSlot.id,
        },
      });

      // Recalculate source slot capacity and status
      await this.recalculateSlotCapacity(sourceSlot.id, tx);

      // Recalculate target slot capacity and status
      await this.recalculateSlotCapacity(targetSlot.id, tx);

      // Recalculate warehouse capacity
      await this.recalculateWarehouseCapacity(goods.warehouseId, tx);

      // Record transfer mutation
      const mutationTitle = 'Rack Slot Transfer';
      const mutationDesc = dto.note
        ? `${dto.note} (Reason: ${dto.reason} • From Slot ${sourceSlot.code} to Slot ${targetSlot.code})`
        : `Goods successfully transferred from slot ${sourceSlot.code} (${sourceSlot.zone}) to slot ${targetSlot.code} (${targetSlot.zone}) by Admin (${currentUser.name}). Reason: ${dto.reason}.`;
      const mutationLocation = `${goods.warehouse.name} — ${targetSlot.zone} / Slot ${targetSlot.code}`;

      await tx.goodsMutation.create({
        data: {
          goodsId: goods.id,
          status: GoodsStorageStatus.STORED,
          title: mutationTitle,
          description: mutationDesc,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          location: mutationLocation,
          timestamp: new Date(),
        },
      });

      // Notification to Customer
      await this.notificationsService.createNotification(
        {
          recipientUserId: goods.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Rack Slot Transfer Completed',
          message: `Goods "${goods.name}" (${goods.barcode}) transferred from slot ${sourceSlot.code} to slot ${targetSlot.code} (${targetSlot.zone}) at ${goods.warehouse.name}.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/customer/goods',
        },
        tx,
      );

      // Notification to Admins
      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'Rack Slot Transfer Succeeded',
          message: `Admin ${currentUser.name} transferred goods "${goods.name}" (${goods.barcode}) to slot ${targetSlot.code}.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/admin/warehouse/capacity',
        },
        tx,
      );
    });

    return this.findById(goods.id, currentUser);
  }

  /**
   * Mengambil daftar barang (SKU) dengan paginasi, pencarian, dan filtering di level database,
   * dilengkapi isolasi data ketat (Multi-Tenant Data Isolation).
   */
  async findAll(
    query: GoodsQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedGoodsResult> {
    const where: Prisma.GoodsItemWhereInput = {};

    // 1. Penegakan Isolasi Data Berdasarkan Peran (RBAC & Tenant Isolation)
    if (currentUser.role === UserRole.CUSTOMER) {
      where.customerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      if (query.customerId) {
        where.customerId = query.customerId;
      }
    }

    // 2. Filter Kategori
    if (query.category) {
      where.category = query.category;
    }

    // 3. Filter Status Penyimpanan
    if (query.status) {
      where.status = query.status;
    }

    // 4. Filter Fasilitas Gudang
    if (query.warehouseId) {
      where.warehouseId = query.warehouseId;
    }

    // 5. Filter Kebutuhan Cold Storage
    if (query.requiresColdStorage !== undefined) {
      where.requiresColdStorage = query.requiresColdStorage;
    }

    // 6. Pencarian Keyword (Nama Barang atau Barcode/SKU)
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 7. Paginasi & Pengurutan
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.GoodsItemOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder },
      ...(sortBy !== 'createdAt' ? [{ createdAt: 'desc' as const }] : []),
    ];

    // Eksekusi count dan findMany secara paralel dalam database
    const [totalItems, goodsItems] = await Promise.all([
      this.prisma.goodsItem.count({ where }),
      this.prisma.goodsItem.findMany({
        where,
        skip,
        take,
        orderBy,
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
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
              city: true,
            },
          },
          slot: {
            select: {
              id: true,
              code: true,
              zone: true,
              temperatureCelsius: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const items = goodsItems.map((item) => mapToGoodsListItemDto(item));

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Mengambil detail lengkap barang berdasarkan ID atau Barcode, termasuk relasi gudang, slot, dan histori mutasi.
   */
  async findById(id: string, currentUser: AuthenticatedUser): Promise<GoodsDetailResponseDto> {
    const goods = await this.prisma.goodsItem.findFirst({
      where: {
        OR: [{ id }, { barcode: id }],
      },
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
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
          },
        },
        slot: {
          select: {
            id: true,
            code: true,
            zone: true,
            temperatureCelsius: true,
            status: true,
          },
        },
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!goods) {
      throw new NotFoundException(`Goods with ID or barcode '${id}' not found`);
    }

    // Anti-IDOR: Customer can only access their own inventory
    if (currentUser.role === UserRole.CUSTOMER && goods.customerId !== currentUser.id) {
      throw new NotFoundException(`Goods with ID or barcode '${id}' not found`);
    }

    return mapToGoodsDetailDto(goods);
  }

  /**
   * Mengambil riwayat mutasi / log histori kargo barang milik tenant customer yang sedang login.
   */
  async findMutations(currentUser: AuthenticatedUser, customerId?: string) {
    if (currentUser.role === UserRole.DRIVER) {
      throw new ForbiddenException(
        'Drivers are not authorized to view inventory mutation audit logs.',
      );
    }

    const where: Prisma.GoodsMutationWhereInput = {};

    if (currentUser.role === UserRole.CUSTOMER) {
      where.goods = { customerId: currentUser.id };
    } else if (currentUser.role === UserRole.ADMIN && customerId) {
      where.goods = { customerId };
    }

    const mutations = await this.prisma.goodsMutation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        goods: {
          select: {
            id: true,
            barcode: true,
            name: true,
            quantity: true,
            volumeM3: true,
            slot: { select: { code: true } },
          },
        },
      },
    });

    return mutations.map((m) => {
      let type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' = 'INBOUND';
      if (m.title.includes('Pemindahan') || m.title.includes('Transfer')) {
        type = 'TRANSFER';
      } else if (
        m.status === GoodsStorageStatus.PENDING_DELIVERY ||
        m.status === GoodsStorageStatus.IN_TRANSIT_OUTBOUND ||
        m.status === GoodsStorageStatus.DELIVERED
      ) {
        type = 'OUTBOUND';
      } else {
        type = 'INBOUND';
      }

      return {
        id: m.id,
        goodsId: m.goodsId,
        sku: m.goods.barcode,
        itemName: m.goods.name,
        quantityKoli: m.goods.quantity,
        volumeM3: Number(m.goods.volumeM3),
        slotCode: m.goods.slot?.code || 'Unassigned',
        status: m.status,
        type,
        title: m.title,
        description: m.description,
        actorName: m.actorName,
        actorRole: m.actorRole,
        location: m.location,
        timestamp: m.timestamp.toISOString(),
      };
    });
  }
}
