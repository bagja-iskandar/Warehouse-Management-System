import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  NotificationCategory,
  Prisma,
  RelatedEntityType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

import { EventsService } from '../events/events.service';
import { DomainEventType } from '../events/events.types';

export interface CreateNotificationInput {
  recipientUserId: string;
  recipientRole: UserRole;
  title: string;
  message: string;
  category: NotificationCategory;
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Helper internal untuk memetakan entity Prisma SystemNotification ke DTO
   */
  private mapToDto(notif: any): NotificationResponseDto {
    return {
      id: notif.id,
      recipientUserId: notif.recipientUserId,
      recipientRole: notif.recipientRole,
      title: notif.title,
      message: notif.message,
      category: notif.category,
      relatedEntityId: notif.relatedEntityId,
      relatedEntityType: notif.relatedEntityType,
      isRead: notif.isRead,
      actionUrl: notif.actionUrl,
      createdAt: notif.createdAt instanceof Date ? notif.createdAt.toISOString() : notif.createdAt,
    };
  }

  /**
   * Membuat satu record notifikasi baru dalam transaksi atau standalone.
   */
  async createNotification(
    input: CreateNotificationInput,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationResponseDto> {
    const client = tx || this.prisma;

    // 1. Deduplication / Throttling: Ignore identical notification within 60s window
    const throttleWindow = new Date(Date.now() - 60 * 1000);
    const existingRecent = await client.systemNotification.findFirst({
      where: {
        recipientUserId: input.recipientUserId,
        category: input.category,
        title: input.title,
        message: input.message,
        createdAt: { gte: throttleWindow },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingRecent) {
      this.logger.debug(
        `Throttled duplicate notification to user '${input.recipientUserId}': ${input.title}`,
      );
      return this.mapToDto(existingRecent);
    }

    // 2. Bounded Retention: Maximum 50 notifications per user (clean up oldest)
    const MAX_NOTIFICATIONS_PER_USER = 50;
    const currentCount = await client.systemNotification.count({
      where: { recipientUserId: input.recipientUserId },
    });

    if (currentCount >= MAX_NOTIFICATIONS_PER_USER) {
      const excessCount = currentCount - MAX_NOTIFICATIONS_PER_USER + 1;
      const oldestNotifs = await client.systemNotification.findMany({
        where: { recipientUserId: input.recipientUserId },
        orderBy: { createdAt: 'asc' },
        take: excessCount,
        select: { id: true },
      });

      if (oldestNotifs.length > 0) {
        await client.systemNotification.deleteMany({
          where: { id: { in: oldestNotifs.map((n) => n.id) } },
        });
      }
    }

    // 3. Create single clean notification record
    const created = await client.systemNotification.create({
      data: {
        recipientUserId: input.recipientUserId,
        recipientRole: input.recipientRole,
        title: input.title,
        message: input.message,
        category: input.category,
        relatedEntityId: input.relatedEntityId || null,
        relatedEntityType: input.relatedEntityType || null,
        actionUrl: input.actionUrl || null,
        isRead: false,
      },
    });

    this.logger.debug(
      `Notification emitted to User '${input.recipientUserId}' [${input.recipientRole}]: ${input.title}`,
    );

    const dto = this.mapToDto(created);

    // If standalone (outside tx), publish immediate event. For tx, calling methods publish domain events.
    this.eventsService.publish({
      type: DomainEventType.NOTIFICATION_CREATED,
      payload: dto,
      targetCustomerId:
        input.recipientRole === UserRole.CUSTOMER ? input.recipientUserId : undefined,
      targetDriverId: input.recipientRole === UserRole.DRIVER ? input.recipientUserId : undefined,
      targetRoles: input.recipientRole === UserRole.ADMIN ? [UserRole.ADMIN] : undefined,
    });

    return dto;
  }

  /**
   * Mengirimkan notifikasi ke seluruh user aktif yang memiliki role tertentu (misalnya seluruh Admin).
   */
  async notifyRole(
    role: UserRole,
    data: Omit<CreateNotificationInput, 'recipientUserId' | 'recipientRole'>,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;
    const users = await client.user.findMany({
      where: { role, status: UserStatus.ACTIVE },
      select: { id: true, role: true },
    });

    if (users.length === 0) return;

    await Promise.all(
      users.map((u: { id: string; role: UserRole }) =>
        this.createNotification(
          {
            ...data,
            recipientUserId: u.id,
            recipientRole: u.role,
          },
          client,
        ),
      ),
    );
  }

  /**
   * Mengambil daftar notifikasi pengguna yang sedang login dengan paginasi, filter isRead, dan category.
   * Isolasi ketat: User hanya dapat melihat notifikasi yang ditujukan kepada ID user tersebut.
   */
  async findAll(query: NotificationQueryDto, currentUser: AuthenticatedUser) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SystemNotificationWhereInput = {
      recipientUserId: currentUser.id,
    };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    if (query.category) {
      where.category = query.category;
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.systemNotification.count({ where }),
      this.prisma.systemNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items: items.map((item: any) => this.mapToDto(item)),
      totalItems,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Mengambil jumlah notifikasi yang belum dibaca (unread count) untuk pengguna saat ini.
   */
  async getUnreadCount(currentUser: AuthenticatedUser): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.systemNotification.count({
      where: {
        recipientUserId: currentUser.id,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  /**
   * Menandai satu notifikasi sebagai telah dibaca (isRead = true).
   */
  async markAsRead(id: string, currentUser: AuthenticatedUser): Promise<NotificationResponseDto> {
    const existing = await this.prisma.systemNotification.findFirst({
      where: {
        id,
        recipientUserId: currentUser.id,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Notification with ID '${id}' not found`);
    }

    const updated = await this.prisma.systemNotification.update({
      where: { id },
      data: { isRead: true },
    });

    // If this notification is an ORDER_MESSAGE, mark corresponding order message as read
    if (existing.category === NotificationCategory.ORDER_MESSAGE && existing.relatedEntityId) {
      await this.prisma.deliveryOrderMessage.updateMany({
        where: {
          customerId: currentUser.id,
          orderId: existing.relatedEntityId,
          title: existing.title,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return this.mapToDto(updated);
  }

  /**
   * Menandai seluruh notifikasi milik pengguna saat ini sebagai telah dibaca (Mark All as Read).
   */
  async markAllAsRead(currentUser: AuthenticatedUser): Promise<{ updatedCount: number }> {
    const result = await this.prisma.systemNotification.updateMany({
      where: {
        recipientUserId: currentUser.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Also synchronize unread DeliveryOrderMessages for customer
    if (currentUser.role === UserRole.CUSTOMER) {
      await this.prisma.deliveryOrderMessage.updateMany({
        where: {
          customerId: currentUser.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return { updatedCount: result.count };
  }
}
