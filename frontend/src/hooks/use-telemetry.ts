import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telemetryService } from "@/services";

export const telemetryKeys = {
  all: ["telemetry"] as const,
  monitoring: (warehouseId?: string | null) =>
    [...telemetryKeys.all, "monitoring", warehouseId || "all"] as const,
  logs: (params?: Record<string, any>) =>
    [...telemetryKeys.all, "logs", params] as const,
};

export function useTelemetryMonitoring(warehouseId?: string | null) {
  return useQuery({
    queryKey: telemetryKeys.monitoring(warehouseId),
    queryFn: () => telemetryService.getMonitoringSnapshot(warehouseId || undefined),
    refetchInterval: 1000 * 15, // Real-time poll every 15s
    staleTime: 1000 * 10,
  });
}

export function useTelemetryLogs(params?: {
  warehouseId?: string | null;
  vehicleId?: string | null;
  isAnomaly?: boolean;
}) {
  return useQuery({
    queryKey: telemetryKeys.logs(params),
    queryFn: () =>
      telemetryService.getTelemetryLogs(
        params
          ? {
              warehouseId: params.warehouseId || undefined,
              vehicleId: params.vehicleId || undefined,
              isAnomaly: params.isAnomaly,
            }
          : undefined
      ),
    staleTime: 1000 * 30,
  });
}

export function useIngestTelemetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      warehouseId?: string;
      slotId?: string;
      vehicleId?: string;
      temperatureCelsius: number;
      humidityPercent?: number;
    }) => telemetryService.ingestTelemetry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telemetryKeys.all });
    },
  });
}
