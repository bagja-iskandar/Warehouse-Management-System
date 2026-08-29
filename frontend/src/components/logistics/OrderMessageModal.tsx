"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Snowflake,
  Truck,
  User,
  MapPin,
  Calendar,
  History,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DeliveryOrder,
  OrderMessageType,
  DeliveryOrderMessage,
} from "@/types";
import { useOrderMessages, useCreateOrderMessage } from "@/hooks/use-logistics";
import { toast } from "sonner";

interface OrderMessageModalProps {
  order: DeliveryOrder;
  isReeferUnavailable?: boolean;
  onClose: () => void;
}

interface MessageTemplate {
  type: OrderMessageType;
  label: string;
  badgeColor: string;
  defaultTitle: string;
  templateText: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    type: "REEFER_UNAVAILABLE",
    label: "Reefer Vehicle Unavailable",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    defaultTitle: "Reefer Vehicle Unavailable",
    templateText:
      "Your delivery order {DO_NUMBER} requires a temperature-controlled reefer vehicle. Currently, all suitable reefer vehicles are in use. Your order remains active, and our dispatch team is working to assign the next available vehicle.",
  },
  {
    type: "DRIVER_PENDING",
    label: "Driver Assignment Pending",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    defaultTitle: "Driver Assignment Pending",
    templateText:
      "Your delivery order {DO_NUMBER} is currently waiting for driver assignment. Our dispatch team is arranging the appropriate driver and vehicle for your shipment. We will notify you once the assignment is confirmed.",
  },
  {
    type: "DELIVERY_DELAYED",
    label: "Delivery Delayed",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    defaultTitle: "Delivery Delayed",
    templateText:
      "We would like to inform you that delivery order {DO_NUMBER} may experience a delay due to vehicle availability. We apologize for the inconvenience and will provide another update once the new delivery schedule is confirmed.",
  },
  {
    type: "DRIVER_ASSIGNED",
    label: "Driver Assigned",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    defaultTitle: "Driver Assigned",
    templateText:
      "Good news! Driver {DRIVER_NAME} and vehicle {VEHICLE_NUMBER} have been assigned to your delivery order {DO_NUMBER}. Your shipment is now scheduled for dispatch.",
  },
  {
    type: "VEHICLE_ASSIGNED",
    label: "Vehicle Assigned",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    defaultTitle: "Vehicle Assigned",
    templateText:
      "Dedicated fleet vehicle {VEHICLE_NUMBER} has been assigned to your delivery order {DO_NUMBER} for route {ORIGIN_CITY} to {DESTINATION_CITY}.",
  },
  {
    type: "SCHEDULE_CHANGED",
    label: "Schedule Changed",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    defaultTitle: "Delivery Schedule Changed",
    templateText:
      "The delivery schedule for order {DO_NUMBER} has been updated to {SCHEDULED_DATE} ({SCHEDULED_TIME}). Please ensure the receiving team is prepared.",
  },
  {
    type: "CUSTOM",
    label: "Custom Message",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    defaultTitle: "Dispatch Operational Update",
    templateText:
      "Dear {CUSTOMER_NAME}, our dispatch operations team would like to provide an update regarding your delivery order {DO_NUMBER} ({CARGO_SUMMARY}).",
  },
];

