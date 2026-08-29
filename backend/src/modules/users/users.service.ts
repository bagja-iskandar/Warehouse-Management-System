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
  OrderStatus,
  Prisma,
  SlotStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UserProfileDto } from '../auth/dto/auth-response.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface CustomerDetailDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl: string | null;
  companyName: string | null;
  address: string | null;
  status: UserStatus;
  createdAt: string;
  totalGoodsCount: number;
  storedGoodsCount: number;
  totalVolumeM3: number;
  totalInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalBilledAmount: number;
  recentGoods: Array<{
    id: string;
    barcode: string;
    name: string;
    quantity: number;
    unit: string;
    volumeM3: number;
    status: string;
    warehouseName: string;
    slotCode: string | null;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    billingMonth: string;
    totalAmount: number;
    status: string;
    dueDate: string;
  }>;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Memperbarui informasi profil pengguna dengan kontrol akses RBAC.
   */
  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserProfileDto> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You do not have permission to modify another user profile');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl.trim() }),
      },
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      companyName: updatedUser.companyName,
      address: updatedUser.address,
      status: updatedUser.status,
      driverLicenseNumber: updatedUser.driverLicenseNumber,
      driverLicenseExpiry: updatedUser.driverLicenseExpiry
        ? updatedUser.driverLicenseExpiry.toISOString()
        : null,
      createdAt: updatedUser.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves all users (Admin only).
   */
  async findAll(currentUser: AuthenticatedUser): Promise<UserProfileDto[]> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to view all users');
    }

    const users = await this.prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      companyName: u.companyName,
      address: u.address,
      status: u.status,
      driverLicenseNumber: u.driverLicenseNumber,
      driverLicenseExpiry: u.driverLicenseExpiry ? u.driverLicenseExpiry.toISOString() : null,
      activeOrdersCount: u.driverOrders ? u.driverOrders.length : 0,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  /**
   * Retrieves customer directory (Admin only) with live aggregated PostgreSQL metrics.
   */
  async findCustomers(currentUser: AuthenticatedUser): Promise<CustomerDetailDto[]> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to view customer directory');
    }

    const customers = await this.prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      include: {
        goodsItems: {
          include: {
            warehouse: { select: { name: true } },
            slot: { select: { code: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        customerInvoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const storedGoods = c.goodsItems.filter((g) => g.status === GoodsStorageStatus.STORED);
      const totalVolM3 = Number(
        c.goodsItems.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2),
      );
      const totalBilled = Number(
        c.customerInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      );
      const unpaidCount = c.customerInvoices.filter(
        (inv) =>
          inv.status === InvoiceStatus.UNPAID ||
          inv.status === InvoiceStatus.OVERDUE ||
          inv.status === InvoiceStatus.PENDING_PAYMENT,
      ).length;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        role: c.role,
        phone: c.phone,
        avatarUrl: c.avatarUrl,
        companyName: c.companyName,
        address: c.address,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        totalGoodsCount: c.goodsItems.length,
        storedGoodsCount: storedGoods.length,
        totalVolumeM3: totalVolM3,
        totalInvoicesCount: c.customerInvoices.length,
        unpaidInvoicesCount: unpaidCount,
        totalBilledAmount: totalBilled,
        recentGoods: c.goodsItems.slice(0, 5).map((g) => ({
          id: g.id,
          barcode: g.barcode,
          name: g.name,
          quantity: g.quantity,
          unit: g.unit,
          volumeM3: Number(g.volumeM3),
          status: g.status,
          warehouseName: g.warehouse.name,
          slotCode: g.slot?.code || null,
        })),
        recentInvoices: c.customerInvoices.slice(0, 5).map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          billingMonth: inv.billingMonth,
          totalAmount: Number(inv.totalAmount),
          status: inv.status,
          dueDate: inv.dueDate.toISOString(),
        })),
      };
    });
  }

  /**
   * Retrieves user detail by ID.
   */
  async findById(id: string, currentUser: AuthenticatedUser): Promise<UserProfileDto> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You do not have permission to view another user profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      companyName: user.companyName,
      address: user.address,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Updates user profile data (Admin or self).
   */
  async updateUser(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<UserProfileDto> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You do not have permission to modify another user profile');
    }

    if (dto.status !== undefined && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to modify user operational status');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Ensure email is unique if changed
    if (dto.email && dto.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (emailTaken) {
        throw new BadRequestException('Email address is already registered by another user');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(dto.companyName !== undefined && { companyName: dto.companyName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
        ...(dto.address !== undefined && { address: dto.address.trim() }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl.trim() }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl,
      companyName: updated.companyName,
      address: updated.address,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Deletes user account with transactional cascading clean-up (Admin only).
   */
  async deleteUser(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string; deletedId: string }> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admins are authorized to delete user accounts');
    }

    if (currentUser.id === id) {
      throw new BadRequestException('You cannot delete the active Admin account currently in use');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        goodsItems: { select: { id: true, slotId: true, warehouseId: true, status: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Record affected slots and warehouses for capacity recalculation
    const affectedSlotIds = Array.from(
      new Set(user.goodsItems.map((g) => g.slotId).filter((s): s is string => Boolean(s))),
    );
    const affectedWarehouseIds = Array.from(new Set(user.goodsItems.map((g) => g.warehouseId)));
    const goodsIds = user.goodsItems.map((g) => g.id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Hapus Goods Mutations
      if (goodsIds.length > 0) {
        await tx.goodsMutation.deleteMany({
          where: { goodsId: { in: goodsIds } },
        });
      }
      // Hapus mutasi yang dicatat oleh user ini sebagai actor
      await tx.goodsMutation.deleteMany({
        where: { actorId: id },
      });

      // 2. Hapus Order Items
      if (goodsIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { goodsId: { in: goodsIds } },
        });
      }

      // 3. Hapus Delivery Orders
      await tx.orderItem.deleteMany({
        where: { order: { customerId: id } },
      });
      await tx.deliveryOrder.deleteMany({
        where: { customerId: id },
      });

      // 4. Hapus Payments & Invoice Items
      await tx.payment.deleteMany({
        where: { customerId: id },
      });
      await tx.invoiceItem.deleteMany({
        where: { invoice: { customerId: id } },
      });

      // 5. Hapus Invoices
      await tx.invoice.deleteMany({
        where: { customerId: id },
      });

      // 6. Hapus Notifikasi & Refresh Tokens
      await tx.systemNotification.deleteMany({
        where: { recipientUserId: id },
      });
      await tx.refreshToken.deleteMany({
        where: { userId: id },
      });

      // 7. Hapus Goods Items
      await tx.goodsItem.deleteMany({
        where: { customerId: id },
      });

      // 8. Hapus User Record
      await tx.user.delete({
        where: { id },
      });

      // 9. Rekalkulasi Kapasitas Storage Slot & Warehouse yang Terdampak
      for (const slotId of affectedSlotIds) {
        await this.recalculateSlotCapacity(slotId, tx);
      }
      for (const whId of affectedWarehouseIds) {
        await this.recalculateWarehouseCapacity(whId, tx);
      }
    });

    this.logger.log(
      `User '${user.name}' (${user.email}) successfully deleted by Admin ${currentUser.name}`,
    );

    return {
      success: true,
      message: `Akun "${user.name}" (${user.email}) beserta seluruh data terkait berhasil dihapus secara permanen.`,
      deletedId: id,
    };
  }

  /**
   * Helper internal rekalkulasi kapasitas slot
   */
  private async recalculateSlotCapacity(
    slotId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const slot = await tx.storageSlot.findUnique({
      where: { id: slotId },
      include: {
        goodsItems: {
          where: { status: GoodsStorageStatus.STORED },
          select: { volumeM3: true },
        },
      },
    });

    if (!slot) return;

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

    await tx.storageSlot.update({
      where: { id: slotId },
      data: {
        usedM3: actualUsedM3,
        status: nextStatus,
      },
    });
  }

  /**
   * Helper internal rekalkulasi kapasitas warehouse
   */
  private async recalculateWarehouseCapacity(
    warehouseId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const storedGoods = await tx.goodsItem.findMany({
      where: {
        warehouseId,
        status: GoodsStorageStatus.STORED,
      },
      select: { volumeM3: true },
    });

    const actualWarehouseUsedM3 = Number(
      storedGoods.reduce((sum, g) => sum + Number(g.volumeM3), 0).toFixed(2),
    );

    await tx.warehouse.update({
      where: { id: warehouseId },
      data: {
        usedCapacityM3: actualWarehouseUsedM3,
      },
    });
  }
}
