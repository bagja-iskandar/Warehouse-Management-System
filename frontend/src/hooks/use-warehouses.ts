import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  warehouseService,
  RentSpaceInput,
  ChangeRentalWarehouseInput,
} from "@/services/warehouse.service";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  customerActive: () => [...warehouseKeys.all, "customer-active"] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

export function useWarehouses() {
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: () => warehouseService.getWarehouses(),
    staleTime: 1000 * 60 * 5, // 5 minutes (reference data)
    placeholderData: (previousData) => previousData,
  });
}

export function useCustomerActiveWarehouses() {
  return useQuery({
    queryKey: warehouseKeys.customerActive(),
    queryFn: () => warehouseService.getCustomerActiveWarehouses(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseService.getWarehouseById(id),
    enabled: !!id,
  });
}

export function useRentSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RentSpaceInput) => warehouseService.rentSpace(input),
    onSuccess: () => {
      // Invalidate relevant queries so UI reflects updated rental & invoices instantly
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
    },
  });
}

export function useChangeRentalWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangeRentalWarehouseInput) =>
      warehouseService.changeRentalWarehouse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["goods"] });
      queryClient.invalidateQueries({ queryKey: ["logistics"] });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
    },
  });
}
