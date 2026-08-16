import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "@/types";
import { SEED_USERS } from "@/mock/seed/users.seed";

interface AuthStoreState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      // Default to Admin during foundation testing, easily switchable via Header Role Switcher
      user: SEED_USERS[0],
      isAuthenticated: true,
      token: "mock-jwt-token-wms-v1",
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setRole: (role) => {
        const found = SEED_USERS.find((u) => u.role === role) || null;
        set({ user: found, isAuthenticated: !!found });
      },
      logout: () => set({ user: null, isAuthenticated: false, token: null }),
    }),
    {
      name: "wms-auth-storage",
    }
  )
);
