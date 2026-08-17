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
  Prisma,
  SlotStatus,
  StorageZoneType,
  UserRole,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateGoodsDto } from './dto/create-goods.dto';
import { GoodsQueryDto } from './dto/goods-query.dto';
import {
  GoodsDetailResponseDto,
  GoodsHistoryEventDto,
  GoodsListItemDto,
} from './dto/goods-response.dto';
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
    [GoodsStorageStatus.DRAFT]: [GoodsStorageStatus.PENDING_PICKUP, GoodsStorageStatus.CANCELLED],
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

  constructor(private readonly prisma: PrismaService) {}

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

      return goods;
    });

    return this.findById(createdGoods.id, currentUser);
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

      // Kasus A: Transisi ke STORED -> Alokasi Slot Rak & Tambah Kapasitas Terpakai
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

        if (goods.requiresColdStorage && slot.zone !== StorageZoneType.COLD_STORAGE) {
          throw new BadRequestException(
            `Barang memerlukan fasilitas Cold Storage, namun slot '${slot.code}' berada di zona '${slot.zone}'`,
          );
        }

        const currentSlotUsed = Number(slot.usedM3);
        const slotCapacity = Number(slot.capacityM3);
        const goodsVol = Number(goods.volumeM3);
        const newSlotUsed = Number((currentSlotUsed + goodsVol).toFixed(2));

        if (newSlotUsed > slotCapacity) {
          throw new BadRequestException(
            `Kapasitas slot rak '${slot.code}' tidak mencukupi (Kapasitas: ${slotCapacity} m3, Terpakai: ${currentSlotUsed} m3, Kebutuhan: ${goodsVol} m3)`,
          );
        }

        // Update slot rak
        await tx.storageSlot.update({
          where: { id: slot.id },
          data: {
            usedM3: newSlotUsed,
            status: SlotStatus.OCCUPIED,
          },
        });

        // Update kapasitas terpakai gudang
        await tx.warehouse.update({
          where: { id: goods.warehouseId },
          data: {
            usedCapacityM3: { increment: goods.volumeM3 },
          },
        });
      }

      // Kasus B: Transisi dari STORED ke DELIVERED / CANCELLED -> Bebaskan Kapasitas Slot Rak
      if (
        currentStatus === GoodsStorageStatus.STORED &&
        (newStatus === GoodsStorageStatus.DELIVERED || newStatus === GoodsStorageStatus.CANCELLED)
      ) {
        if (goods.slotId) {
          const slot = await tx.storageSlot.findUnique({
            where: { id: goods.slotId },
          });

          if (slot) {
            const freedUsed = Math.max(
              0,
              Number((Number(slot.usedM3) - Number(goods.volumeM3)).toFixed(2)),
            );
            const nextSlotStatus = freedUsed === 0 ? SlotStatus.AVAILABLE : SlotStatus.OCCUPIED;

            await tx.storageSlot.update({
              where: { id: slot.id },
              data: {
                usedM3: freedUsed,
                status: nextSlotStatus,
              },
            });
          }

          // Kurangi kapasitas terpakai gudang
          const wh = await tx.warehouse.findUnique({
            where: { id: goods.warehouseId },
          });
          if (wh) {
            const freedWhUsed = Math.max(
              0,
              Number((Number(wh.usedCapacityM3) - Number(goods.volumeM3)).toFixed(2)),
            );
            await tx.warehouse.update({
              where: { id: wh.id },
              data: { usedCapacityM3: freedWhUsed },
            });
          }
        }
      }

      // Update data barang
      await tx.goodsItem.update({
        where: { id: goods.id },
        data: {
          status: newStatus,
          slotId: targetSlotId,
        },
      });

      // Catat jejak audit mutasi
      const { title, description } = this.getMutationAuditInfo(newStatus, dto.note);

      await tx.goodsMutation.create({
        data: {
          goodsId: goods.id,
          status: newStatus,
          title,
          description,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          location: dto.location || goods.warehouse.name,
          timestamp: new Date(),
        },
      });
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
    const orderBy: Prisma.GoodsItemOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

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
}
