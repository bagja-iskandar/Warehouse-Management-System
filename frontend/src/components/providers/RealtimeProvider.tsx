"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { API_BASE_URL, getStoredAccessToken } from "@/lib/api-client";
import { goodsKeys } from "@/hooks/use-goods";
import { logisticsKeys } from "@/hooks/use-logistics";
import { warehouseKeys } from "@/hooks/use-warehouses";
import { billingKeys } from "@/hooks/use-billing";
import { notificationKeys } from "@/hooks/use-notifications";
import { operationalCountsKeys } from "@/hooks/use-operational-counts";

export interface RealtimeContextType {
  isConnected: boolean;
  lastEventTime: string | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEventTime: null,
});

export const useRealtime = () => useContext(RealtimeContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isSubscribed = true;

    const connectSse = () => {
      const token = getStoredAccessToken();
      if (!token) {
        setIsConnected(false);
        return;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const streamUrl = `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isSubscribed) return;
        setIsConnected(true);
        // Resync active queries on connect/reconnect to guarantee zero missed states
        queryClient.invalidateQueries({ queryKey: goodsKeys.all });
        queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
        queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
        queryClient.invalidateQueries({ queryKey: billingKeys.all });
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
      };

      es.onmessage = (messageEvent) => {
        if (!isSubscribed) return;
        try {
          const parsed = JSON.parse(messageEvent.data);
          
          // Ignore keep-alive heartbeats
          if (parsed.type === "PING") {
            return;
          }

          setLastEventTime(new Date().toLocaleTimeString());

          const eventType = parsed.type;
          const payload = parsed.payload;

          // =========================================================================
          // REACTIVE CACHE INVALIDATION & REAL-TIME STATE RECONCILIATION
          // =========================================================================

          switch (eventType) {
            case "INBOUND_CREATED":
            case "INBOUND_CONFIRMED":
            case "GOODS_RECEIVED":
            case "GOODS_PUT_AWAY":
            case "GOODS_TRANSFERRED":
            case "GOODS_REGISTERED":
            case "INVENTORY_MUTATED": {
              queryClient.invalidateQueries({ queryKey: goodsKeys.all });
              queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
              queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
              queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
              queryClient.invalidateQueries({ queryKey: notificationKeys.all });

              if (eventType === "GOODS_RECEIVED" || eventType === "INBOUND_CONFIRMED") {
                toast.success("Inbound goods received & verified at warehouse dock", {
                  description: `Order #${payload?.orderNumber || "Inbound"} updated in real time.`,
                });
              } else if (eventType === "GOODS_PUT_AWAY") {
                toast.success("Rack put-away storage completed", {
                  description: `Item ${payload?.barcode || ""} placed in storage slot.`,
                });
              }
              break;
            }

            case "ORDER_CREATED":
            case "DRIVER_ASSIGNED":
            case "DRIVER_CHANGED":
            case "DELIVERY_STATUS_CHANGED":
            case "DELIVERY_COMPLETED":
            case "DELIVERY_RECEIPT_CONFIRMED": {
              queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
              queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
              queryClient.invalidateQueries({ queryKey: goodsKeys.all });
              queryClient.invalidateQueries({ queryKey: notificationKeys.all });

              if (eventType === "DRIVER_ASSIGNED") {
                toast.info("Driver & Fleet Assigned", {
                  description: `Delivery #${payload?.orderNumber || ""} has been assigned to driver.`,
                });
              } else if (eventType === "DELIVERY_STATUS_CHANGED") {
                toast.info("Shipment Status Updated", {
                  description: `Order #${payload?.orderNumber || ""} status changed to ${payload?.newStatus || ""}.`,
                });
              } else if (eventType === "DELIVERY_COMPLETED") {
                toast.success("Delivery Order Completed", {
                  description: `Order #${payload?.orderNumber || ""} delivered successfully.`,
                });
              }
              break;
            }

            case "WAREHOUSE_CAPACITY_CHANGED":
            case "RENTAL_CAPACITY_CHANGED": {
              queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
              queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
              break;
            }

            case "INVOICE_CREATED":
            case "INVOICE_UPDATED":
            case "INVOICE_ISSUED":
            case "INVOICE_PAID":
            case "INVOICE_OVERDUE":
            case "INVOICE_CANCELLED":
            case "PAYMENT_CREATED":
            case "PAYMENT_SUBMITTED":
            case "PAYMENT_PENDING":
            case "PAYMENT_VERIFIED":
            case "PAYMENT_APPROVED":
            case "PAYMENT_REJECTED":
            case "PAYMENT_FAILED":
            case "PAYMENT_CANCELLED":
            case "PAYMENT_STATUS_CHANGED": {
              queryClient.invalidateQueries({ queryKey: billingKeys.all });
              queryClient.invalidateQueries({ queryKey: ["billing"] });
              queryClient.invalidateQueries({ queryKey: ["analytics"] });
              queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
              queryClient.invalidateQueries({ queryKey: notificationKeys.all });

              if (eventType === "PAYMENT_VERIFIED" || eventType === "INVOICE_PAID") {
                toast.success("Payment Verified & Settled", {
                  description: `Invoice #${payload?.invoiceNumber || ""} marked as PAID. Receipt #${payload?.receiptNumber || ""} generated.`,
                });
              } else if (eventType === "PAYMENT_REJECTED") {
                toast.error("Payment Submission Rejected", {
                  description: payload?.rejectionReason
                    ? `Reason: ${payload.rejectionReason}`
                    : `Payment for Invoice #${payload?.invoiceNumber || ""} was rejected by admin.`,
                });
              } else if (eventType === "PAYMENT_SUBMITTED") {
                if (user?.role === "ADMIN") {
                  toast.info("New Payment Submitted for Review", {
                    description: `Payment for Invoice #${payload?.invoiceNumber || ""} (${payload?.paymentNumber || ""}) submitted.`,
                  });
                } else {
                  toast.info("Payment Submitted", {
                    description: `Payment for Invoice #${payload?.invoiceNumber || ""} is now under review.`,
                  });
                }
              } else if (eventType === "INVOICE_CREATED") {
                toast.info("New Invoice Issued", {
                  description: `Invoice #${payload?.invoiceNumber || ""} has been issued.`,
                });
              }
              break;
            }

            case "ORDER_MESSAGE_CREATED": {
              queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
              queryClient.invalidateQueries({ queryKey: notificationKeys.all });
              if (payload?.title) {
                toast.info(`New Message: ${payload.title}`, {
                  description: payload.content || "You received a new operational message.",
                });
              }
              break;
            }

            case "NOTIFICATION_CREATED": {
              queryClient.invalidateQueries({ queryKey: notificationKeys.all });
              queryClient.invalidateQueries({ queryKey: operationalCountsKeys.all });
              break;
            }

            default: {
              // General state refresh for any other domain event
              queryClient.invalidateQueries({ queryKey: goodsKeys.all });
              queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
              queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
              break;
            }
          }
        } catch {
          // Non-JSON SSE ping or malformed packet safely ignored
        }
      };

      es.onerror = () => {
        if (!isSubscribed) return;
        setIsConnected(false);
        es.close();

        // Auto-reconnect with 3-second debounce
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isSubscribed && isAuthenticated) {
            connectSse();
          }
        }, 3000);
      };
    };

    connectSse();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, user, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEventTime }}>
      {children}
    </RealtimeContext.Provider>
  );
}
