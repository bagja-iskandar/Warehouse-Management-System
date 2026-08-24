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
import {
  GoodsDetailResponseDto,
  GoodsHistoryEventDto,
  GoodsListItemDto,
} from './dto/goods-response.dto';
import { TransferGoodsSlotDto } from './dto/transfer-goods-slot.dto';
import { UpdateGoodsStatusDto } from './dto/update-goods-status.dto';

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

  // Master tarif sewa bulanan per m3 (IDR)
  private readonly STANDARD_RATE_PER_M3 = 1_500_000;
  private readonly COLD_STORAGE_RATE_PER_M3 = 2_500_000;
  private readonly MINIMUM_MONTHLY_FEE = 250_000;

  // State Machine transisi status barang yang diizinkan
  private readonly ALLOWED_TRANSITIONS: Record<GoodsStorageStatus, GoodsStorageStatus[]> = {
    [GoodsStorageStatus.DRAFT]: [
      GoodsStorageStatus.PENDING_PICKUP,
      GoodsStorageStatus.INSPECTING,
      GoodsStorageStatus.STORED,
      GoodsStorageStatus.CANCELLED,
    ],
    [GoodsStorageStatus.PENDING_PICKUP]: [
      GoodsStorageStatus.IN_TRANSIT_INBOUND,
      GoodsStorageStatus.CANCELLED,
      GoodsStorageStatus.DRAFT,
    ],
    [GoodsStorageStatus.IN_TRANSIT_INBOUND]: [
      GoodsStorageStatus.INSPECTING,
      GoodsStorageStatus.PENDING_PICKUP,
    ],
    [GoodsStorageStatus.INSPECTING]: [
      GoodsStorageStatus.STORED,
      GoodsStorageStatus.CANCELLED,
      GoodsStorageStatus.IN_TRANSIT_INBOUND,
    ],
    [GoodsStorageStatus.STORED]: [GoodsStorageStatus.PENDING_DELIVERY],
    [GoodsStorageStatus.PENDING_DELIVERY]: [
      GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
      GoodsStorageStatus.STORED,
    ],
    [GoodsStorageStatus.IN_TRANSIT_OUTBOUND]: [
      GoodsStorageStatus.DELIVERED,
      GoodsStorageStatus.PENDING_DELIVERY,
    ],
    [GoodsStorageStatus.DELIVERED]: [],
    [GoodsStorageStatus.CANCELLED]: [],
  };

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
    // 1. Tentukan pemilik barang (Customer ID) berdasarkan hak akses peran
    let targetCustomerId: string;
    if (currentUser.role === UserRole.CUSTOMER) {
      targetCustomerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      targetCustomerId = dto.customerId || currentUser.id;
    } else {
      throw new ForbiddenException(
        'Hanya Customer atau Admin yang berhak mendaftarkan barang baru',
      );
    }

    // 2. Validasi keberadaan Customer dan Fasilitas Gudang
    const [customer, warehouse] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetCustomerId },
        select: { id: true, name: true, companyName: true, email: true, phone: true },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: dto.warehouseId },
        select: { id: true, code: true, name: true, city: true, isActive: true },
      }),
    ]);

    if (!customer) {
      throw new NotFoundException(`Customer dengan ID '${targetCustomerId}' tidak ditemukan`);
    }

    if (!warehouse || !warehouse.isActive) {
      throw new NotFoundException(
        `Fasilitas gudang dengan ID '${dto.warehouseId}' tidak ditemukan atau sedang tidak aktif`,
      );
    }

    // 2b. Validasi Kepemilikan Kontrak Sewa Ruang Aktif untuk Peran Customer
    if (currentUser.role === UserRole.CUSTOMER) {
      const activeRentalInvoice = await this.prisma.invoice.findFirst({
        where: {
          customerId: currentUser.id,
          status: { not: InvoiceStatus.CANCELLED },
          items: {
            some: {
              goodsName: {
                startsWith: `Rental Space: ${warehouse.code}`,
              },
            },
          },
        },
      });

      const hasExistingGoods = await this.prisma.goodsItem.findFirst({
        where: {
          customerId: currentUser.id,
          warehouseId: warehouse.id,
        },
      });

      if (!activeRentalInvoice && !hasExistingGoods) {
        throw new BadRequestException(
          'Anda belum memiliki ruang penyimpanan aktif di fasilitas gudang ini. Silakan melakukan rental space terlebih dahulu.',
        );
      }
    }

    // 3. Kalkulasi Volume Server-Side (P x L x T / 1.000.000 x Qty)
    const volumePerItemM3 = (dto.lengthCm * dto.widthCm * dto.heightCm) / 1_000_000;
    const totalVolumeM3 = Number((volumePerItemM3 * dto.quantity).toFixed(4));

    // 4. Kalkulasi Tarif Sewa Bulanan Berdasarkan Kategori & Cold Storage
    const isCold = dto.requiresColdStorage || dto.category === GoodsCategory.COLD_FOOD;
    const ratePerM3 = isCold ? this.COLD_STORAGE_RATE_PER_M3 : this.STANDARD_RATE_PER_M3;
    const calculatedFee = Math.round(totalVolumeM3 * ratePerM3);
    const monthlyRentalFee = Math.max(this.MINIMUM_MONTHLY_FEE, calculatedFee);

    // 5. Generate Barcode & QR Code Unik
    const categoryCode = this.getCategoryPrefix(dto.category);
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const barcode = `BRG-2026-${categoryCode}-${randomSuffix}`;
    const initialStatus = dto.pickupRequired
      ? GoodsStorageStatus.PENDING_PICKUP
      : GoodsStorageStatus.DRAFT;

    const startDate = new Date();

    // 6. Eksekusi Pendaftaran & Pencatatan Mutasi Awal dalam Transaksi Atomik
    const createdGoods = await this.prisma.$transaction(async (tx) => {
      const goods = await tx.goodsItem.create({
        data: {
          barcode,
          customerId: targetCustomerId,
          warehouseId: dto.warehouseId,
          name: dto.name,
          category: dto.category,
          description: dto.description,
          lengthCm: dto.lengthCm,
          widthCm: dto.widthCm,
          heightCm: dto.heightCm,
          volumeM3: totalVolumeM3,
          weightKg: dto.weightKg,
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

      // Catat jejak audit awal pada goods_mutations
      await tx.goodsMutation.create({
        data: {
          goodsId: goods.id,
          status: initialStatus,
          title: dto.pickupRequired
            ? 'Permintaan Penjemputan Diajukan'
            : 'Pendaftaran Barang Baru (Draft)',
          description: dto.pickupRequired
            ? `Customer mengajukan input barang dan meminta penjemputan armada WMS ke alamat: ${dto.pickupAddress || 'Sesuai profil pelanggan'}.`
            : `Barang berhasil didaftarkan ke sistem WMS Nusantara dengan status Draft.`,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          location: dto.pickupAddress || warehouse.name,
          timestamp: startDate,
        },
      });

      // 7. Terbitkan Notifikasi Transaksional ke Customer dan Seluruh Admin
      await this.notificationsService.createNotification(
        {
          recipientUserId: targetCustomerId,
          recipientRole: UserRole.CUSTOMER,
          title: dto.pickupRequired ? 'Permintaan Penjemputan Diajukan' : 'Barang Berhasil Didaftarkan',
          message: `Barang "${goods.name}" (SKU: ${goods.barcode}) sebanyak ${goods.quantity} ${goods.unit} telah berhasil didaftarkan.`,
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
          title: dto.pickupRequired ? 'Permintaan Pickup Barang Baru' : 'Pendaftaran Barang Baru',
          message: `Tenant "${customer.name}" mendaftarkan barang "${goods.name}" (${goods.quantity} ${goods.unit}) di gudang ${warehouse.name}.`,
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
    const capacityM3 = Number(slot.capacityM3);

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
  async recalculateWarehouseCapacity(warehouseId: string, tx?: Prisma.TransactionClient): Promise<number> {
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
  async reconcileAllCapacity(tx?: Prisma.TransactionClient): Promise<{ slotsUpdated: number; warehousesUpdated: number }> {
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
      throw new NotFoundException(`Barang dengan ID atau barcode '${id}' tidak ditemukan`);
    }

    // 2. Penegakan Anti-IDOR
    if (currentUser.role === UserRole.CUSTOMER && goods.customerId !== currentUser.id) {
      throw new NotFoundException(`Barang dengan ID atau barcode '${id}' tidak ditemukan`);
    }

    const currentStatus = goods.status;
    const newStatus = dto.status;
    const oldSlotId = goods.slotId;

    // 3. Validasi Hak Akses Peran terhadap Status Tujuan (RBAC / Authorization Check)
    this.validateRolePermissionOnTransition(currentUser.role, newStatus);

    // 4. Validasi State Machine Transisi (Business Rules)
    const allowedNextStatuses = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Transisi status dari '${currentStatus}' ke '${newStatus}' tidak diizinkan dalam alur state machine WMS.`,
      );
    }

    // 5. Eksekusi State Transition, Slot Allocation & Audit Mutation dalam Transaksi Atomik
    await this.prisma.$transaction(async (tx) => {
      let targetSlotId = goods.slotId;

      // Kasus A: Transisi ke STORED -> Alokasi Slot Rak & Validasi Kapasitas
      if (newStatus === GoodsStorageStatus.STORED) {
        targetSlotId = dto.slotId || goods.slotId;
        if (!targetSlotId) {
          throw new BadRequestException(
            'ID slot rak (slotId) wajib disertakan saat memindahkan status barang ke STORED',
          );
        }

        const slot = await tx.storageSlot.findUnique({
          where: { id: targetSlotId },
        });

        if (!slot) {
          throw new NotFoundException(`Slot rak dengan ID '${targetSlotId}' tidak ditemukan`);
        }

        if (slot.warehouseId !== goods.warehouseId) {
          throw new BadRequestException(
            'Slot rak yang dipilih tidak berada pada fasilitas gudang yang sama dengan barang',
          );
        }

        if (slot.status === SlotStatus.MAINTENANCE) {
          throw new BadRequestException(
            `Slot rak '${slot.code}' sedang dalam masa perbaikan (MAINTENANCE)`,
          );
        }

        if (goods.requiresColdStorage && slot.zone !== StorageZoneType.COLD_STORAGE) {
          throw new BadRequestException(
            `Barang memerlukan fasilitas Cold Storage, namun slot '${slot.code}' berada di zona '${slot.zone}'`,
          );
        }

        // Kalkulasi okupansi slot aktual dari barang STORED yang ada di database
        const existingStoredInSlot = await tx.goodsItem.aggregate({
          where: {
            slotId: targetSlotId,
            status: GoodsStorageStatus.STORED,
            id: { not: goods.id },
          },
          _sum: { volumeM3: true },
        });

        const currentSlotUsed = Number(existingStoredInSlot._sum.volumeM3 || 0);
        const slotCapacity = Number(slot.capacityM3);
        const goodsVol = Number(goods.volumeM3);
        const availableM3 = Math.max(0, Number((slotCapacity - currentSlotUsed).toFixed(2)));

        if (goodsVol > availableM3) {
          throw new BadRequestException(
            `Cannot store this goods. The selected rack slot '${slot.code}' only has ${availableM3} m³ available, while this goods requires ${goodsVol} m³.`,
          );
        }

        // Update data barang ke status STORED
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
        // Kasus B: Transisi ke status non-STORED (e.g. DELIVERED, CANCELLED, PENDING_DELIVERY, etc.)
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

        // Bebaskan kapasitas slot asal jika ada
        if (oldSlotId) {
          await this.recalculateSlotCapacity(oldSlotId, tx);
        }

        // Recalculate warehouse capacity dynamically
        await this.recalculateWarehouseCapacity(goods.warehouseId, tx);
      }

      // Ambil detail slot jika dialokasikan untuk riwayat mutasi presisi
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

      // Catat jejak audit mutasi
      let mutationTitle = `Status Diperbarui: ${newStatus}`;
      let mutationDesc = dto.note || `Status barang beralih menjadi ${newStatus}.`;
      let mutationLocation = dto.location || goods.warehouse.name;

      if (newStatus === GoodsStorageStatus.STORED) {
        mutationTitle = 'Barang Berhasil Ditempatkan di Rak (Put-Away)';
        mutationDesc =
          dto.note ||
          `Barang berhasil ditempatkan di slot rak ${allocatedSlotCode} (${allocatedSlotZone}) oleh Admin (${currentUser.name}). Suhu operasional terpantau normal.`;
        mutationLocation = `${goods.warehouse.name} — ${allocatedSlotZone} / Slot ${allocatedSlotCode}`;
      } else {
        const auditInfo = this.getMutationAuditInfo(newStatus, dto.note);
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

      // Notifikasi ke Customer Pemilik
      const custNotifTitle =
        newStatus === GoodsStorageStatus.STORED
          ? 'Barang Telah Disimpan di Rak Gudang'
          : `Status Barang: ${newStatus}`;
      const custNotifMsg =
        newStatus === GoodsStorageStatus.STORED
          ? `Barang "${goods.name}" (${goods.barcode}) telah berhasil ditempatkan pada slot rak ${allocatedSlotCode} (${allocatedSlotZone}) di ${goods.warehouse.name}.`
          : `Status penyimpanan barang "${goods.name}" (${goods.barcode}) diperbarui menjadi ${newStatus}.`;

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

      // Jika Put-Away, beri notifikasi juga ke seluruh Admin
      if (newStatus === GoodsStorageStatus.STORED) {
        await this.notificationsService.notifyRole(
          UserRole.ADMIN,
          {
            title: 'Put-Away Berhasil',
            message: `Barang "${goods.name}" berhasil ditempatkan di slot rak ${allocatedSlotCode} (${goods.warehouse.name}).`,
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
            (oi) =>
              oi.goodsId === goods.id || oi.goods.status === GoodsStorageStatus.STORED,
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
      throw new ForbiddenException(
        'Hanya Admin yang memiliki wewenang melakukan pemindahan slot rak (Rack Transfer)',
      );
    }

    // 1. Ambil data barang saat ini
    const goods = await this.prisma.goodsItem.findFirst({
      where: { OR: [{ id }, { barcode: id }] },
      include: {
        warehouse: true,
        slot: true,
      },
    });

    if (!goods) {
      throw new NotFoundException(`Barang dengan ID atau barcode '${id}' tidak ditemukan`);
    }

    if (goods.status !== GoodsStorageStatus.STORED || !goods.slotId) {
      throw new BadRequestException(
        `Barang hanya dapat dipindahkan antar rak jika berstatus STORED (Status saat ini: ${goods.status})`,
      );
    }

    if (goods.slotId === dto.targetSlotId) {
      throw new BadRequestException('Slot tujuan sama dengan slot penyimpanan saat ini.');
    }

    const sourceSlot = goods.slot;
    if (!sourceSlot) {
      throw new BadRequestException('Data slot asal penyimpanan barang tidak valid.');
    }

    // 2. Validasi slot tujuan
    const targetSlot = await this.prisma.storageSlot.findUnique({
      where: { id: dto.targetSlotId },
    });

    if (!targetSlot) {
      throw new NotFoundException(`Slot rak tujuan dengan ID '${dto.targetSlotId}' tidak ditemukan.`);
    }

    if (targetSlot.warehouseId !== goods.warehouseId) {
      throw new BadRequestException(
        'Slot rak tujuan harus berada pada fasilitas gudang yang sama dengan barang.',
      );
    }

    if (targetSlot.status === SlotStatus.MAINTENANCE) {
      throw new BadRequestException(
        `Slot rak tujuan '${targetSlot.code}' sedang dalam masa perbaikan (MAINTENANCE).`,
      );
    }

    if (goods.requiresColdStorage && targetSlot.zone !== StorageZoneType.COLD_STORAGE) {
      throw new BadRequestException(
        `Barang memerlukan fasilitas Cold Storage, namun slot tujuan '${targetSlot.code}' berada di zona '${targetSlot.zone}'.`,
      );
    }

    // Hitung occupancy riil target slot dari database
    const existingTargetStored = await this.prisma.goodsItem.aggregate({
      where: {
        slotId: targetSlot.id,
        status: GoodsStorageStatus.STORED,
        id: { not: goods.id },
      },
      _sum: { volumeM3: true },
    });

    const targetSlotUsed = Number(existingTargetStored._sum.volumeM3 || 0);
    const targetSlotCap = Number(targetSlot.capacityM3);
    const goodsVol = Number(goods.volumeM3);
    const targetAvailCap = Math.max(0, Number((targetSlotCap - targetSlotUsed).toFixed(2)));

    if (goodsVol > targetAvailCap) {
      throw new BadRequestException(
        `Cannot transfer this goods. The target rack slot '${targetSlot.code}' only has ${targetAvailCap} m³ available, while this goods requires ${goodsVol} m³.`,
      );
    }

    // 3. Eksekusi perpindahan dalam transaksi atomik
    await this.prisma.$transaction(async (tx) => {
      // Update slot ID barang
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

      // Recalculate warehouse capacity (net 0 change, fully verified)
      await this.recalculateWarehouseCapacity(goods.warehouseId, tx);

      // Catat jejak mutasi transfer
      const mutationTitle = 'Pemindahan Slot Rak (Rack Transfer)';
      const mutationDesc = dto.note
        ? `${dto.note} (Alasan: ${dto.reason} • Dari Slot ${sourceSlot.code} ke Slot ${targetSlot.code})`
        : `Barang berhasil dipindahkan dari slot ${sourceSlot.code} (${sourceSlot.zone}) ke slot ${targetSlot.code} (${targetSlot.zone}) oleh Admin (${currentUser.name}). Alasan: ${dto.reason}.`;
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

      // Notifikasi ke Customer
      await this.notificationsService.createNotification(
        {
          recipientUserId: goods.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Relokasi Slot Rak Barang (Rack Transfer)',
          message: `Barang "${goods.name}" (${goods.barcode}) telah dipindahkan dari slot ${sourceSlot.code} ke slot ${targetSlot.code} (${targetSlot.zone}) di ${goods.warehouse.name}.`,
          category: NotificationCategory.GOODS_STORED,
          relatedEntityId: goods.id,
          relatedEntityType: RelatedEntityType.GOODS,
          actionUrl: '/customer/goods',
        },
        tx,
      );

      // Notifikasi ke seluruh Admin
      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'Pemindahan Slot Rak Sukses',
          message: `Admin ${currentUser.name} memindahkan barang "${goods.name}" (${goods.barcode}) ke slot ${targetSlot.code}.`,
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
    const items = goodsItems.map((item) => this.mapToListItemDto(item));

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
      throw new NotFoundException(`Barang dengan ID atau barcode '${id}' tidak ditemukan`);
    }

    // Penegakan Keamanan Anti-IDOR: Customer hanya boleh mengakses barang miliknya sendiri
    if (currentUser.role === UserRole.CUSTOMER && goods.customerId !== currentUser.id) {
      throw new NotFoundException(`Barang dengan ID atau barcode '${id}' tidak ditemukan`);
    }

    const baseItem = this.mapToListItemDto(goods);

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

  /**
   * Helper internal untuk memvalidasi hak akses peran terhadap status tujuan.
   */
  private validateRolePermissionOnTransition(role: UserRole, newStatus: GoodsStorageStatus): void {
    if (role === UserRole.CUSTOMER) {
      const customerAllowed: GoodsStorageStatus[] = [
        GoodsStorageStatus.PENDING_PICKUP,
        GoodsStorageStatus.PENDING_DELIVERY,
        GoodsStorageStatus.CANCELLED,
      ];
      if (!customerAllowed.includes(newStatus)) {
        throw new ForbiddenException(
          `Pelanggan tidak memiliki izin untuk mengubah status barang menjadi '${newStatus}'`,
        );
      }
    } else if (role === UserRole.DRIVER) {
      const driverAllowed: GoodsStorageStatus[] = [
        GoodsStorageStatus.IN_TRANSIT_INBOUND,
        GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
        GoodsStorageStatus.DELIVERED,
      ];
      if (!driverAllowed.includes(newStatus)) {
        throw new ForbiddenException(
          `Pengemudi tidak memiliki izin untuk mengubah status barang menjadi '${newStatus}'`,
        );
      }
    }
  }

  /**
   * Helper internal untuk menghasilkan judul dan deskripsi mutasi audit otomatis.
   */
  private getMutationAuditInfo(
    status: GoodsStorageStatus,
    customNote?: string,
  ): { title: string; description: string } {
    switch (status) {
      case GoodsStorageStatus.PENDING_PICKUP:
        return {
          title: 'Permintaan Penjemputan Diajukan',
          description: customNote || 'Customer mengajukan permintaan penjemputan armada WMS.',
        };
      case GoodsStorageStatus.IN_TRANSIT_INBOUND:
        return {
          title: 'Barang Dalam Perjalanan Masuk (Inbound)',
          description:
            customNote ||
            'Driver melakukan penjemputan barang dan sedang menuju ke fasilitas gudang.',
        };
      case GoodsStorageStatus.INSPECTING:
        return {
          title: 'Inspeksi Kargo & Uji Mutu Gudang',
          description:
            customNote ||
            'Barang tiba di gudang dan sedang melalui proses inspeksi fisik serta pengecekan suhu.',
        };
      case GoodsStorageStatus.STORED:
        return {
          title: 'Barang Berhasil Disimpan di Slot Gudang',
          description:
            customNote ||
            'Inspeksi kargo disetujui. Barang telah ditempatkan pada slot rak penyimpanan yang ditentukan.',
        };
      case GoodsStorageStatus.PENDING_DELIVERY:
        return {
          title: 'Permintaan Pengeluaran / Outbound Diajukan',
          description:
            customNote ||
            'Permintaan pengeluaran barang diajukan untuk proses pengiriman ke alamat tujuan.',
        };
      case GoodsStorageStatus.IN_TRANSIT_OUTBOUND:
        return {
          title: 'Barang Dalam Perjalanan Pengantaran (Outbound)',
          description:
            customNote ||
            'Driver mengangkut kargo keluar dari gudang dan dalam proses pengantaran ke penerima.',
        };
      case GoodsStorageStatus.DELIVERED:
        return {
          title: 'Barang Telah Diterima di Tujuan (Delivered)',
          description:
            customNote ||
            'Serah terima kargo selesai. Kapasitas slot rak dan fasilitas gudang telah dibebaskan.',
        };
      case GoodsStorageStatus.CANCELLED:
        return {
          title: 'Penyimpanan Barang Dibatalkan',
          description:
            customNote || 'Proses penyimpanan barang dibatalkan oleh pengguna atau admin.',
        };
      default:
        return {
          title: `Status Diperbarui: ${status}`,
          description: customNote || `Status barang berhasil diubah menjadi ${status}.`,
        };
    }
  }

  private getCategoryPrefix(category: GoodsCategory): string {
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

  /**
   * Helper internal untuk memetakan entity Prisma GoodsItem ke GoodsListItemDto.
   */
  private mapToListItemDto(
    item: Prisma.GoodsItemGetPayload<{
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
    }>,
  ): GoodsListItemDto {
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

  /**
   * Mengambil riwayat mutasi / log histori kargo barang milik tenant customer yang sedang login.
   */
  async findMutations(currentUser: AuthenticatedUser, customerId?: string) {
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
