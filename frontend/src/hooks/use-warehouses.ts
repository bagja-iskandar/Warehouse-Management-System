import { useQuery } from "@tanstack/react-query";
import { warehouseService } from "@/services";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

export function useWarehouses() {
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: () => warehouseService.getWarehouses(),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseService.getWarehouseById(id),
    enabled: !!id,
  });
}
