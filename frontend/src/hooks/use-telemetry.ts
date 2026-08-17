import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telemetryService } from "@/services";

export const telemetryKeys = {
  all: ["telemetry"] as const,
  monitoring: () => [...telemetryKeys.all, "monitoring"] as const,
  logs: (params?: Record<string, any>) =>
    [...telemetryKeys.all, "logs", params] as const,
};

export function useTelemetryMonitoring() {
  return useQuery({
    queryKey: telemetryKeys.monitoring(),
    queryFn: () => telemetryService.getMonitoringSnapshot(),
    refetchInterval: 1000 * 15, // Real-time poll every 15s
    staleTime: 1000 * 10,
  });
}

export function useTelemetryLogs(params?: {
  warehouseId?: string;
  vehicleId?: string;
  isAnomaly?: boolean;
}) {
  return useQuery({
    queryKey: telemetryKeys.logs(params),
    queryFn: () => telemetryService.getTelemetryLogs(params),
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
