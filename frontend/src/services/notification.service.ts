import { apiClient } from "@/lib/api-client";
import { SystemNotification } from "@/types";

export interface NotificationQueryOptions {
  isRead?: boolean;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  items: SystemNotification[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface INotificationService {
  getNotifications(options?: NotificationQueryOptions): Promise<PaginatedNotifications>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<SystemNotification>;
  markAllAsRead(): Promise<number>;
}

class HttpNotificationService implements INotificationService {
  async getNotifications(options?: NotificationQueryOptions): Promise<PaginatedNotifications> {
    try {
      const params: Record<string, any> = {};
      if (options?.isRead !== undefined) params.isRead = options.isRead;
      if (options?.category) params.category = options.category;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;

      const res = await apiClient<PaginatedNotifications>("/notifications", { params });

      return {
        items: res?.items || (Array.isArray(res) ? res : []),
        totalItems: res?.totalItems || (Array.isArray(res) ? res.length : 0),
        page: res?.page || 1,
        limit: res?.limit || 20,
        totalPages: res?.totalPages || 1,
      };
    } catch (error) {
      console.error("Failed to fetch notifications from backend:", error);
      return {
        items: [],
        totalItems: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient<{ unreadCount: number }>("/notifications/unread-count");
      return typeof res?.unreadCount === "number" ? res.unreadCount : 0;
    } catch (error) {
      console.error("Failed to fetch unread notification count:", error);
      return 0;
    }
  }

  async markAsRead(id: string): Promise<SystemNotification> {
    const res = await apiClient<SystemNotification>(`/notifications/${id}/read`, {
      method: "PATCH",
    });
    return res;
  }

  async markAllAsRead(): Promise<number> {
    const res = await apiClient<{ updatedCount: number }>("/notifications/read-all", {
      method: "PATCH",
    });
    return typeof res?.updatedCount === "number" ? res.updatedCount : 0;
  }
}

export const notificationService: INotificationService = new HttpNotificationService();
