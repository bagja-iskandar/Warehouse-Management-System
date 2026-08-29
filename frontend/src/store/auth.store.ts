import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "@/types";
import { getStoredAccessToken, clearStoredTokens } from "@/lib/api-client";

interface AuthStoreState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setUser: (user: UserProfile | null, token?: string) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setUser: (user, token) =>
        set({
          user,
          isAuthenticated: !!user,
          token:
            token ??
            (typeof window !== "undefined" ? getStoredAccessToken() : null),
        }),
      setRole: (role) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        }));
      },
      logout: () => {
        clearStoredTokens();
        set({ user: null, isAuthenticated: false, token: null });
      },
    }),
    {
      name: "wms-auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
