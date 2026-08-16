export type NotificationCategory =
  | "BILLING_DUE"
  | "PAYMENT_RECEIVED"
  | "GOODS_STORED"
  | "GOODS_INSPECTED"
  | "DRIVER_DISPATCHED"
  | "DELIVERY_ARRIVED"
  | "SCHEDULE_DELAY"
  | "CONFIRMATION_REQUIRED";

export interface SystemNotification {
  id: string;
  recipientUserId: string;
  recipientRole: "ADMIN" | "CUSTOMER" | "DRIVER";
  title: string;
  message: string;
  category: NotificationCategory;
  relatedEntityId?: string;
  relatedEntityType?: "GOODS" | "ORDER" | "INVOICE" | "WAREHOUSE";
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}
