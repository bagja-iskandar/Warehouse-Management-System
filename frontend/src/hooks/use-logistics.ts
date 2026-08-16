import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logisticsService } from "@/services";
import { DeliveryOrder } from "@/types";

export const logisticsKeys = {
  all: ["logistics"] as const,
  orders: (driverId?: string, customerId?: string) =>
    [...logisticsKeys.all, "orders", { driverId, customerId }] as const,
  vehicles: () => [...logisticsKeys.all, "vehicles"] as const,
};

export function useDeliveryOrders(driverId?: string, customerId?: string) {
  return useQuery({
    queryKey: logisticsKeys.orders(driverId, customerId),
    queryFn: () => logisticsService.getOrders(driverId, customerId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: logisticsKeys.vehicles(),
    queryFn: () => logisticsService.getVehicles(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: DeliveryOrder["status"];
    }) => logisticsService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
    },
  });
}

export function useAssignVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vehicleId,
      driverId,
      driverName,
    }: {
      vehicleId: string;
      driverId: string;
      driverName: string;
    }) => logisticsService.assignVehicle(vehicleId, driverId, driverName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.vehicles() });
    },
  });
}
