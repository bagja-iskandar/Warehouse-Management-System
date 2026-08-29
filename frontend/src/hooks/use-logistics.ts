import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logisticsService } from "@/services";
import { DeliveryOrder } from "@/types";

export const logisticsKeys = {
  all: ["logistics"] as const,
  orders: (
    params?:
      | string
      | null
      | {
          driverId?: string | null;
          customerId?: string | null;
          status?: string | null;
          type?: string | null;
          warehouseId?: string | null;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        },
    customerId?: string | null
  ) => {
    const dId = typeof params === "string" ? params : params?.driverId;
    const cId = typeof params === "object" ? params?.customerId : customerId;
    const wId = typeof params === "object" ? params?.warehouseId : undefined;
    const s = typeof params === "object" ? params?.status : undefined;
    const t = typeof params === "object" ? params?.type : undefined;
    const sb = typeof params === "object" ? params?.sortBy : undefined;
    const so = typeof params === "object" ? params?.sortOrder : undefined;
    return [
      ...logisticsKeys.all,
      "orders",
      {
        driverId: dId || "all",
        customerId: cId || "all",
        warehouseId: wId || "all",
        status: s || "all",
        type: t || "all",
        sortBy: sb || "createdAt",
        sortOrder: so || "desc",
      },
    ] as const;
  },
  order: (id: string) => [...logisticsKeys.all, "order", id] as const,
  vehicles: () => [...logisticsKeys.all, "vehicles"] as const,
};

export function useDeliveryOrders(
  params?:
    | string
    | null
    | {
        driverId?: string | null;
        customerId?: string | null;
        status?: string | null;
        type?: string | null;
        warehouseId?: string | null;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      },
  customerId?: string | null
) {
  return useQuery({
    queryKey: logisticsKeys.orders(params, customerId),
    queryFn: () => {
      const sanitizedParams =
        typeof params === "object" && params !== null
          ? {
              driverId: params.driverId || undefined,
              customerId: params.customerId || undefined,
              status: params.status || undefined,
              type: params.type || undefined,
              warehouseId: params.warehouseId || undefined,
              sortBy: params.sortBy,
              sortOrder: params.sortOrder,
            }
          : params || undefined;
      return logisticsService.getOrders(sanitizedParams, customerId || undefined);
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: (previousData) => previousData,
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
    placeholderData: (previousData) => previousData,
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
      driverId,
      vehicleId,
      isDelayed,
      delayReason,
      rescheduledTime,
    }: {
      orderId: string;
      status: DeliveryOrder["status"];
      location?: string;
      note?: string;
      driverId?: string;
      vehicleId?: string;
      isDelayed?: boolean;
      delayReason?: string;
      rescheduledTime?: string;
    }) =>
      logisticsService.updateOrderStatus(orderId, {
        status,
        location,
        note,
        driverId,
        vehicleId,
        isDelayed,
        delayReason,
        rescheduledTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
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
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCreateDeliveryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      order: Partial<Omit<DeliveryOrder, "items">> & {
        items?: { goodsId: string; quantity: number }[];
        warehouseId?: string;
      }
    ) => logisticsService.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
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
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useReceiveInboundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: {
        receivedQuantity: number;
        damagedQuantity: number;
        missingQuantity: number;
        condition: string;
        receivingNotes?: string;
      };
    }) => logisticsService.receiveInboundOrder(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}


export function useOrderMessages(orderId: string) {
  return useQuery({
    queryKey: [...logisticsKeys.all, "order", orderId, "messages"] as const,
    queryFn: () => logisticsService.getOrderMessages(orderId),
    enabled: !!orderId,
  });
}

export function useCreateOrderMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: import("@/types").CreateOrderMessagePayload;
    }) => logisticsService.createOrderMessage(orderId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...logisticsKeys.all, "order", variables.orderId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkOrderMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      messageId,
    }: {
      orderId: string;
      messageId: string;
    }) => logisticsService.markOrderMessageAsRead(orderId, messageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: logisticsKeys.all });
      queryClient.invalidateQueries({
        queryKey: [...logisticsKeys.all, "order", variables.orderId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
    },
  });
}

