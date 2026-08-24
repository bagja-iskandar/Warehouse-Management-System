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
  NotificationCategory,
  OrderStatus,
  OrderType,
  Prisma,
  RelatedEntityType,
  UserRole,
  VehicleStatus,
  VehicleType,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateDeliveryOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DeliveryOrderDetailResponseDto, DeliveryOrderListItemDto, OrderItemDto } from './dto/order-response.dto';
import { ReceiveInboundDto } from './dto/receive-inbound.dto';
import { SubmitPodDto } from './dto/submit-pod.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';

export interface PaginatedOrderResult {
  items: DeliveryOrderListItemDto[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  // State Machine transisi status pengiriman Delivery Order
  private readonly ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING_ASSIGNMENT]: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.CANCELLED],
    [OrderStatus.DRIVER_ASSIGNED]: [
      OrderStatus.EN_ROUTE_PICKUP,
      OrderStatus.PENDING_ASSIGNMENT,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.EN_ROUTE_PICKUP]: [
      OrderStatus.PICKED_UP,
      OrderStatus.DELAYED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.DELAYED],
    [OrderStatus.IN_TRANSIT]: [OrderStatus.ARRIVED_DESTINATION, OrderStatus.DELAYED],
    [OrderStatus.ARRIVED_DESTINATION]: [OrderStatus.DELIVERED, OrderStatus.DELAYED],
    [OrderStatus.DELIVERED]: [OrderStatus.CONFIRMED],
    [OrderStatus.DELAYED]: [
      OrderStatus.EN_ROUTE_PICKUP,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.ARRIVED_DESTINATION,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.CONFIRMED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ===========================================================================
  // 1. VEHICLES & FLEET MANAGEMENT
  // ===========================================================================

  /**
   * Mengambil daftar armada kendaraan logistik dengan filter tipe, status, pendingin, dan pencarian.
   */
  async findAllVehicles(query: VehicleQueryDto): Promise<VehicleResponseDto[]> {
    const where: Prisma.VehicleWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.hasRefrigeration !== undefined) {
      where.hasRefrigeration = query.hasRefrigeration;
    }
    if (query.search) {
      where.OR = [
        { plateNumber: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { locationCity: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { plateNumber: 'asc' },
    });

    return vehicles.map((v) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      name: v.name,
      type: v.type,
      maxWeightKg: Number(v.maxWeightKg),
      maxVolumeM3: Number(v.maxVolumeM3),
      hasRefrigeration: v.hasRefrigeration,
      minTempCelsius: v.minTempCelsius ? Number(v.minTempCelsius) : null,
      status: v.status,
      currentDriverId: v.currentDriverId,
      currentDriverName: v.driver?.name || null,
      currentDriverPhone: v.driver?.phone || null,
      locationCity: v.locationCity,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    }));
  }

  /**
   * Penugasan driver ke kendaraan operasional oleh Admin.
   */
  async assignDriver(
    dto: AssignDriverDto,
    currentUser: AuthenticatedUser,
  ): Promise<VehicleResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Hanya Admin yang berhak menugaskan pengemudi ke kendaraan armada',
      );
    }

    const [vehicle, driver] = await Promise.all([
      this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      }),
      this.prisma.user.findUnique({
        where: { id: dto.driverId },
      }),
    ]);

    if (!vehicle) {
      throw new NotFoundException(`Kendaraan dengan ID '${dto.vehicleId}' tidak ditemukan`);
    }

    if (!driver || driver.role !== UserRole.DRIVER) {
      throw new NotFoundException(
        `Pengemudi dengan ID '${dto.driverId}' tidak ditemukan atau bukan berstatus Driver`,
      );
    }

    const updated = await this.prisma.vehicle.update({
      where: { id: dto.vehicleId },
      data: {
        currentDriverId: dto.driverId,
        status: VehicleStatus.IN_SERVICE,
      },
      include: {
        driver: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return {
      id: updated.id,
      plateNumber: updated.plateNumber,
      name: updated.name,
      type: updated.type,
      maxWeightKg: Number(updated.maxWeightKg),
      maxVolumeM3: Number(updated.maxVolumeM3),
      hasRefrigeration: updated.hasRefrigeration,
      minTempCelsius: updated.minTempCelsius ? Number(updated.minTempCelsius) : null,
      status: updated.status,
      currentDriverId: updated.currentDriverId,
      currentDriverName: updated.driver?.name || null,
      currentDriverPhone: updated.driver?.phone || null,
      locationCity: updated.locationCity,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // ===========================================================================
  // 2. DELIVERY ORDERS & LOGISTICS OPERATIONS
  // ===========================================================================

  /**
   * Mengambil daftar Delivery Order dengan paginasi, filtering, dan isolasi data per peran (RBAC).
   */
  async findAllOrders(
    query: OrderQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedOrderResult> {
    const andConditions: Prisma.DeliveryOrderWhereInput[] = [];

    // 1. Isolasi Data Multi-Tenant
    if (currentUser.role === UserRole.CUSTOMER) {
      andConditions.push({ customerId: currentUser.id });
    } else if (currentUser.role === UserRole.DRIVER) {
      andConditions.push({
        OR: [
          { driverId: currentUser.id },
          { driverId: null, status: OrderStatus.PENDING_ASSIGNMENT },
        ],
      });
    } else if (currentUser.role === UserRole.ADMIN) {
      if (query.customerId) andConditions.push({ customerId: query.customerId });
      if (query.driverId) andConditions.push({ driverId: query.driverId });
    }

    // 2. Filter status & tipe
    if (query.status) andConditions.push({ status: query.status });
    if (query.type) andConditions.push({ type: query.type });
    if (query.scheduledDate) {
      andConditions.push({ scheduledDate: new Date(query.scheduledDate) });
    }
    if (query.warehouseId) {
      andConditions.push({
        orderItems: {
          some: {
            goods: {
              warehouseId: query.warehouseId,
            },
          },
        },
      });
    }

    // 3. Pencarian
    if (query.search) {
      andConditions.push({
        OR: [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
          { goodsSummary: { contains: query.search, mode: 'insensitive' } },
          { originAddress: { contains: query.search, mode: 'insensitive' } },
          { originCity: { contains: query.search, mode: 'insensitive' } },
          { destinationAddress: { contains: query.search, mode: 'insensitive' } },
          { destinationCity: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.DeliveryOrderWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // 4. Paginasi
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const take = limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: Prisma.DeliveryOrderOrderByWithRelationInput[] = [];

    if (sortBy === 'scheduledDate') {
      orderBy.push({ scheduledDate: sortOrder });
      orderBy.push({ createdAt: 'desc' });
    } else {
      orderBy.push({ [sortBy]: sortOrder });
      if (sortBy !== 'createdAt') {
        orderBy.push({ createdAt: 'desc' });
      }
    }

    const [totalItems, orders] = await Promise.all([
      this.prisma.deliveryOrder.count({ where }),
      this.prisma.deliveryOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, companyName: true },
          },
          driver: {
            select: { id: true, name: true, phone: true },
          },
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              type: true,
              hasRefrigeration: true,
            },
          },
          orderItems: {
            include: {
              goods: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  unit: true,
                  volumeM3: true,
                  weightKg: true,
                  requiresColdStorage: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;
    const items = orders.map((o) => this.mapToOrderListItemDto(o));

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
   * Mengambil detail lengkap Delivery Order beserta relasi kargo barang, armada, dan jejak status.
   */
  async findOrderById(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
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
        driver: {
          select: { id: true, name: true, phone: true },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            name: true,
            type: true,
            hasRefrigeration: true,
          },
        },
        orderItems: {
          include: {
            goods: {
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
                  select: { id: true, code: true, name: true, city: true },
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
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Penegakan Anti-IDOR
    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    if (
      currentUser.role === UserRole.DRIVER &&
      order.driverId !== currentUser.id &&
      order.driverId !== null
    ) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    const baseItem = this.mapToOrderListItemDto(order);

    const items = order.orderItems.map((oi) => {
      const g = oi.goods;
      return {
        id: oi.id || g.id,
        goodsId: g.id,
        name: g.name,
        barcode: g.barcode,
        volumeM3: Number(g.volumeM3),
        weightKg: Number(g.weightKg),
        customerId: g.customerId,
        customerName: g.customer.name,
        customerCompany: g.customer.companyName,
        warehouseId: g.warehouseId,
        warehouseName: g.warehouse.name,
        warehouseCode: g.warehouse.code,
        slotId: g.slotId,
        slotCode: g.slot?.code || null,
        category: g.category,
        description: g.description,
        dimensions: {
          lengthCm: Number(g.lengthCm),
          widthCm: Number(g.widthCm),
          heightCm: Number(g.heightCm),
          volumeM3: Number(g.volumeM3),
          weightKg: Number(g.weightKg),
        },
        quantity: oi.quantity || g.quantity,
        unit: g.unit,
        requiresColdStorage: g.requiresColdStorage,
        targetTempMin: g.targetTempMin ? Number(g.targetTempMin) : null,
        targetTempMax: g.targetTempMax ? Number(g.targetTempMax) : null,
        currentTemp: g.currentTemp ? Number(g.currentTemp) : null,
        storageStartDate: g.storageStartDate.toISOString(),
        storageEndDate: g.storageEndDate ? g.storageEndDate.toISOString() : null,
        monthlyRentalFee: Number(g.monthlyRentalFee),
        status: g.status,
        imageUrl: g.imageUrl,
        qrCodeData: g.qrCodeData,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      };
    });

    const totalPackages =
      items.length > 0
        ? items.reduce((sum, it) => sum + (it.quantity || 0), 0)
        : baseItem.totalPackages || 1;

    return {
      ...baseItem,
      totalPackages,
      customer: order.customer,
      driver: order.driver,
      vehicle: order.vehicle,
      items,
    };
  }

  /**
   * Pembuatan Delivery Order / Surat Jalan Inbound atau Outbound dalam transaksi atomik.
   */
  async createOrder(
    dto: CreateDeliveryOrderDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    // 1. Tentukan pemilik order
    let targetCustomerId: string;
    if (currentUser.role === UserRole.CUSTOMER) {
      targetCustomerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      targetCustomerId = dto.customerId || currentUser.id;
    } else {
      throw new ForbiddenException('Hanya Customer atau Admin yang berhak membuat Delivery Order');
    }

    // 2. Tentukan daftar ID barang yang akan diproses
    const goodsIds =
      dto.items && dto.items.length > 0
        ? Array.from(new Set(dto.items.map((i) => i.goodsId)))
        : dto.goodsItemIds || [];

    if (goodsIds.length === 0) {
      throw new BadRequestException(
        'Minimal harus menyertakan 1 barang untuk membuat delivery order',
      );
    }

    // 3. Ambil seluruh data barang yang dipilih dari PostgreSQL
    const goodsList = await this.prisma.goodsItem.findMany({
      where: {
        id: { in: goodsIds },
      },
      include: {
        warehouse: true,
      },
    });

    if (goodsList.length !== goodsIds.length) {
      throw new BadRequestException('Satu atau lebih ID barang tidak ditemukan dalam database');
    }

    // 4. Pastikan seluruh barang milik Customer yang bersangkutan (Tenant Isolation)
    for (const g of goodsList) {
      if (g.customerId !== targetCustomerId) {
        throw new ForbiddenException(`Barang '${g.name}' bukan milik akun Customer yang dituju`);
      }
    }

    // 5. Validasi Gudang (Warehouse Isolation) jika warehouseId disertakan
    if (dto.warehouseId) {
      for (const g of goodsList) {
        if (g.warehouseId !== dto.warehouseId) {
          throw new BadRequestException(
            `Barang '${g.name}' berada di gudang '${g.warehouse.name}', bukan fasilitas gudang yang dipilih`,
          );
        }
      }
    }

    // 6. Validasi Kuantitas Stok / Inventory
    const requestedQtyMap = new Map<string, number>();
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        requestedQtyMap.set(item.goodsId, item.quantity);
      }
    } else {
      for (const g of goodsList) {
        requestedQtyMap.set(g.id, g.quantity);
      }
    }

    for (const g of goodsList) {
      const reqQty = requestedQtyMap.get(g.id) || g.quantity;
      if (reqQty > g.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for '${g.name}'. Available: ${g.quantity} ${g.unit || 'units'}, Requested: ${reqQty}`,
        );
      }
    }

    // 7. Kalkulasi total berat, total volume, dan kebutuhan Reefer secara akurat
    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    let requiresReefer = false;
    const summaryParts: string[] = [];

    for (const g of goodsList) {
      const reqQty = requestedQtyMap.get(g.id) || g.quantity;
      const unitWeight = g.quantity > 0 ? Number(g.weightKg) / g.quantity : Number(g.weightKg);
      const unitVol = g.quantity > 0 ? Number(g.volumeM3) / g.quantity : Number(g.volumeM3);

      totalWeightKg += unitWeight * reqQty;
      totalVolumeM3 += unitVol * reqQty;

      if (g.requiresColdStorage || g.category === GoodsCategory.COLD_FOOD) {
        requiresReefer = true;
      }
      summaryParts.push(`${reqQty}x ${g.name}`);
    }

    totalWeightKg = Number(totalWeightKg.toFixed(2));
    totalVolumeM3 = Number(totalVolumeM3.toFixed(4));
    const goodsSummary = summaryParts.join(', ');

    // 8. Validasi Kendaraan (jika ditentukan)
    let vehicle = null;
    if (dto.vehicleId) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(`Kendaraan dengan ID '${dto.vehicleId}' tidak ditemukan`);
      }

      // Validasi Wajib Reefer Truck untuk Cold Storage
      if (
        requiresReefer &&
        !vehicle.hasRefrigeration &&
        vehicle.type !== VehicleType.REEFER_TRUCK
      ) {
        throw new BadRequestException(
          'Kargo memuat komoditas Cold Storage bersuhu dingin. Wajib dialokasikan ke armada berpendingin (Reefer Truck)!',
        );
      }

      // Validasi Kapasitas Muatan Kendaraan
      if (totalWeightKg > Number(vehicle.maxWeightKg)) {
        throw new BadRequestException(
          `Total berat kargo (${totalWeightKg} kg) melebihi batas beban kendaraan '${vehicle.name}' (${vehicle.maxWeightKg} kg)`,
        );
      }

      if (totalVolumeM3 > Number(vehicle.maxVolumeM3)) {
        throw new BadRequestException(
          `Total volume kargo (${totalVolumeM3} m3) melebihi batas ruang kubikasi kendaraan '${vehicle.name}' (${vehicle.maxVolumeM3} m3)`,
        );
      }
    }

    // 9. Generate Nomor Order Unik
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-2026-${randomHex}`;
    const initialStatus = dto.driverId
      ? OrderStatus.DRIVER_ASSIGNED
      : OrderStatus.PENDING_ASSIGNMENT;

    // 10. Eksekusi Transaksi Database Atomik
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.deliveryOrder.create({
        data: {
          orderNumber,
          type: dto.type,
          customerId: targetCustomerId,
          driverId: dto.driverId || null,
          vehicleId: dto.vehicleId || null,
          goodsSummary,
          totalVolumeM3,
          totalWeightKg,
          requiresReefer,
          originAddress: dto.originAddress,
          originCity: dto.originCity,
          destinationAddress: dto.destinationAddress,
          destinationCity: dto.destinationCity,
          scheduledDate: new Date(dto.scheduledDate),
          scheduledTimeSlot: dto.scheduledTimeSlot,
          status: initialStatus,
          distanceKm: dto.distanceKm || 0,
          estimatedDurationMins: dto.estimatedDurationMins || 0,
          orderItems: {
            create: goodsList.map((g) => ({
              goodsId: g.id,
              quantity: requestedQtyMap.get(g.id) || 1,
            })),
          },
        },
      });

      // Update status kendaraan menjadi IN_SERVICE jika sudah dialokasikan
      if (dto.vehicleId) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { status: VehicleStatus.IN_SERVICE },
        });
      }

      // Terbitkan Notifikasi Transaksional: Customer & Seluruh Admin
      await this.notificationsService.createNotification(
        {
          recipientUserId: targetCustomerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Permintaan Pengiriman Dibuat',
          message: `Delivery order #${order.orderNumber} (${dto.type}) berhasil diajukan untuk rute ${dto.originCity} → ${dto.destinationCity}.`,
          category: NotificationCategory.CONFIRMATION_REQUIRED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/customer/logistics/tracking',
        },
        tx,
      );

      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'Permintaan Pengiriman Baru',
          message: `Order baru #${order.orderNumber} (${goodsSummary}) menunggu penugasan driver dan armada.`,
          category: NotificationCategory.CONFIRMATION_REQUIRED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/admin/logistics',
        },
        tx,
      );

      if (dto.driverId) {
        await this.notificationsService.createNotification(
          {
            recipientUserId: dto.driverId,
            recipientRole: UserRole.DRIVER,
            title: 'Tugas Pengiriman Baru',
            message: `Anda ditugaskan untuk pengiriman #${order.orderNumber} (${dto.originCity} → ${dto.destinationCity}).`,
            category: NotificationCategory.DRIVER_DISPATCHED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: `/driver/tasks/${order.id}`,
          },
          tx,
        );
      }

      return order;
    });

    return this.findOrderById(createdOrder.id, currentUser);
  }

  /**
   * Memperbarui status Delivery Order dalam alur State Machine yang terkontrol.
   */
  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Penegakan Anti-IDOR
    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    const currentStatus = order.status;
    const newStatus = dto.status;

    // 1. Validasi Otorisasi Peran
    this.validateRolePermissionOnOrder(currentUser.role, newStatus, order.type);

    // 2. Validasi State Machine
    const allowed = this.ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transisi status pengiriman dari '${currentStatus}' ke '${newStatus}' tidak diizinkan.`,
      );
    }

    // 3. Eksekusi Pembaruan Status dalam Transaksi
    await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.DeliveryOrderUpdateInput = {
        status: newStatus,
      };

      if (dto.driverId) updateData.driver = { connect: { id: dto.driverId } };
      if (dto.vehicleId) updateData.vehicle = { connect: { id: dto.vehicleId } };
      if (dto.isDelayed !== undefined) updateData.isDelayed = dto.isDelayed;
      if (dto.delayReason) updateData.delayReason = dto.delayReason;
      if (dto.rescheduledTime) {
        updateData.rescheduledTime = new Date(dto.rescheduledTime);
      }

      await tx.deliveryOrder.update({
        where: { id: order.id },
        data: updateData,
      });

      // Synchronize vehicle status
      if (dto.vehicleId && newStatus === OrderStatus.DRIVER_ASSIGNED) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: {
            status: VehicleStatus.IN_SERVICE,
            currentDriverId: dto.driverId || undefined,
          },
        });
      } else if (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.CANCELLED) {
        const vehicleToFree = dto.vehicleId || order.vehicleId;
        if (vehicleToFree) {
          await tx.vehicle.update({
            where: { id: vehicleToFree },
            data: {
              status: VehicleStatus.AVAILABLE,
            },
          });
        }
      }

      // Notifikasi Transaksional Berdasarkan Perubahan Status
      if (newStatus === OrderStatus.DRIVER_ASSIGNED) {
        const driverId = dto.driverId || order.driverId;
        if (driverId) {
          await this.notificationsService.createNotification(
            {
              recipientUserId: driverId,
              recipientRole: UserRole.DRIVER,
              title: 'Tugas Pengiriman Ditugaskan',
              message: `Anda telah ditugaskan untuk menjalankan pengiriman #${order.orderNumber}.`,
              category: NotificationCategory.DRIVER_DISPATCHED,
              relatedEntityId: order.id,
              relatedEntityType: RelatedEntityType.ORDER,
              actionUrl: `/driver/tasks/${order.id}`,
            },
            tx,
          );
        }
        await this.notificationsService.createNotification(
          {
            recipientUserId: order.customerId,
            recipientRole: UserRole.CUSTOMER,
            title: 'Driver & Armada Ditugaskan',
            message: `Pengiriman #${order.orderNumber} telah ditugaskan ke driver. Silakan pantau perkiraan jadwal penjemputan/pengiriman.`,
            category: NotificationCategory.DRIVER_DISPATCHED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: '/customer/logistics/tracking',
          },
          tx,
        );
      } else if (
        newStatus === OrderStatus.EN_ROUTE_PICKUP ||
        newStatus === OrderStatus.PICKED_UP ||
        newStatus === OrderStatus.IN_TRANSIT
      ) {
        await this.notificationsService.createNotification(
          {
            recipientUserId: order.customerId,
            recipientRole: UserRole.CUSTOMER,
            title: `Status Pengiriman: ${newStatus}`,
            message: `Status delivery order #${order.orderNumber} saat ini telah diperbarui menjadi ${newStatus}.`,
            category: NotificationCategory.DELIVERY_ARRIVED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: '/customer/logistics/tracking',
          },
          tx,
        );
      } else if (newStatus === OrderStatus.ARRIVED_DESTINATION) {
        await this.notificationsService.createNotification(
          {
            recipientUserId: order.customerId,
            recipientRole: UserRole.CUSTOMER,
            title: `Status Pengiriman: Tiba di Tujuan`,
            message: `Status delivery order #${order.orderNumber} saat ini telah tiba di lokasi tujuan (${order.destinationCity}).`,
            category: NotificationCategory.DELIVERY_ARRIVED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: '/customer/logistics/tracking',
          },
          tx,
        );

        // Jika Inbound Pickup, beri notifikasi ke seluruh Admin Gudang untuk proses receiving
        if (order.type === OrderType.PICKUP) {
          await this.notificationsService.notifyRole(
            UserRole.ADMIN,
            {
              title: 'Inbound Shipment Tiba di Gudang',
              message: `Inbound shipment #${order.orderNumber} telah tiba di loading dock dan menunggu verifikasi penerimaan (Receiving).`,
              category: NotificationCategory.DELIVERY_ARRIVED,
              relatedEntityId: order.id,
              relatedEntityType: RelatedEntityType.ORDER,
              actionUrl: '/admin/logistics',
            },
            tx,
          );
        }
      } else if (newStatus === OrderStatus.CONFIRMED) {
        if (order.driverId) {
          await this.notificationsService.createNotification(
            {
              recipientUserId: order.driverId,
              recipientRole: UserRole.DRIVER,
              title: 'Penerimaan Dikonfirmasi Customer',
              message: `Customer telah mengonfirmasi penerimaan pengiriman #${order.orderNumber}. Tugas selesai!`,
              category: NotificationCategory.CONFIRMATION_REQUIRED,
              relatedEntityId: order.id,
              relatedEntityType: RelatedEntityType.ORDER,
              actionUrl: `/driver/tasks/${order.id}`,
            },
            tx,
          );
        }
        await this.notificationsService.notifyRole(
          UserRole.ADMIN,
          {
            title: 'Order Selesai Dikonfirmasi',
            message: `Delivery order #${order.orderNumber} telah dikonfirmasi oleh customer.`,
            category: NotificationCategory.CONFIRMATION_REQUIRED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: '/admin/logistics',
          },
          tx,
        );
      }
    });

    return this.findOrderById(order.id, currentUser);
  }

  /**
   * Menerima dan memverifikasi barang Inbound yang tiba di Loading Dock Gudang (Admin Receiving).
   * Memvalidasi Expected vs Received/Damaged/Missing, mengalihkan status order menjadi DELIVERED (Received),
   * membebaskan kendaraan, mengalihkan status barang menjadi INSPECTING (Put-Away Pending),
   * mencatat GoodsMutation, dan menerbitkan notifikasi ke Admin & Customer.
   */
  async receiveInboundOrder(
    id: string,
    dto: ReceiveInboundDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Hanya Admin/Warehouse Staff yang berhak melakukan receiving barang inbound',
      );
    }

    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            goods: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    if (order.type !== OrderType.PICKUP) {
      throw new BadRequestException('Proses Receiving hanya berlaku untuk Inbound Pickup order');
    }

    if (
      order.status !== OrderStatus.ARRIVED_DESTINATION &&
      order.status !== OrderStatus.IN_TRANSIT
    ) {
      throw new BadRequestException(
        `Order belum tiba di gudang atau sudah pernah diproses receiving (Status saat ini: ${order.status})`,
      );
    }

    // Hitung total kuantitas barang yang diharapkan (Expected Quantity)
    const expectedQuantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCounted = dto.receivedQuantity + dto.damagedQuantity + dto.missingQuantity;

    if (totalCounted !== expectedQuantity) {
      throw new BadRequestException(
        `Total verifikasi fisik (${totalCounted}: ${dto.receivedQuantity} diterima, ${dto.damagedQuantity} rusak, ${dto.missingQuantity} hilang) tidak sesuai dengan total koli manifest order (${expectedQuantity}).`,
      );
    }

    // Eksekusi Receiving dalam Transaksi Database Atomik
    await this.prisma.$transaction(async (tx) => {
      // 1. Update status order menjadi DELIVERED (Received at Warehouse)
      await tx.deliveryOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          confirmedByAdmin: true,
          recipientName: currentUser.name,
          recipientSignature: `VERIFIED_BY_ADMIN_${currentUser.id}`,
          confirmedAt: new Date(),
        },
      });

      // 2. Bebaskan kendaraan armada menjadi AVAILABLE
      if (order.vehicleId) {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      // 3. Update status semua barang terkait menjadi INSPECTING (Put-Away Pending)
      for (const item of order.orderItems) {
        await tx.goodsItem.update({
          where: { id: item.goodsId },
          data: {
            status: GoodsStorageStatus.INSPECTING,
          },
        });

        // 4. Catat riwayat mutasi perpindahan ke Receiving Area
        const warehouseName = item.goods.warehouse?.name || 'Logistics Hub';
        await tx.goodsMutation.create({
          data: {
            goodsId: item.goodsId,
            status: GoodsStorageStatus.INSPECTING,
            title: 'Inbound Receiving Completed (Put-Away Pending)',
            description: `Barang kargo tiba di loading dock dan diverifikasi oleh Admin (${currentUser.name}). Kondisi: ${dto.condition}. Diterima: ${dto.receivedQuantity}, Rusak: ${dto.damagedQuantity}, Hilang: ${dto.missingQuantity}. Catatan: ${dto.receivingNotes || '-'}. Menunggu penataan ke slot rak.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            location: `${warehouseName} — Receiving Dock`,
            timestamp: new Date(),
          },
        });
      }

      // 5. Terbitkan Notifikasi ke Admin (Put-Away Required)
      const targetWarehouseName = order.orderItems[0]?.goods?.warehouse?.name || 'Gudang Utama';
      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'Inbound Received — Put-Away Diperlukan',
          message: `Inbound shipment #${order.orderNumber} telah berhasil diterima di ${targetWarehouseName}.\nReceived: ${dto.receivedQuantity} | Damaged: ${dto.damagedQuantity} | Missing: ${dto.missingQuantity}.\nKondisi: ${dto.condition}. Silakan lakukan penempatan ke rak (Put-Away).`,
          category: NotificationCategory.GOODS_INSPECTED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/admin/goods',
        },
        tx,
      );

      // 6. Terbitkan Notifikasi ke Customer Pemilik
      await this.notificationsService.createNotification(
        {
          recipientUserId: order.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Barang Telah Diterima di Gudang',
          message: `Barang Anda dari pengiriman #${order.orderNumber} telah tiba di ${targetWarehouseName} dan berhasil diverifikasi penerimaan (Diterima: ${dto.receivedQuantity}, Rusak: ${dto.damagedQuantity}, Hilang: ${dto.missingQuantity}). Status: Menunggu Penataan Rak (Put-Away).`,
          category: NotificationCategory.GOODS_INSPECTED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/customer/goods',
        },
        tx,
      );
    });

    return this.findOrderById(order.id, currentUser);
  }

  /**
   * Upload Bukti Serah Terima Digital POD (Digital Signature, Foto Kargo, Rating)
   * dan pembebasan armada otomatis (Hanya berlaku untuk Outbound Delivery).
   */
  async submitPod(
    id: string,
    dto: SubmitPodDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    if (order.type === OrderType.PICKUP) {
      throw new BadRequestException(
        'Pengiriman inbound tidak memerlukan POD customer. Proses penerimaan dilakukan oleh Admin Gudang melalui menu Inbound Receiving.',
      );
    }

    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order dengan ID atau nomor '${id}' tidak ditemukan`);
    }

    // Eksekusi Submit POD dalam transaksi atomik
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({
        where: { id: order.id },
        data: {
          proofOfDeliveryUrl: dto.proofOfDeliveryUrl,
          recipientName: dto.recipientName,
          recipientSignature: dto.recipientSignature,
          driverRating: dto.driverRating || 5.0,
          status: OrderStatus.DELIVERED,
          confirmedByDriver: true,
          confirmedAt: new Date(),
        },
      });

      // Bebaskan kendaraan menjadi AVAILABLE
      if (order.vehicleId) {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      // Terbitkan Notifikasi POD ke Customer dan Admin
      await this.notificationsService.createNotification(
        {
          recipientUserId: order.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Barang Telah Sampai (POD Terbit)',
          message: `Pengiriman #${order.orderNumber} telah diserahkan kepada ${dto.recipientName}. Silakan cek bukti serah terima dan konfirmasi.`,
          category: NotificationCategory.DELIVERY_ARRIVED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/customer/logistics/tracking',
        },
        tx,
      );

      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'POD Pengiriman Diterbitkan',
          message: `Driver telah menyelesaikan pengiriman #${order.orderNumber} (Penerima: ${dto.recipientName}).`,
          category: NotificationCategory.DELIVERY_ARRIVED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/admin/logistics',
        },
        tx,
      );
    });

    return this.findOrderById(order.id, currentUser);
  }

  // ===========================================================================
  // 3. PRIVATE HELPER METHODS
  // ===========================================================================

  private validateRolePermissionOnOrder(
    role: UserRole,
    newStatus: OrderStatus,
    orderType: OrderType = OrderType.DELIVERY,
  ): void {
    if (role === UserRole.CUSTOMER) {
      if (orderType === OrderType.PICKUP) {
        throw new ForbiddenException(
          'Pelanggan tidak memiliki izin untuk mengubah status pengiriman inbound (Receiving dilakukan oleh Admin gudang)',
        );
      }
      const customerAllowed: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
      if (!customerAllowed.includes(newStatus)) {
        throw new ForbiddenException(
          `Pelanggan tidak memiliki izin untuk mengubah status pengiriman menjadi '${newStatus}'`,
        );
      }
    } else if (role === UserRole.DRIVER) {
      const driverAllowed: OrderStatus[] =
        orderType === OrderType.PICKUP
          ? [
              OrderStatus.EN_ROUTE_PICKUP,
              OrderStatus.PICKED_UP,
              OrderStatus.IN_TRANSIT,
              OrderStatus.ARRIVED_DESTINATION,
              OrderStatus.DELAYED,
            ]
          : [
              OrderStatus.EN_ROUTE_PICKUP,
              OrderStatus.PICKED_UP,
              OrderStatus.IN_TRANSIT,
              OrderStatus.ARRIVED_DESTINATION,
              OrderStatus.DELIVERED,
              OrderStatus.DELAYED,
            ];
      if (!driverAllowed.includes(newStatus)) {
        throw new ForbiddenException(
          `Pengemudi tidak memiliki izin untuk mengubah status pengiriman menjadi '${newStatus}'`,
        );
      }
    }
  }

  private mapToOrderListItemDto(
    order: any,
  ): DeliveryOrderListItemDto {
    const items: OrderItemDto[] = (order.orderItems || []).map((oi: any) => ({
      id: oi.id,
      goodsId: oi.goodsId || oi.goods?.id || '',
      name: oi.goods?.name || 'Cargo Item',
      barcode: oi.goods?.barcode || '',
      quantity: Number(oi.quantity) || 1,
      unit: oi.goods?.unit || 'Packages',
      volumeM3: oi.goods?.volumeM3 ? Number(oi.goods.volumeM3) : 0,
      weightKg: oi.goods?.weightKg ? Number(oi.goods.weightKg) : 0,
      requiresColdStorage: Boolean(oi.goods?.requiresColdStorage),
    }));

    const totalPackages =
      items.length > 0
        ? items.reduce((sum, it) => sum + (it.quantity || 0), 0)
        : 1;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      customerId: order.customerId,
      customerName: order.customer?.name || '',
      customerPhone: order.customer?.phone || '',
      goodsItemIds: (order.orderItems || []).map((oi: any) => oi.goodsId),
      items,
      totalPackages,
      goodsSummary: order.goodsSummary,
      totalVolumeM3: Number(order.totalVolumeM3),
      totalWeightKg: Number(order.totalWeightKg),
      requiresReefer: order.requiresReefer,
      originAddress: order.originAddress,
      originCity: order.originCity,
      destinationAddress: order.destinationAddress,
      destinationCity: order.destinationCity,
      scheduledDate:
        order.scheduledDate instanceof Date
          ? order.scheduledDate.toISOString().split('T')[0]
          : String(order.scheduledDate).split('T')[0],
      scheduledTimeSlot: order.scheduledTimeSlot,
      driverId: order.driverId,
      driverName: order.driver?.name || null,
      driverPhone: order.driver?.phone || null,
      vehicleId: order.vehicleId,
      vehiclePlate: order.vehicle?.plateNumber || null,
      vehicleType: order.vehicle?.type || null,
      status: order.status,
      estimatedDurationMins: order.estimatedDurationMins,
      distanceKm: Number(order.distanceKm),
      isDelayed: order.isDelayed,
      delayReason: order.delayReason,
      rescheduledTime: order.rescheduledTime
        ? new Date(order.rescheduledTime).toISOString()
        : null,
      proofOfDeliveryUrl: order.proofOfDeliveryUrl,
      recipientName: order.recipientName,
      recipientSignature: order.recipientSignature,
      driverRating: order.driverRating ? Number(order.driverRating) : null,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : String(order.createdAt),
      updatedAt:
        order.updatedAt instanceof Date
          ? order.updatedAt.toISOString()
          : String(order.updatedAt),
    };
  }
}
