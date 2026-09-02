import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  GoodsCategory,
  GoodsStorageStatus,
  MessageDeliveryChannel,
  MessageDeliveryStatus,
  NotificationCategory,
  OrderStatus,
  OrderType,
  Prisma,
  RelatedEntityType,
  UserRole,
  VehicleStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import {
  evaluateDriverEligibility,
  evaluateVehicleCompatibility,
  OrderCargoRequirement,
} from '../../common/utils/fleet-compatibility.util';
import { canInboundItem } from '../../common/utils/inventory-lifecycle.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { CreateDeliveryOrderDto } from './dto/create-order.dto';
import { CreateOrderMessageDto } from './dto/create-order-message.dto';
import { OrderMessageResponseDto } from './dto/order-message-response.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { DeliveryOrderDetailResponseDto, DeliveryOrderListItemDto } from './dto/order-response.dto';

import { ReceiveInboundDto } from './dto/receive-inbound.dto';
import { SubmitPodDto } from './dto/submit-pod.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';

import {
  ALLOWED_ORDER_TRANSITIONS,
  validateRolePermissionOnOrder,
} from './utils/logistics-state-machine.util';
import { mapToOrderListItemDto } from './utils/logistics-mapper.util';

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
        deliveryOrders: {
          where: {
            status: {
              in: [
                OrderStatus.DRIVER_ASSIGNED,
                OrderStatus.EN_ROUTE_PICKUP,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.ARRIVED_DESTINATION,
              ],
            },
          },
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
      activeOrdersCount: v.deliveryOrders ? v.deliveryOrders.length : 0,
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
        'Only Admins are authorized to assign drivers to fleet vehicles',
      );
    }

    const [vehicle, driver] = await Promise.all([
      this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      }),
      this.prisma.user.findUnique({
        where: { id: dto.driverId },
        include: {
          driverOrders: {
            where: {
              status: {
                in: [
                  OrderStatus.DRIVER_ASSIGNED,
                  OrderStatus.EN_ROUTE_PICKUP,
                  OrderStatus.PICKED_UP,
                  OrderStatus.IN_TRANSIT,
                  OrderStatus.ARRIVED_DESTINATION,
                ],
              },
            },
          },
        },
      }),
    ]);

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${dto.vehicleId}' not found`);
    }

    if (!driver || driver.role !== UserRole.DRIVER) {
      throw new NotFoundException(
        `Driver with ID '${dto.driverId}' not found or does not have DRIVER role`,
      );
    }

    const driverEligibility = evaluateDriverEligibility({
      id: driver.id,
      name: driver.name,
      role: driver.role,
      status: driver.status,
      driverLicenseNumber: driver.driverLicenseNumber,
      driverLicenseExpiry: driver.driverLicenseExpiry,
      activeOrdersCount: driver.driverOrders ? driver.driverOrders.length : 0,
    });

    if (!driverEligibility.isEligible || !driverEligibility.isSelectable) {
      throw new BadRequestException(
        `Driver '${driver.name}' cannot be assigned: ${driverEligibility.reason}`,
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
      activeOrdersCount: 0,
      currentDriverId: updated.currentDriverId,
      currentDriverName: updated.driver?.name || null,
      currentDriverPhone: updated.driver?.phone || null,
      locationCity: updated.locationCity,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Helper terpusat untuk memvalidasi kompatibilitas armada dan kelayakan pengemudi terhadap kargo order.
   */
  async validateDriverAndVehicleForOrder(
    orderReq: {
      id?: string;
      orderNumber?: string;
      requiresReefer: boolean;
      totalVolumeM3: Prisma.Decimal | number;
      totalWeightKg: Prisma.Decimal | number;
      goodsSummary?: string;
    },
    vehicleId?: string | null,
    driverId?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<{ vehicle?: any; driver?: any }> {
    const db = tx || this.prisma;
    const activeOrderStatuses: OrderStatus[] = [
      OrderStatus.DRIVER_ASSIGNED,
      OrderStatus.EN_ROUTE_PICKUP,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.ARRIVED_DESTINATION,
    ];

    let vehicle: any = null;
    if (vehicleId) {
      vehicle = await db.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          deliveryOrders: {
            where: {
              status: { in: activeOrderStatuses },
              ...(orderReq.id ? { id: { not: orderReq.id } } : {}),
            },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID '${vehicleId}' not found`);
      }

      const activeOrdersCount = vehicle.deliveryOrders ? vehicle.deliveryOrders.length : 0;
      const cargoReq: OrderCargoRequirement = {
        requiresReefer: orderReq.requiresReefer,
        totalVolumeM3: Number(orderReq.totalVolumeM3),
        totalWeightKg: Number(orderReq.totalWeightKg),
        requiredTempCelsius: orderReq.requiresReefer ? -18 : null,
      };

      const compat = evaluateVehicleCompatibility(
        {
          id: vehicle.id,
          plateNumber: vehicle.plateNumber,
          name: vehicle.name,
          type: vehicle.type,
          maxWeightKg: Number(vehicle.maxWeightKg),
          maxVolumeM3: Number(vehicle.maxVolumeM3),
          hasRefrigeration: vehicle.hasRefrigeration,
          minTempCelsius: vehicle.minTempCelsius ? Number(vehicle.minTempCelsius) : null,
          status: vehicle.status,
          activeOrdersCount,
        },
        cargoReq,
      );

      if (!compat.isCompatible || !compat.isSelectable) {
        throw new BadRequestException(
          `Vehicle ${vehicle.plateNumber} is not eligible for this order. ${compat.reason}`,
        );
      }
    }

    let driver: any = null;
    if (driverId) {
      driver = await db.user.findUnique({
        where: { id: driverId },
        include: {
          driverOrders: {
            where: {
              status: { in: activeOrderStatuses },
              ...(orderReq.id ? { id: { not: orderReq.id } } : {}),
            },
          },
        },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID '${driverId}' not found`);
      }

      const activeDriverOrdersCount = driver.driverOrders ? driver.driverOrders.length : 0;
      const eligibility = evaluateDriverEligibility({
        id: driver.id,
        name: driver.name,
        role: driver.role,
        status: driver.status,
        driverLicenseNumber: driver.driverLicenseNumber,
        driverLicenseExpiry: driver.driverLicenseExpiry,
        activeOrdersCount: activeDriverOrdersCount,
      });

      if (!eligibility.isEligible || !eligibility.isSelectable) {
        throw new BadRequestException(
          `Driver ${driver.name} is not eligible for this assignment. ${eligibility.reason}`,
        );
      }
    }

    return { vehicle, driver };
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
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
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
    const items = orders.map((o) => mapToOrderListItemDto(o));

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
        messages: {
          orderBy: { createdAt: 'desc' },
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
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    // Tenant Isolation / Anti-IDOR Enforcement
    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    if (
      currentUser.role === UserRole.DRIVER &&
      order.driverId !== currentUser.id &&
      order.driverId !== null
    ) {
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    const baseItem = mapToOrderListItemDto(order);

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

    const messages: OrderMessageResponseDto[] = (order.messages || []).map((m) => ({
      id: m.id,
      orderId: m.orderId,
      customerId: m.customerId,
      senderId: m.senderId || null,
      senderName: m.senderName,
      senderRole: m.senderRole,
      messageType: m.messageType,
      title: m.title,
      content: m.content,
      channel: m.channel,
      status: m.status,
      isRead: m.isRead,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      ...baseItem,
      totalPackages,
      customer: order.customer,
      driver: order.driver,
      vehicle: order.vehicle,
      items,
      messages,
    };
  }

  /**
   * Pembuatan Delivery Order / Surat Jalan Inbound atau Outbound dalam transaksi atomik.
   */
  async createOrder(
    dto: CreateDeliveryOrderDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    // 0. Enforce Demo Portfolio Limit (Maximum 10 Delivery Orders)
    const MAX_DEMO_ORDERS_LIMIT = 10;
    const currentOrdersCount = await this.prisma.deliveryOrder.count();
    if (currentOrdersCount >= MAX_DEMO_ORDERS_LIMIT) {
      throw new BadRequestException(
        `Demo limit reached. Maximum ${MAX_DEMO_ORDERS_LIMIT} delivery orders are allowed in this demo environment.`,
      );
    }

    // 1. Determine order owner
    let targetCustomerId: string;
    if (currentUser.role === UserRole.CUSTOMER) {
      targetCustomerId = currentUser.id;
    } else if (currentUser.role === UserRole.ADMIN) {
      targetCustomerId = dto.customerId || currentUser.id;
    } else {
      throw new ForbiddenException(
        'Only Customers or Admins are authorized to create Delivery Orders',
      );
    }

    // 2. Determine goods IDs
    const goodsIds =
      dto.items && dto.items.length > 0
        ? Array.from(new Set(dto.items.map((i) => i.goodsId)))
        : dto.goodsItemIds || [];

    if (goodsIds.length === 0) {
      throw new BadRequestException(
        'Must include at least 1 goods item to create a delivery order',
      );
    }

    // 3. Fetch goods from database
    const goodsList = await this.prisma.goodsItem.findMany({
      where: {
        id: { in: goodsIds },
      },
      include: {
        warehouse: true,
      },
    });

    if (goodsList.length !== goodsIds.length) {
      throw new BadRequestException('One or more goods IDs were not found in the database');
    }

    // 4. Ensure tenant isolation & lifecycle checks
    for (const g of goodsList) {
      if (g.customerId !== targetCustomerId) {
        throw new ForbiddenException(
          `Goods '${g.name}' do not belong to the target Customer account`,
        );
      }

      // Check Cancelled State (Terminated)
      if (g.status === GoodsStorageStatus.CANCELLED) {
        throw new BadRequestException(
          `Inventory item '${g.name}' is cancelled and cannot be processed.`,
        );
      }

      // Inbound vs Outbound strict eligibility checks
      if (dto.type === OrderType.PICKUP) {
        if (!canInboundItem(g.status)) {
          throw new BadRequestException(
            `Inventory item '${g.name}' cannot be processed for inbound pickup (current status: '${g.status}'). Only items with status 'DRAFT' or 'PENDING_PICKUP' are allowed.`,
          );
        }
      } else if (dto.type === OrderType.DELIVERY) {
        if (g.status !== GoodsStorageStatus.STORED) {
          throw new BadRequestException(
            `Not available for outbound — inventory '${g.name}' has not been stored in the warehouse rack yet (current status: '${g.status}'). Only stored items can be dispatched.`,
          );
        }
        if (!g.slotId) {
          throw new BadRequestException(
            `Inventory item '${g.name}' has not been allocated to a storage rack slot yet.`,
          );
        }
        if (g.quantity <= 0) {
          throw new BadRequestException(
            `Inventory item '${g.name}' has no available stock for outbound dispatch.`,
          );
        }
      }
    }

    // 5. Warehouse Isolation Validation
    if (dto.warehouseId) {
      for (const g of goodsList) {
        if (g.warehouseId !== dto.warehouseId) {
          throw new BadRequestException(
            `Goods '${g.name}' is located in warehouse '${g.warehouse.name}', not the selected facility`,
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

    // 8. Validasi Kompatibilitas Kendaraan & Driver Terpusat
    if (dto.vehicleId || dto.driverId) {
      await this.validateDriverAndVehicleForOrder(
        {
          requiresReefer,
          totalVolumeM3,
          totalWeightKg,
          goodsSummary,
        },
        dto.vehicleId,
        dto.driverId,
      );
    }

    // 9. Generate Nomor Order Unik
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-2026-${randomHex}`;
    const initialStatus = dto.driverId
      ? OrderStatus.DRIVER_ASSIGNED
      : OrderStatus.PENDING_ASSIGNMENT;

    // 10. Eksekusi Transaksi Database Atomik
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 10.0 Concurrency Control: Exclusive row-level locking on GoodsItem rows in PostgreSQL
      // Ensures two concurrent requests cannot double-reserve or claim the same physical inventory.
      for (const g of goodsList) {
        if (typeof tx.$queryRaw === 'function') {
          await tx.$queryRaw`SELECT id, quantity FROM "goods_items" WHERE id = ${g.id} FOR UPDATE`;
        }
      }

      // 10.1 Active Reservation Enforcement (Inbound & Outbound Duplicate Prevention)
      const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
        OrderStatus.PENDING_ASSIGNMENT,
        OrderStatus.DRIVER_ASSIGNED,
        OrderStatus.EN_ROUTE_PICKUP,
        OrderStatus.PICKED_UP,
        OrderStatus.IN_TRANSIT,
        OrderStatus.ARRIVED_DESTINATION,
        OrderStatus.DELAYED,
      ];

      for (const g of goodsList) {
        const reqQty = requestedQtyMap.get(g.id) || g.quantity;

        if (dto.type === OrderType.PICKUP) {
          // Check active Inbound reservations
          const activeInboundItems = tx.orderItem
            ? await tx.orderItem.findMany({
                where: {
                  goodsId: g.id,
                  order: {
                    type: OrderType.PICKUP,
                    status: { in: ACTIVE_ORDER_STATUSES },
                  },
                },
                select: { quantity: true, order: { select: { orderNumber: true } } },
              })
            : [];

          const reservedQty = activeInboundItems.reduce((acc, it) => acc + it.quantity, 0);
          const availableInboundQty = Math.max(0, g.quantity - reservedQty);

          if (availableInboundQty <= 0) {
            const activeOrderNos = activeInboundItems.map((it) => it.order.orderNumber).join(', ');
            throw new ConflictException(
              `Goods '${g.name}' (${g.barcode}) is already fully reserved by active inbound order(s) [${activeOrderNos}]. No available packages remain to create a new inbound shipment.`,
            );
          }

          if (reqQty > availableInboundQty) {
            throw new ConflictException(
              `Insufficient available package quantity for '${g.name}'. Total registered: ${g.quantity} ${g.unit || 'packages'}, already reserved in active inbound orders: ${reservedQty}, available: ${availableInboundQty}, requested: ${reqQty}.`,
            );
          }
        } else if (dto.type === OrderType.DELIVERY) {
          // Check active Outbound reservations
          const activeOutboundItems = tx.orderItem
            ? await tx.orderItem.findMany({
                where: {
                  goodsId: g.id,
                  order: {
                    type: OrderType.DELIVERY,
                    status: { in: ACTIVE_ORDER_STATUSES },
                  },
                },
                select: { quantity: true, order: { select: { orderNumber: true } } },
              })
            : [];

          const reservedOutboundQty = activeOutboundItems.reduce((acc, it) => acc + it.quantity, 0);
          const availableStoredQty = Math.max(0, g.quantity - reservedOutboundQty);

          if (availableStoredQty <= 0) {
            const activeOrderNos = activeOutboundItems.map((it) => it.order.orderNumber).join(', ');
            throw new ConflictException(
              `Goods '${g.name}' (${g.barcode}) is already fully reserved by active outbound delivery order(s) [${activeOrderNos}]. No available inventory remains to dispatch.`,
            );
          }

          if (reqQty > availableStoredQty) {
            throw new ConflictException(
              `Insufficient available inventory for '${g.name}'. Current stored: ${g.quantity} ${g.unit || 'units'}, already reserved in active outbound orders: ${reservedOutboundQty}, available: ${availableStoredQty}, requested: ${reqQty}.`,
            );
          }
        }
      }

      // Concurrency check for vehicle & driver within transaction
      if (dto.vehicleId) {
        const conflictOrder = await tx.deliveryOrder.findFirst({
          where: {
            vehicleId: dto.vehicleId,
            status: {
              in: [
                OrderStatus.DRIVER_ASSIGNED,
                OrderStatus.EN_ROUTE_PICKUP,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.ARRIVED_DESTINATION,
              ],
            },
          },
        });
        if (conflictOrder) {
          throw new BadRequestException(
            `Double assignment prevented: Vehicle is already assigned to active order '#${conflictOrder.orderNumber}'.`,
          );
        }
      }

      if (dto.driverId) {
        const conflictDriverOrder = await tx.deliveryOrder.findFirst({
          where: {
            driverId: dto.driverId,
            status: {
              in: [
                OrderStatus.DRIVER_ASSIGNED,
                OrderStatus.EN_ROUTE_PICKUP,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.ARRIVED_DESTINATION,
              ],
            },
          },
        });
        if (conflictDriverOrder) {
          throw new BadRequestException(
            `Double assignment prevented: Driver is already assigned to active order '#${conflictDriverOrder.orderNumber}'.`,
          );
        }
      }

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

      // Synchronize GoodsItem status to PENDING_PICKUP for Inbound orders
      if (dto.type === OrderType.PICKUP) {
        for (const g of goodsList) {
          if (g.status === GoodsStorageStatus.DRAFT) {
            await tx.goodsItem.update({
              where: { id: g.id },
              data: { status: GoodsStorageStatus.PENDING_PICKUP },
            });
          }
        }
      }

      // Update status kendaraan menjadi IN_SERVICE jika sudah dialokasikan
      if (dto.vehicleId) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: {
            status: VehicleStatus.IN_SERVICE,
            currentDriverId: dto.driverId || undefined,
          },
        });
      }

      // Emit Transactional Notifications: Customer & All Admins
      await this.notificationsService.createNotification(
        {
          recipientUserId: targetCustomerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Delivery Request Created',
          message: `Delivery order #${order.orderNumber} (${dto.type}) successfully submitted for route ${dto.originCity} → ${dto.destinationCity}.`,
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
          title: 'New Delivery Request',
          message: `New order #${order.orderNumber} (${goodsSummary}) is awaiting driver and fleet assignment.`,
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
            title: 'New Delivery Assignment',
            message: `You have been assigned to delivery #${order.orderNumber} (${dto.originCity} → ${dto.destinationCity}).`,
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
   * Updates Delivery Order status in a controlled State Machine workflow.
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
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    // Tenant Isolation / Anti-IDOR Enforcement
    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    const currentStatus = order.status;
    const newStatus = dto.status;

    // 1. Role Permission Validation
    validateRolePermissionOnOrder(currentUser.role, newStatus, order.type);

    // 2. State Machine Validation
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Order status transition from '${currentStatus}' to '${newStatus}' is not allowed.`,
      );
    }

    // 2.5 Fleet & Driver Compatibility Validation if assigning or changing vehicle/driver
    const targetVehicleId = dto.vehicleId !== undefined ? dto.vehicleId : order.vehicleId;
    const targetDriverId = dto.driverId !== undefined ? dto.driverId : order.driverId;

    if (newStatus === OrderStatus.DRIVER_ASSIGNED || dto.vehicleId || dto.driverId) {
      if (newStatus === OrderStatus.DRIVER_ASSIGNED) {
        if (!targetVehicleId) {
          throw new BadRequestException('Dispatch assignment requires a valid Vehicle ID.');
        }
        if (!targetDriverId) {
          throw new BadRequestException('Dispatch assignment requires a valid Driver ID.');
        }
      }

      if (targetVehicleId || targetDriverId) {
        await this.validateDriverAndVehicleForOrder(
          {
            id: order.id,
            orderNumber: order.orderNumber,
            requiresReefer: order.requiresReefer,
            totalVolumeM3: order.totalVolumeM3,
            totalWeightKg: order.totalWeightKg,
            goodsSummary: order.goodsSummary,
          },
          targetVehicleId,
          targetDriverId,
        );
      }
    }

    // 3. Eksekusi Pembaruan Status dalam Transaksi
    await this.prisma.$transaction(async (tx) => {
      // Concurrency check for vehicle & driver within transaction
      if (targetVehicleId && (newStatus === OrderStatus.DRIVER_ASSIGNED || dto.vehicleId)) {
        const conflictOrder = await tx.deliveryOrder.findFirst({
          where: {
            vehicleId: targetVehicleId,
            id: { not: order.id },
            status: {
              in: [
                OrderStatus.DRIVER_ASSIGNED,
                OrderStatus.EN_ROUTE_PICKUP,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.ARRIVED_DESTINATION,
              ],
            },
          },
        });
        if (conflictOrder) {
          throw new BadRequestException(
            `Double assignment prevented: Vehicle is already assigned to active order '#${conflictOrder.orderNumber}'.`,
          );
        }
      }

      if (targetDriverId && (newStatus === OrderStatus.DRIVER_ASSIGNED || dto.driverId)) {
        const conflictDriverOrder = await tx.deliveryOrder.findFirst({
          where: {
            driverId: targetDriverId,
            id: { not: order.id },
            status: {
              in: [
                OrderStatus.DRIVER_ASSIGNED,
                OrderStatus.EN_ROUTE_PICKUP,
                OrderStatus.PICKED_UP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.ARRIVED_DESTINATION,
              ],
            },
          },
        });
        if (conflictDriverOrder) {
          throw new BadRequestException(
            `Double assignment prevented: Driver is already assigned to active order '#${conflictDriverOrder.orderNumber}'.`,
          );
        }
      }

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
      if (targetVehicleId && newStatus === OrderStatus.DRIVER_ASSIGNED) {
        await tx.vehicle.update({
          where: { id: targetVehicleId },
          data: {
            status: VehicleStatus.IN_SERVICE,
            currentDriverId: targetDriverId || undefined,
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

      // Synchronize associated GoodsItem status for Inbound Pickup Orders
      if (order.type === OrderType.PICKUP) {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
          include: { goods: true },
        });

        if (
          newStatus === OrderStatus.DRIVER_ASSIGNED ||
          newStatus === OrderStatus.EN_ROUTE_PICKUP
        ) {
          for (const item of orderItems) {
            if (item.goods.status === GoodsStorageStatus.DRAFT) {
              await tx.goodsItem.update({
                where: { id: item.goodsId },
                data: { status: GoodsStorageStatus.PENDING_PICKUP },
              });
            }
          }
        } else if (newStatus === OrderStatus.PICKED_UP || newStatus === OrderStatus.IN_TRANSIT) {
          for (const item of orderItems) {
            if (
              item.goods.status === GoodsStorageStatus.DRAFT ||
              item.goods.status === GoodsStorageStatus.PENDING_PICKUP
            ) {
              await tx.goodsItem.update({
                where: { id: item.goodsId },
                data: { status: GoodsStorageStatus.IN_TRANSIT_INBOUND },
              });
              await tx.goodsMutation.create({
                data: {
                  goodsId: item.goodsId,
                  status: GoodsStorageStatus.IN_TRANSIT_INBOUND,
                  title: 'Inbound Cargo In Transit',
                  description: `Cargo has been picked up by driver and is in transit to the warehouse facility.`,
                  actorId: currentUser.id,
                  actorName: currentUser.name,
                  actorRole: currentUser.role,
                  location: `In Transit (${order.originCity} → ${order.destinationCity})`,
                  timestamp: new Date(),
                },
              });
            }
          }
        } else if (newStatus === OrderStatus.CANCELLED) {
          for (const item of orderItems) {
            if (
              item.goods.status === GoodsStorageStatus.PENDING_PICKUP ||
              item.goods.status === GoodsStorageStatus.IN_TRANSIT_INBOUND
            ) {
              await tx.goodsItem.update({
                where: { id: item.goodsId },
                data: { status: GoodsStorageStatus.DRAFT },
              });
              await tx.goodsMutation.create({
                data: {
                  goodsId: item.goodsId,
                  status: GoodsStorageStatus.DRAFT,
                  title: 'Inbound Order Cancelled (Reservation Released)',
                  description: `Delivery order #${order.orderNumber} was cancelled. Goods status reverted to DRAFT and reserved packages were released.`,
                  actorId: currentUser.id,
                  actorName: currentUser.name,
                  actorRole: currentUser.role,
                  location: 'Customer Origin Facility',
                  timestamp: new Date(),
                },
              });
            }
          }
        }
      }

      // Transactional Notifications Based on Status Changes
      if (newStatus === OrderStatus.DRIVER_ASSIGNED) {
        const driverId = dto.driverId || order.driverId;
        if (driverId) {
          await this.notificationsService.createNotification(
            {
              recipientUserId: driverId,
              recipientRole: UserRole.DRIVER,
              title: 'Delivery Task Assigned',
              message: `You have been assigned to carry out delivery #${order.orderNumber}.`,
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
            title: 'Driver & Fleet Assigned',
            message: `Shipment #${order.orderNumber} has been assigned to driver. Please monitor pickup and transit schedule.`,
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
            title: `Shipment Status: ${newStatus}`,
            message: `Delivery order #${order.orderNumber} status has been updated to ${newStatus}.`,
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
            title: `Shipment Status: Arrived at Destination`,
            message: `Delivery order #${order.orderNumber} has arrived at destination location (${order.destinationCity}).`,
            category: NotificationCategory.DELIVERY_ARRIVED,
            relatedEntityId: order.id,
            relatedEntityType: RelatedEntityType.ORDER,
            actionUrl: '/customer/logistics/tracking',
          },
          tx,
        );

        // If Inbound Pickup, notify Warehouse Admins for receiving process
        if (order.type === OrderType.PICKUP) {
          await this.notificationsService.notifyRole(
            UserRole.ADMIN,
            {
              title: 'Inbound Shipment Arrived at Warehouse',
              message: `Inbound shipment #${order.orderNumber} has arrived at loading dock and is awaiting receiving verification.`,
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
              title: 'Delivery Receipt Confirmed',
              message: `Customer has confirmed receipt of delivery #${order.orderNumber}. Task completed!`,
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
            title: 'Order Confirmed Completed',
            message: `Delivery order #${order.orderNumber} has been confirmed by customer.`,
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
   * Receives and verifies inbound goods at the warehouse loading dock (Admin Receiving).
   */
  async receiveInboundOrder(
    id: string,
    dto: ReceiveInboundDto,
    currentUser: AuthenticatedUser,
  ): Promise<DeliveryOrderDetailResponseDto> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only Admin or Warehouse Staff are authorized to perform inbound receiving',
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
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    if (order.type !== OrderType.PICKUP) {
      throw new BadRequestException(
        'Receiving process is only applicable for Inbound Pickup orders',
      );
    }

    if (order.status !== OrderStatus.ARRIVED_DESTINATION) {
      throw new BadRequestException(
        `Receiving rejected. Driver must arrive physically at the warehouse loading dock (status: ARRIVED_DESTINATION) before receiving verification can be performed. Current status: '${order.status}'.`,
      );
    }

    // Ensure no goods are CANCELLED
    for (const item of order.orderItems) {
      if (item.goods.status === GoodsStorageStatus.CANCELLED) {
        throw new BadRequestException(
          `Inventory item '${item.goods.name}' is cancelled and cannot be processed.`,
        );
      }
    }

    // Calculate expected quantity vs verified quantity
    const expectedQuantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCounted = dto.receivedQuantity + dto.damagedQuantity + dto.missingQuantity;

    if (totalCounted !== expectedQuantity) {
      throw new BadRequestException(
        `Physical verification total (${totalCounted}: ${dto.receivedQuantity} received, ${dto.damagedQuantity} damaged, ${dto.missingQuantity} missing) does not match order manifest total (${expectedQuantity}).`,
      );
    }

    // Execute Receiving in Atomic Database Transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Update order status to DELIVERED (Received at Warehouse)
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

      // 2. Free vehicle to AVAILABLE
      if (order.vehicleId) {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      // 3. Update associated goods status to INSPECTING (Put-Away Pending)
      for (const item of order.orderItems) {
        await tx.goodsItem.update({
          where: { id: item.goodsId },
          data: {
            status: GoodsStorageStatus.INSPECTING,
          },
        });

        // 4. Record mutation history to Receiving Dock
        const warehouseName = item.goods.warehouse?.name || 'Logistics Hub';
        await tx.goodsMutation.create({
          data: {
            goodsId: item.goodsId,
            status: GoodsStorageStatus.INSPECTING,
            title: 'Inbound Receiving Completed (Put-Away Pending)',
            description: `Cargo arrived at loading dock and verified by Admin (${currentUser.name}). Condition: ${dto.condition}. Received: ${dto.receivedQuantity}, Damaged: ${dto.damagedQuantity}, Missing: ${dto.missingQuantity}. Notes: ${dto.receivingNotes || '-'}. Awaiting rack slot put-away.`,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorRole: currentUser.role,
            location: `${warehouseName} — Receiving Dock`,
            timestamp: new Date(),
          },
        });
      }

      // 5. Emit Notification to Admins (Put-Away Required)
      const targetWarehouseName = order.orderItems[0]?.goods?.warehouse?.name || 'Main Warehouse';
      await this.notificationsService.notifyRole(
        UserRole.ADMIN,
        {
          title: 'Inbound Received — Put-Away Required',
          message: `Inbound shipment #${order.orderNumber} successfully received at ${targetWarehouseName}.\nReceived: ${dto.receivedQuantity} | Damaged: ${dto.damagedQuantity} | Missing: ${dto.missingQuantity}.\nCondition: ${dto.condition}. Please proceed with Put-Away storage.`,
          category: NotificationCategory.GOODS_INSPECTED,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: '/admin/goods',
        },
        tx,
      );

      // 6. Emit Notification to Customer Owner
      await this.notificationsService.createNotification(
        {
          recipientUserId: order.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Goods Received at Warehouse',
          message: `Your goods from shipment #${order.orderNumber} have arrived at ${targetWarehouseName} and were verified (Received: ${dto.receivedQuantity}, Damaged: ${dto.damagedQuantity}, Missing: ${dto.missingQuantity}). Status: Awaiting Put-Away.`,
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
   * Submits Proof of Delivery (Digital POD) and frees vehicle (Applicable for Outbound Delivery).
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
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    if (order.type === OrderType.PICKUP) {
      throw new BadRequestException(
        'Inbound shipments do not require customer POD. The receiving process is handled by Warehouse Admins via Inbound Receiving.',
      );
    }

    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order with ID or number '${id}' not found`);
    }

    // Execute Submit POD in atomic database transaction
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

      // Free vehicle to AVAILABLE
      if (order.vehicleId) {
        await tx.vehicle.update({
          where: { id: order.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }

      // Emit POD Notifications to Customer and Admin
      await this.notificationsService.createNotification(
        {
          recipientUserId: order.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: 'Shipment Delivered (Digital POD Issued)',
          message: `Shipment #${order.orderNumber} has been delivered to ${dto.recipientName}. Please check proof of delivery.`,
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
          title: 'Shipment POD Issued',
          message: `Driver has completed delivery #${order.orderNumber} (Recipient: ${dto.recipientName}).`,
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
  // 3. CUSTOMER COMMUNICATION & ORDER MESSAGES
  // ===========================================================================

  /**
   * Mengirim pesan / update komunikasi dari Dispatcher ke Customer terkait Delivery Order.
   */
  async createOrderMessage(
    orderId: string,
    dto: CreateOrderMessageDto,
    currentUser: AuthenticatedUser,
  ): Promise<OrderMessageResponseDto> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order with ID or number '${orderId}' not found`);
    }

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only Admins / Dispatchers are authorized to send customer communications.',
      );
    }

    const channel = dto.channel || MessageDeliveryChannel.IN_APP;

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.deliveryOrderMessage.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          messageType: dto.messageType,
          title: dto.title,
          content: dto.content,
          channel,
          status: MessageDeliveryStatus.SENT,
          isRead: false,
        },
      });

      // Emit In-App System Notification for Customer
      await this.notificationsService.createNotification(
        {
          recipientUserId: order.customerId,
          recipientRole: UserRole.CUSTOMER,
          title: dto.title,
          message: dto.content,
          category: NotificationCategory.ORDER_MESSAGE,
          relatedEntityId: order.id,
          relatedEntityType: RelatedEntityType.ORDER,
          actionUrl: `/customer/logistics/tracking?orderId=${order.id}`,
        },
        tx,
      );

      return msg;
    });

    return {
      id: message.id,
      orderId: message.orderId,
      customerId: message.customerId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      messageType: message.messageType,
      title: message.title,
      content: message.content,
      channel: message.channel,
      status: message.status,
      isRead: message.isRead,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Mengambil riwayat pesan / komunikasi pada Delivery Order tertentu.
   */
  async findOrderMessages(
    orderId: string,
    currentUser: AuthenticatedUser,
  ): Promise<OrderMessageResponseDto[]> {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      throw new NotFoundException(`Delivery Order with ID or number '${orderId}' not found`);
    }

    // Tenant Isolation
    if (currentUser.role === UserRole.CUSTOMER && order.customerId !== currentUser.id) {
      throw new NotFoundException(`Delivery Order with ID or number '${orderId}' not found`);
    }

    if (
      currentUser.role === UserRole.DRIVER &&
      order.driverId !== currentUser.id &&
      order.driverId !== null
    ) {
      throw new NotFoundException(`Delivery Order with ID or number '${orderId}' not found`);
    }

    const messages = await this.prisma.deliveryOrderMessage.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((m) => ({
      id: m.id,
      orderId: m.orderId,
      customerId: m.customerId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole,
      messageType: m.messageType,
      title: m.title,
      content: m.content,
      channel: m.channel,
      status: m.status,
      isRead: m.isRead,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  /**
   * Menandai pesan order telah dibaca oleh customer.
   */
  async markOrderMessageAsRead(
    orderId: string,
    messageId: string,
    currentUser: AuthenticatedUser,
  ): Promise<OrderMessageResponseDto> {
    const message = await this.prisma.deliveryOrderMessage.findUnique({
      where: { id: messageId },
      include: { order: true },
    });

    if (!message || (message.orderId !== orderId && message.order.orderNumber !== orderId)) {
      throw new NotFoundException(`Order Message with ID '${messageId}' not found`);
    }

    if (currentUser.role === UserRole.CUSTOMER && message.customerId !== currentUser.id) {
      throw new ForbiddenException('You can only mark your own messages as read.');
    }

    const updated = await this.prisma.deliveryOrderMessage.update({
      where: { id: message.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Synchronize corresponding SystemNotification record for this message as read
    await this.prisma.systemNotification.updateMany({
      where: {
        recipientUserId: message.customerId,
        relatedEntityId: message.orderId,
        title: message.title,
        category: NotificationCategory.ORDER_MESSAGE,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      id: updated.id,
      orderId: updated.orderId,
      customerId: updated.customerId,
      senderId: updated.senderId,
      senderName: updated.senderName,
      senderRole: updated.senderRole,
      messageType: updated.messageType,
      title: updated.title,
      content: updated.content,
      channel: updated.channel,
      status: updated.status,
      isRead: updated.isRead,
      readAt: updated.readAt ? updated.readAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
