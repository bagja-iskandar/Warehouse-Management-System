"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { LoginCredentials, UserProfile, UserRole, RegisterCustomerInput } from "@/types";
import { SEED_USERS } from "@/mock/seed/users.seed";

export const DEMO_CREDENTIALS: Record<
  UserRole,
  { email: string; password: string; roleName: string; description: string }
> = {
  ADMIN: {
    email: "admin@wms.id",
    password: "password123",
    roleName: "Admin Gudang",
    description: "Akses penuh manajemen kapasitas rak, armada, & tagihan",
  },
  CUSTOMER: {
    email: "customer@freshfoods.id",
    password: "password123",
    roleName: "Customer Perusahaan",
    description: "Sewa ruang cold storage, booking, & monitoring barang",
  },
  DRIVER: {
    email: "driver@wms.id",
    password: "password123",
    roleName: "Driver Logistik",
    description: "Tugas penjemputan/pengantaran & pemilihan armada truk",
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
      toast.success("Autentikasi Berhasil", {
        description: `Selamat datang kembali, ${authenticatedUser.name}`,
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
      toast.error("Gagal Masuk", {
        description: error.message || "Email atau kata sandi tidak valid.",
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
      toast.success("Pendaftaran Berhasil", {
        description: `Akun perusahaan ${newUser.companyName || newUser.name} berhasil dibuat.`,
      });
      router.push("/customer/dashboard");
    },
    onError: (error: Error) => {
      toast.error("Pendaftaran Gagal", {
        description: error.message || "Gagal membuat akun customer.",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (!user) throw new Error("Pengguna tidak terautentikasi.");
      return await authService.updateProfile(user.id, updates);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Profil Berhasil Diperbarui", {
        description: "Informasi akun dan data perusahaan berhasil disimpan.",
      });
    },
    onError: (error: Error) => {
      toast.error("Gagal Memperbarui Profil", {
        description: error.message || "Terjadi kesalahan saat memperbarui profil.",
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
      if (!user) throw new Error("Pengguna tidak terautentikasi.");
      return await authService.changePassword(user.id, currentPass, newPass);
    },
    onSuccess: () => {
      toast.success("Kata Sandi Berhasil Diperbarui", {
        description: "Kata sandi akun Anda telah berhasil diubah.",
      });
    },
    onError: (error: Error) => {
      toast.error("Gagal Mengubah Kata Sandi", {
        description: error.message || "Kata sandi saat ini tidak valid.",
      });
    },
  });

  const logout = () => {
    storeLogout();
    queryClient.clear();
    toast.info("Sesi Berakhir", {
      description: "Anda telah keluar dari sistem operasional WMS.",
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
