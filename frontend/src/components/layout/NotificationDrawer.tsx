"use client";

import React, { useState } from "react";
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Truck,
  Receipt,
  Info,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_NOTIFICATIONS } from "@/mock/seed/notifications.seed";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);

  if (!isOpen) return null;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "SCHEDULE_DELAY":
      case "CONFIRMATION_REQUIRED":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "DRIVER_DISPATCHED":
      case "DELIVERY_ARRIVED":
      case "GOODS_STORED":
        return <Truck className="h-4 w-4 text-indigo-600" />;
      case "BILLING_DUE":
      case "PAYMENT_RECEIVED":
        return <Receipt className="h-4 w-4 text-rose-600" />;
      default:
        return <Info className="h-4 w-4 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Pusat Notifikasi Operasional
            </h2>
            {unreadCount > 0 && (
              <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0">
                {unreadCount} Baru
              </Badge>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Tutup notifikasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Aktivitas terkini hub pergudangan
          </span>
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Tandai Semua Dibaca</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-lg border transition-all ${
                notif.isRead
                  ? "bg-white border-slate-200 text-slate-600"
                  : "bg-indigo-50/40 border-indigo-200 text-slate-900 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-white border border-slate-200 shadow-sm mt-0.5">
                  {getIcon(notif.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <Button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            Tutup Panel Notifikasi
          </Button>
        </div>
      </div>
    </div>
  );
}
