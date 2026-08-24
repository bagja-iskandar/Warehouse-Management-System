import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services";
import { useAuth } from "@/hooks/use-auth";

export const operationalCountsKeys = {
  all: ["operational-counts"] as const,
  current: (userId?: string, role?: string) =>
    [...operationalCountsKeys.all, userId || "anonymous", role || "none"] as const,
};

export function useOperationalCounts() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: operationalCountsKeys.current(user?.id, user?.role),
    queryFn: () => analyticsService.getOperationalCounts(),
    enabled: isAuthenticated,
    staleTime: 5000,
    refetchInterval: 10000, // Background polling every 10 seconds for real-time responsiveness
    refetchOnWindowFocus: true,
  });
}
