import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logisticsService } from "@/services";
import { DeliveryOrder } from "@/types";

export const logisticsKeys = {
  all: ["logistics"] as const,
  orders: (driverId?: string, customerId?: string) =>
    [...logisticsKeys.all, "orders", { driverId, customerId }] as const,
  order: (id: string) => [...logisticsKeys.all, "order", id] as const,
  vehicles: () => [...logisticsKeys.all, "vehicles"] as const,
};

export function useDeliveryOrders(driverId?: string, customerId?: string) {
  return useQuery({
    queryKey: logisticsKeys.orders(driverId, customerId),
    queryFn: () => logisticsService.getOrders(driverId, customerId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDeliveryOrder(id: string) {
  return useQuery({
    queryKey: logisticsKeys.order(id),
    queryFn: () => logisticsService.getOrderById(id),
    enabled: !!id,
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
      location,
      note,
    }: {
      orderId: string;
      status: DeliveryOrder["status"];
      location?: string;
      note?: string;
    }) => logisticsService.updateOrderStatus(orderId, status, location, note),
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
      driverName?: string;
    }) => logisticsService.assignVehicle(vehicleId, driverId, driverName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.vehicles() });
    },
  });
}

export function useCreateDeliveryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Partial<DeliveryOrder>) =>
      logisticsService.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
    },
  });
}

export function useSubmitPod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: {
        recipientName: string;
        photoUrl: string;
        signatureData: string;
        rating?: number;
        note?: string;
      };
    }) => logisticsService.submitPod(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
    },
  });
}
