import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GoodsCategory,
  OrderStatus,
  Prisma,
  UserRole,
  VehicleStatus,
  VehicleType,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateDeliveryOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DeliveryOrderDetailResponseDto, DeliveryOrderListItemDto } from './dto/order-response.dto';
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

  constructor(private readonly prisma: PrismaService) {}

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
    const where: Prisma.DeliveryOrderWhereInput = {};

    // 1. Isolasi Data Multi-Tenant
    if (currentUser.role === UserRole.CUSTOMER) {
      where.customerId = currentUser.id;
    } else if (currentUser.role === UserRole.DRIVER) {
      where.OR = [
        { driverId: currentUser.id },
        { driverId: null, status: OrderStatus.PENDING_ASSIGNMENT },
      ];
    } else if (currentUser.role === UserRole.ADMIN) {
      if (query.customerId) where.customerId = query.customerId;
      if (query.driverId) where.driverId = query.driverId;
    }

    // 2. Filter status & tipe
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.scheduledDate) {
      where.scheduledDate = new Date(query.scheduledDate);
    }

    // 3. Pencarian
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { goodsSummary: { contains: query.search, mode: 'insensitive' } },
        { originCity: { contains: query.search, mode: 'insensitive' } },
        { destinationCity: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // 4. Paginasi
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalItems, orders] = await Promise.all([
      this.prisma.deliveryOrder.count({ where }),
      this.prisma.deliveryOrder.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledDate: 'desc' },
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
            select: { goodsId: true },
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
        id: g.id,
        barcode: g.barcode,
        customerId: g.customerId,
        customerName: g.customer.name,
        customerCompany: g.customer.companyName,
        warehouseId: g.warehouseId,
        warehouseName: g.warehouse.name,
        warehouseCode: g.warehouse.code,
        slotId: g.slotId,
        slotCode: g.slot?.code || null,
        name: g.name,
        category: g.category,
        description: g.description,
        dimensions: {
          lengthCm: Number(g.lengthCm),
          widthCm: Number(g.widthCm),
          heightCm: Number(g.heightCm),
          volumeM3: Number(g.volumeM3),
          weightKg: Number(g.weightKg),
        },
        quantity: g.quantity,
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

    return {
      ...baseItem,
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

    // 2. Ambil seluruh data barang yang dipilih
    const goodsList = await this.prisma.goodsItem.findMany({
      where: {
        id: { in: dto.goodsItemIds },
      },
      include: {
        warehouse: true,
      },
    });

    if (goodsList.length !== dto.goodsItemIds.length) {
      throw new BadRequestException('Satu atau lebih ID barang tidak ditemukan dalam database');
    }

    // Pastikan seluruh barang milik Customer yang bersangkutan
    for (const g of goodsList) {
      if (g.customerId !== targetCustomerId) {
        throw new ForbiddenException(`Barang '${g.name}' bukan milik akun Customer yang dituju`);
      }
    }

    // 3. Kalkulasi total berat, total volume, dan kebutuhan Reefer
    let totalWeightKg = 0;
    let totalVolumeM3 = 0;
    let requiresReefer = false;
    const summaryParts: string[] = [];

    for (const g of goodsList) {
      totalWeightKg += Number(g.weightKg);
      totalVolumeM3 += Number(g.volumeM3);
      if (g.requiresColdStorage || g.category === GoodsCategory.COLD_FOOD) {
        requiresReefer = true;
      }
      summaryParts.push(`${g.quantity}x ${g.name}`);
    }

    totalWeightKg = Number(totalWeightKg.toFixed(2));
    totalVolumeM3 = Number(totalVolumeM3.toFixed(4));
    const goodsSummary = summaryParts.join(', ');

    // 4. Validasi Kendaraan (jika ditentukan)
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

    // 5. Generate Nomor Order Unik
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-2026-${randomHex}`;
    const initialStatus = dto.driverId
      ? OrderStatus.DRIVER_ASSIGNED
      : OrderStatus.PENDING_ASSIGNMENT;

    // 6. Eksekusi Transaksi Database Atomik
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
            create: dto.goodsItemIds.map((goodsId) => ({
              goodsId,
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
    this.validateRolePermissionOnOrder(currentUser.role, newStatus);

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
    });

    return this.findOrderById(order.id, currentUser);
  }

  /**
   * Upload Bukti Serah Terima Digital POD (Digital Signature, Foto Kargo, Rating)
   * dan pembebasan armada otomatis.
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
    });

    return this.findOrderById(order.id, currentUser);
  }

  // ===========================================================================
  // 3. PRIVATE HELPER METHODS
  // ===========================================================================

  private validateRolePermissionOnOrder(role: UserRole, newStatus: OrderStatus): void {
    if (role === UserRole.CUSTOMER) {
      const customerAllowed: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
      if (!customerAllowed.includes(newStatus)) {
        throw new ForbiddenException(
          `Pelanggan tidak memiliki izin untuk mengubah status pengiriman menjadi '${newStatus}'`,
        );
      }
    } else if (role === UserRole.DRIVER) {
      const driverAllowed: OrderStatus[] = [
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
    order: Prisma.DeliveryOrderGetPayload<{
      include: {
        customer: {
          select: { id: true; name: true; phone: true; companyName: true };
        };
        driver: {
          select: { id: true; name: true; phone: true };
        };
        vehicle: {
          select: {
            id: true;
            plateNumber: true;
            type: true;
            hasRefrigeration: true;
          };
        };
        orderItems: {
          select: { goodsId: true };
        };
      };
    }>,
  ): DeliveryOrderListItemDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      customerId: order.customerId,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      goodsItemIds: order.orderItems.map((oi) => oi.goodsId),
      goodsSummary: order.goodsSummary,
      totalVolumeM3: Number(order.totalVolumeM3),
      totalWeightKg: Number(order.totalWeightKg),
      requiresReefer: order.requiresReefer,
      originAddress: order.originAddress,
      originCity: order.originCity,
      destinationAddress: order.destinationAddress,
      destinationCity: order.destinationCity,
      scheduledDate: order.scheduledDate.toISOString().split('T')[0],
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
      rescheduledTime: order.rescheduledTime ? order.rescheduledTime.toISOString() : null,
      proofOfDeliveryUrl: order.proofOfDeliveryUrl,
      recipientName: order.recipientName,
      recipientSignature: order.recipientSignature,
      driverRating: order.driverRating ? Number(order.driverRating) : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
