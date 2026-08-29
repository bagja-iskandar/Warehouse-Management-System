import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService, NotificationQueryOptions } from "@/services/notification.service";
import { useAuth } from "@/hooks/use-auth";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (options?: NotificationQueryOptions) => [...notificationKeys.lists(), options] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export function useNotifications(
  options?: NotificationQueryOptions,
  queryOptions?: { enabled?: boolean }
) {
  const { isAuthenticated } = useAuth();
  const isEnabled =
    (queryOptions?.enabled !== undefined ? queryOptions.enabled : true) &&
    isAuthenticated;

  return useQuery({
    queryKey: notificationKeys.list(options),
    queryFn: () => notificationService.getNotifications(options),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 10000 : false,
    refetchOnWindowFocus: isEnabled,
    staleTime: 5000,
  });
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 10000, // Background polling every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["logistics"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["operational-counts"] });
      queryClient.invalidateQueries({ queryKey: ["logistics"] });
    },
  });
}
