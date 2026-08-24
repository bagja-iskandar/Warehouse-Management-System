import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { User } from "@/types";

export function useUsers(role?: "ADMIN" | "CUSTOMER" | "DRIVER") {
  return useQuery<User[]>({
    queryKey: ["users", { role: role || "all" }],
    queryFn: async () => {
      const users = await apiClient<User[]>("/users");
      if (!Array.isArray(users)) return [];
      if (role) {
        return users.filter((u) => u.role === role);
      }
      return users;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useDrivers() {
  return useQuery<User[]>({
    queryKey: ["users", { role: "DRIVER" }],
    queryFn: async () => {
      const users = await apiClient<User[]>("/users");
      if (!Array.isArray(users)) return [];
      return users.filter((u) => u.role === "DRIVER" && u.status === "ACTIVE");
    },
    staleTime: 1000 * 60 * 5,
  });
}
