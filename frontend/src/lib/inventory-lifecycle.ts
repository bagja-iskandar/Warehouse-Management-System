export interface GoodsItemLike {
  id: string;
  name: string;
  status: string;
  slotId?: string | null;
  slotCode?: string | null;
  quantity: number;
  warehouseId?: string;
  warehouseName?: string;
}

/**
 * Validates whether an inventory item is eligible for Inbound logistics pickup.
 * Only DRAFT and PENDING_PICKUP items are allowed.
 * CANCELLED, INSPECTING, STORED, DELIVERED items are strictly blocked.
 */
export function isEligibleForInbound(status: string): boolean {
  if (status === "CANCELLED") {
    return false;
  }
  return status === "DRAFT" || status === "PENDING_PICKUP";
}

/**
 * Validates whether an inventory item is ready for Put-Away allocation into a rack slot.
 * Only INSPECTING items (physically received and verified at the loading dock) are allowed.
 */
export function isEligibleForPutAway(status: string): boolean {
  if (status === "CANCELLED") {
    return false;
  }
  return status === "INSPECTING";
}

/**
 * Validates whether an inventory item is eligible for Outbound delivery dispatch.
 * Only STORED items that have an active slot allocation and available quantity > 0 are allowed.
 * Items in DRAFT, PENDING_PICKUP, IN_TRANSIT_INBOUND, INSPECTING, or CANCELLED are strictly blocked.
 */
export function isEligibleForOutbound(item: GoodsItemLike): boolean {
  if (item.status === "CANCELLED") {
    return false;
  }
  if (item.status !== "STORED") {
    return false;
  }
  if (!item.slotId && !item.slotCode) {
    return false;
  }
  if (item.quantity <= 0) {
    return false;
  }
  return true;
}

/**
 * Validates whether a customer can perform a simple Pre-Inbound Warehouse Change.
 * Allowed ONLY if no inventory has entered warehouse operations (i.e. no items are INSPECTING, STORED,
 * PENDING_DELIVERY, IN_TRANSIT_OUTBOUND, or DELIVERED).
 */
export function canChangeRentalWarehouse(goodsList: { status: string }[]): {
  allowed: boolean;
  reason?: string;
} {
  const operationalStatuses = [
    "INSPECTING",
    "STORED",
    "PENDING_DELIVERY",
    "IN_TRANSIT_OUTBOUND",
    "DELIVERED",
  ];

  const hasEnteredOps = goodsList.some((g) =>
    operationalStatuses.includes(g.status)
  );

  if (hasEnteredOps) {
    return {
      allowed: false,
      reason:
        "Warehouse transfer is unavailable because inventory has already entered warehouse operations. Please use Physical Inventory Transfer.",
    };
  }

  return { allowed: true };
}

/**
 * Returns user-friendly status badge styling and labels adhering to strict business states.
 */
export function getInventoryStatusConfig(status: string) {
  switch (status) {
    case "STORED":
      return {
        label: "Stored in Rack",
        subLabel: "Available for Outbound",
        colorClass: "bg-emerald-600 text-white",
        badgeVariant: "success" as const,
      };
    case "DRAFT":
      return {
        label: "Waiting for Inbound",
        subLabel: "Origin / Registered",
        colorClass: "bg-slate-200 text-slate-800",
        badgeVariant: "outline" as const,
      };
    case "INSPECTING":
      return {
        label: "Ready for Put-Away",
        subLabel: "Receiving Dock",
        colorClass: "bg-amber-500 text-slate-950 font-bold animate-pulse",
        badgeVariant: "warning" as const,
      };
    case "PENDING_PICKUP":
      return {
        label: "Pickup Scheduled",
        subLabel: "Origin Staging",
        colorClass: "bg-sky-600 text-white",
        badgeVariant: "default" as const,
      };
    case "IN_TRANSIT_INBOUND":
      return {
        label: "Inbound Transit",
        subLabel: "With Driver",
        colorClass: "bg-indigo-600 text-white",
        badgeVariant: "default" as const,
      };
    case "PENDING_DELIVERY":
      return {
        label: "Outbound Scheduled",
        subLabel: "Staging Dock",
        colorClass: "bg-purple-600 text-white",
        badgeVariant: "default" as const,
      };
    case "IN_TRANSIT_OUTBOUND":
      return {
        label: "Outbound Transit",
        subLabel: "En Route to Customer",
        colorClass: "bg-indigo-700 text-white",
        badgeVariant: "default" as const,
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        subLabel: "Completed POD",
        colorClass: "bg-slate-700 text-white",
        badgeVariant: "secondary" as const,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        subLabel: "Terminated",
        colorClass: "bg-rose-600 text-white font-bold",
        badgeVariant: "destructive" as const,
      };
    default:
      return {
        label: status,
        subLabel: "",
        colorClass: "bg-slate-200 text-slate-700",
        badgeVariant: "outline" as const,
      };
  }
}
