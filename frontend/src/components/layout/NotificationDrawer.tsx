"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Truck,
  Receipt,
  Package,
  Info,
  Clock,
  ExternalLink,
  Loader2,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";
import { useOperationalCounts } from "@/hooks/use-operational-counts";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { NotificationCategory, SystemNotification } from "@/types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();
  const { data: notificationsData, isLoading } = useNotifications(undefined, {
    enabled: isOpen,
  });
  const { data: counts } = useOperationalCounts();
  const unreadCount = counts?.unreadNotificationsCount ?? 0;
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  if (!isOpen) return null;

  const notifications = notificationsData?.items || [];

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleNotificationClick = (notif: SystemNotification) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.actionUrl) {
      onClose();
      router.push(notif.actionUrl);
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "SCHEDULE_DELAY":
      case "CONFIRMATION_REQUIRED":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "DRIVER_DISPATCHED":
      case "DELIVERY_ARRIVED":
        return <Truck className="h-4 w-4 text-indigo-600" />;
      case "GOODS_STORED":
      case "GOODS_INSPECTED":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "BILLING_DUE":
        return <Receipt className="h-4 w-4 text-rose-600" />;
      case "PAYMENT_RECEIVED":
        return <Receipt className="h-4 w-4 text-emerald-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case "SCHEDULE_DELAY":
      case "CONFIRMATION_REQUIRED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "DRIVER_DISPATCHED":
      case "DELIVERY_ARRIVED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "GOODS_STORED":
      case "GOODS_INSPECTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "BILLING_DUE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PAYMENT_RECEIVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with smooth blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Flyout Panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl border-l border-slate-200 rounded-l-2xl flex flex-col animate-in slide-in-from-right duration-200 z-10 overflow-hidden">
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Operations Notification Center
                </h2>
                {unreadCount > 0 && (
                  <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[10px] px-1.5 py-0 font-mono">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recent warehouse activities
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
              unreadCount > 0
                ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                : "text-slate-400 cursor-not-allowed opacity-60"
            }`}
            title="Mark all notifications as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Scrollable Notification Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100/50">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6">
              <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
                <BellOff className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No new notifications
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                You are all caught up with your operational activities. New updates will appear here automatically.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isClickable = !!notif.actionUrl;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`pt-2.5 first:pt-0 group relative p-3.5 rounded-xl border transition-all ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  } ${
                    notif.isRead
                      ? "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300"
                      : "bg-indigo-50/40 border-indigo-200/80 text-slate-900 shadow-sm hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon Badge */}
                    <div
                      className={`p-2 rounded-lg border shrink-0 mt-0.5 ${getCategoryBadgeClass(
                        notif.category
                      )}`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                          <h3
                            className={`text-xs truncate ${
                              notif.isRead
                                ? "font-semibold text-slate-800"
                                : "font-bold text-slate-900"
                            }`}
                          >
                            {notif.title}
                          </h3>
                        </div>

                        <span
                          className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1"
                          title={formatDate(notif.createdAt)}
                        >
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                        {notif.message}
                      </p>

                      {isClickable && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-700">
                          <span>View details</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Fixed Footer with ONLY ONE Close Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 shrink-0 text-center">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-10 shadow-sm transition-all"
          >
            Close Notifications Panel
          </Button>
        </div>
      </div>
    </div>
  );
}
