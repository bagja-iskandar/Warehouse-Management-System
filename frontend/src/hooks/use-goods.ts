import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goodsService } from "@/services";
import { CreateGoodsInput, GoodsItem } from "@/types";

export const goodsKeys = {
  all: ["goods"] as const,
  lists: () => [...goodsKeys.all, "list"] as const,
  list: (customerId?: string) => [...goodsKeys.lists(), { customerId }] as const,
  details: () => [...goodsKeys.all, "detail"] as const,
  detail: (id: string) => [...goodsKeys.details(), id] as const,
};

export function useGoods(customerId?: string) {
  return useQuery({
    queryKey: goodsKeys.list(customerId),
    queryFn: () => goodsService.getGoods(customerId),
    staleTime: 1000 * 60 * 3,
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
    },
  });
}
