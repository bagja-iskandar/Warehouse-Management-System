import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services";

export const analyticsKeys = {
  all: ["analytics"] as const,
  adminOverview: (warehouseId?: string | null) =>
    [...analyticsKeys.all, "admin-overview", warehouseId || "all"] as const,
  customerSummary: (customerId?: string | null) =>
    [...analyticsKeys.all, "customer-summary", customerId || "self"] as const,
  driverSummary: (driverId?: string | null) =>
    [...analyticsKeys.all, "driver-summary", driverId || "self"] as const,
};

export function useAdminOverview(warehouseId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.adminOverview(warehouseId),
    queryFn: () => analyticsService.getAdminOverview(warehouseId || undefined),
    staleTime: 1000 * 45, // 45 seconds
    refetchInterval: 1000 * 45,
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomerSummary(customerId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.customerSummary(customerId),
    queryFn: () => analyticsService.getCustomerSummary(customerId || undefined),
    staleTime: 1000 * 45,
    refetchInterval: 1000 * 45,
    placeholderData: (previousData) => previousData,
  });
}

export function useDriverSummary(driverId?: string | null) {
  return useQuery({
    queryKey: analyticsKeys.driverSummary(driverId),
    queryFn: () => analyticsService.getDriverSummary(driverId || undefined),
    staleTime: 1000 * 45,
    refetchInterval: 1000 * 45,
    placeholderData: (previousData) => previousData,
  });
}
