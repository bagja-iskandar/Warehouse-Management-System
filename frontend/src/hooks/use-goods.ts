import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goodsService } from "@/services";
import { CreateGoodsInput, GoodsItem } from "@/types";
import { warehouseKeys } from "@/hooks/use-warehouses";

export const goodsKeys = {
  all: ["goods"] as const,
  lists: () => [...goodsKeys.all, "list"] as const,
  list: (
    params?: string | null | { customerId?: string | null; warehouseId?: string | null },
    warehouseId?: string | null
  ) => {
    const custId = typeof params === "string" ? params : params?.customerId;
    const whId = typeof params === "object" ? params?.warehouseId : warehouseId;
    return [
      ...goodsKeys.lists(),
      { customerId: custId || "all", warehouseId: whId || "all" },
    ] as const;
  },
  details: () => [...goodsKeys.all, "detail"] as const,
  detail: (id: string) => [...goodsKeys.details(), id] as const,
  mutations: (customerId?: string | null) =>
    [...goodsKeys.all, "mutations", { customerId: customerId || "all" }] as const,
};

export function useGoods(
  params?:
    | string
    | null
    | {
        customerId?: string | null;
        warehouseId?: string | null;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      },
  warehouseId?: string | null
) {
  return useQuery({
    queryKey: [
      ...goodsKeys.lists(),
      typeof params === "object" && params !== null
        ? {
            customerId: params.customerId || "all",
            warehouseId: params.warehouseId || warehouseId || "all",
            sortBy: params.sortBy || "createdAt",
            sortOrder: params.sortOrder || "desc",
          }
        : { customerId: params || "all", warehouseId: warehouseId || "all" },
    ],
    queryFn: () => {
      const sanitizedParams =
        typeof params === "object" && params !== null
          ? {
              customerId: params.customerId || undefined,
              warehouseId: params.warehouseId || undefined,
              sortBy: params.sortBy,
              sortOrder: params.sortOrder,
            }
          : params || undefined;
      return goodsService.getGoods(sanitizedParams, warehouseId || undefined);
    },
    staleTime: 1000 * 60 * 3,
    placeholderData: (previousData) => previousData,
  });
}

export function useGoodsMutations(customerId?: string | null) {
  return useQuery({
    queryKey: goodsKeys.mutations(customerId),
    queryFn: () => goodsService.getMutations(customerId || undefined),
    staleTime: 1000 * 60 * 1,
    placeholderData: (previousData) => previousData,
  });
}

export function useGoodsItem(id: string) {
  return useQuery({
    queryKey: goodsKeys.detail(id),
    queryFn: () => goodsService.getGoodsById(id),
    enabled: !!id,
  });
}

export function useCreateGoods() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      customerId,
      customerName,
    }: {
      input: CreateGoodsInput;
      customerId: string;
      customerName: string;
    }) => goodsService.createGoods(input, customerId, customerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
    },
  });
}

export function useUpdateGoodsStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
      slotId,
    }: {
      id: string;
      status: GoodsItem["status"];
      note?: string;
      slotId?: string;
    }) => goodsService.updateStatus(id, status, note, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["logistics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
    },
  });
}

export function useTransferGoodsSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      targetSlotId,
      reason,
      note,
    }: {
      id: string;
      targetSlotId: string;
      reason: string;
      note?: string;
    }) => goodsService.transferSlot(id, targetSlotId, reason, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsKeys.all });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });

    },
  });
}
