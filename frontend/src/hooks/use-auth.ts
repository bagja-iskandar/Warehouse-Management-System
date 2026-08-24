"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { LoginCredentials, UserProfile, UserRole, RegisterCustomerInput } from "@/types";
import { SEED_USERS } from "@/mock/seed/users.seed";

import { analyticsKeys } from "@/hooks/use-analytics";
import { operationalCountsKeys } from "@/hooks/use-operational-counts";
import { analyticsService } from "@/services/analytics.service";

export const DEMO_CREDENTIALS: Record<
  UserRole,
  { email: string; password: string; roleName: string; description: string }
> = {
  ADMIN: {
    email: "admin@wms.id",
    password: "Password123!",
    roleName: "Warehouse Admin",
    description: "Full access to rack capacity, fleet, & billing management",
  },
  CUSTOMER: {
    email: "customer@freshfoods.id",
    password: "Password123!",
    roleName: "Corporate Customer",
    description: "Rent cold storage space, bookings, & goods monitoring",
  },
  DRIVER: {
    email: "driver@wms.id",
    password: "Password123!",
    roleName: "Logistics Driver",
    description: "Pickup/delivery tasks & truck fleet selection",
  },
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, setUser, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<UserProfile> => {
      return await authService.login(credentials);
    },
    onSuccess: (authenticatedUser) => {
      setUser(authenticatedUser);
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      // Pre-warm dashboard queries immediately upon login
      try {
        if (authenticatedUser.role === "ADMIN") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.adminOverview(),
            queryFn: () => analyticsService.getAdminOverview(),
            staleTime: 1000 * 45,
          });
          queryClient.prefetchQuery({
            queryKey: operationalCountsKeys.current(authenticatedUser.id, authenticatedUser.role),
            queryFn: () => analyticsService.getOperationalCounts(),
            staleTime: 1000 * 15,
          });
        } else if (authenticatedUser.role === "CUSTOMER") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.customerSummary(authenticatedUser.id),
            queryFn: () => analyticsService.getCustomerSummary(authenticatedUser.id),
            staleTime: 1000 * 45,
          });
          queryClient.prefetchQuery({
            queryKey: operationalCountsKeys.current(authenticatedUser.id, authenticatedUser.role),
            queryFn: () => analyticsService.getOperationalCounts(),
            staleTime: 1000 * 15,
          });
        } else if (authenticatedUser.role === "DRIVER") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.driverSummary(authenticatedUser.id),
            queryFn: () => analyticsService.getDriverSummary(authenticatedUser.id),
            staleTime: 1000 * 45,
          });
          queryClient.prefetchQuery({
            queryKey: operationalCountsKeys.current(authenticatedUser.id, authenticatedUser.role),
            queryFn: () => analyticsService.getOperationalCounts(),
            staleTime: 1000 * 15,
          });
        }
      } catch {
        // safe fallback
      }

      toast.success("Authentication Successful", {
        description: `Welcome back, ${authenticatedUser.name}`,
      });

      // Role-based redirection
      switch (authenticatedUser.role) {
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "CUSTOMER":
          router.push("/customer/dashboard");
          break;
        case "DRIVER":
          router.push("/driver/dashboard");
          break;
        default:
          router.push("/");
          break;
      }
    },
    onError: (error: Error) => {
      toast.error("Sign In Failed", {
        description: error.message || "Invalid email or password.",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterCustomerInput): Promise<UserProfile> => {
      return await authService.registerCustomer(input);
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Registration Successful", {
        description: `Corporate account ${newUser.companyName || newUser.name} created successfully.`,
      });
      router.push("/customer/dashboard");
    },
    onError: (error: Error) => {
      toast.error("Registration Failed", {
        description: error.message || "Failed to create customer account.",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (!user) throw new Error("User not authenticated.");
      return await authService.updateProfile(user.id, updates);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Profile Updated Successfully", {
        description: "Account information and company details saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to Update Profile", {
        description: error.message || "An error occurred while updating profile.",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPass,
      newPass,
    }: {
      currentPass: string;
      newPass: string;
    }): Promise<boolean> => {
      if (!user) throw new Error("User not authenticated.");
      return await authService.changePassword(user.id, currentPass, newPass);
    },
    onSuccess: () => {
      toast.success("Password Updated Successfully", {
        description: "Your account password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to Change Password", {
        description: error.message || "Current password is invalid.",
      });
    },
  });

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore network error on logout
    }
    storeLogout();
    queryClient.clear();
    toast.info("Session Ended", {
      description: "You have signed out of WMS operations.",
    });
    router.push("/login");
  };

  const getDemoUser = (role: UserRole) => {
    return SEED_USERS.find((u) => u.role === role);
  };

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isPending: loginMutation.isPending,
    error: loginMutation.error,
    isError: loginMutation.isError,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    logout,
    getDemoUser,
    demoCredentials: DEMO_CREDENTIALS,
  };
}