export function OrderMessageModal({
  order,
  isReeferUnavailable = false,
  onClose,
}: OrderMessageModalProps) {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Determine initial suggested template
  const suggestedType: OrderMessageType = useMemo(() => {
    if (order.requiresReefer && isReeferUnavailable && order.status === "PENDING_ASSIGNMENT") {
      return "REEFER_UNAVAILABLE";
    }
    if (order.status === "PENDING_ASSIGNMENT") {
      return "DRIVER_PENDING";
    }
    if (order.status === "DRIVER_ASSIGNED") {
      return "DRIVER_ASSIGNED";
    }
    if (order.status === "DELAYED") {
      return "DELIVERY_DELAYED";
    }
    return "CUSTOM";
  }, [order, isReeferUnavailable]);

  const [selectedType, setSelectedType] = useState<OrderMessageType>(suggestedType);
  const [messageTitle, setMessageTitle] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");

  const { data: messages = [], isLoading: isLoadingMessages } = useOrderMessages(order.id);
  const createMessageMutation = useCreateOrderMessage();

  // Helper to replace template tokens with order data
  const applyTemplate = React.useCallback(
    (type: OrderMessageType) => {
      const template = MESSAGE_TEMPLATES.find((t) => t.type === type);
      if (!template) return;

      setSelectedType(type);
      setMessageTitle(template.defaultTitle);

      const formattedScheduledDate = order.scheduledDate
        ? new Date(order.scheduledDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Upcoming Schedule";

      const content = template.templateText
        .replace(/{DO_NUMBER}/g, order.orderNumber)
        .replace(/{CUSTOMER_NAME}/g, order.customerName || "Valued Customer")
        .replace(/{CARGO_SUMMARY}/g, order.goodsSummary || "Cargo Items")
        .replace(/{ORIGIN_CITY}/g, order.originCity || "Origin Hub")
        .replace(/{DESTINATION_CITY}/g, order.destinationCity || "Destination")
        .replace(/{DESTINATION_ADDRESS}/g, order.destinationAddress || "")
        .replace(/{DRIVER_NAME}/g, order.driverName || "Assigned Driver")
        .replace(/{VEHICLE_NUMBER}/g, order.vehiclePlate || "Assigned Vehicle")
        .replace(/{SCHEDULED_DATE}/g, formattedScheduledDate)
        .replace(/{SCHEDULED_TIME}/g, order.scheduledTimeSlot || "Normal Hours");

      setMessageContent(content);
    },
    [order]
  );

  // Populate initial template on open
  useEffect(() => {
    applyTemplate(suggestedType);
  }, [suggestedType, applyTemplate]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast.error("Validation Error", {
        description: "Please provide both message title and message content.",
      });
      return;
    }

    try {
      await createMessageMutation.mutateAsync({
        orderId: order.id,
        payload: {
          messageType: selectedType,
          title: messageTitle.trim(),
          content: messageContent.trim(),
          channel: "IN_APP",
        },
      });

      toast.success("Customer Message Delivered", {
        description: `Operational update for DO #${order.orderNumber} delivered to ${order.customerName} via In-App notification.`,
      });
      setActiveTab("history");
    } catch (err: any) {
      toast.error("Failed to Send Message", {
        description: err?.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-[94vw] max-w-[880px] max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto">
        
        {/* ========================================================================= */}
        {/* 1. MODAL HEADER & ORDER CONTEXT STRIP                                     */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-base">
                  Message Customer
                </span>
                <span className="text-slate-300 font-mono">·</span>
                <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  {order.orderNumber}
                </span>
                {order.requiresReefer && (
                  <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10.5px] gap-1 py-0.5 px-2">
                    <Snowflake className="h-3 w-3 text-sky-600" />
                    Cold-Chain Reefer
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send real-time operational status updates directly to the customer&apos;s portal
              </p>
            </div>
          </div>
        </div>

        {/* Order Context Strip */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">Customer</span>
            <span className="font-bold text-slate-800 truncate block mt-0.5">
              {order.customerName}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">Cargo Package</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5">
              {order.goodsSummary || "Logistics Package"}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">Route</span>
            <span className="font-semibold text-slate-800 truncate block mt-0.5">
              {order.originCity} → {order.destinationCity}
            </span>
          </div>
          <div>
            <span className="text-[10.5px] text-slate-400 block font-medium">Order Status</span>
            <span className="font-bold text-indigo-700 font-mono text-[11px] block mt-0.5">
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 bg-white flex items-center gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("compose")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "compose"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Compose Message</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Message History ({messages.length})</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY CONTENT (Compose vs History)                                      */}
        {/* ========================================================================= */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-4">
          {activeTab === "compose" ? (
            <form onSubmit={handleSendMessage} className="space-y-4">
              
              {/* Contextual Suggested Banner */}
              {order.requiresReefer && isReeferUnavailable && order.status === "PENDING_ASSIGNMENT" && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in duration-150">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950">
                        Suggested Action: Reefer Vehicle Unavailable
                      </span>
                      <Badge className="bg-amber-200 text-amber-900 border-amber-300 text-[10px] py-0 px-1.5">
                        Cold-Chain Constraint
                      </Badge>
                    </div>
                    <p className="text-amber-800 text-[11.5px] leading-relaxed">
                      This cargo requires a certified temperature-controlled reefer truck, but all eligible reefer vehicles are currently in service. The order remains active in <strong>Pending Assignment</strong>. You can notify the customer below that their order is being prioritized for the next available reefer truck.
                    </p>
                  </div>
                </div>
              )}

              {/* Template Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
                  <span>Predefined Message Templates:</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Click to auto-populate dynamic fields
                  </span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MESSAGE_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedType === tmpl.type;
                    return (
                      <button
                        key={tmpl.type}
                        type="button"
                        onClick={() => applyTemplate(tmpl.type)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all text-left flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        <span>{tmpl.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Subject / Title Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  placeholder="e.g. Reefer Vehicle Unavailable"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>

              {/* Message Body Textarea */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message Body (Customer Notice) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Write message content here..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none transition-colors"
                />
              </div>

              {/* Delivery Channels Info (No fake promises) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-700">
                    Delivery Channel: In-App Notification (Live)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Email & SMS channels: Optional Add-on
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs h-9 px-4 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMessageMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-5 rounded-xl flex items-center gap-2 shadow-sm"
                >
                  {createMessageMutation.isPending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Sending Notice...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Message to Customer</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Message History View */
            <div className="space-y-3">
              {isLoadingMessages ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
                  <span>Loading communication history...</span>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const formattedDate = new Date(msg.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {msg.title}
                            </span>
                            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold py-0.5">
                              {msg.messageType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <Clock className="h-3 w-3" />
                            <span>{formattedDate} WIB</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans">
                          {'“'}{msg.content}{'"'}
                        </p>

                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="h-3 w-3 text-slate-400" />
                            Sender: {msg.senderName} ({msg.senderRole})
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {msg.isRead ? "Read by Customer" : "Sent via In-App Notice"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <MessageSquare className="h-8 w-8 text-slate-300" />
                  <p className="font-bold text-slate-700">No previous messages sent on this order</p>
                  <p className="text-[11.5px] text-slate-400 max-w-sm">
                    Switch to the <strong>Compose Message</strong> tab to send an operational update regarding vehicle or driver availability.
                  </p>
                </div>
              )}

              {/* History Tab Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-xs h-9 px-4 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("compose")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Compose New Update</span>
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
