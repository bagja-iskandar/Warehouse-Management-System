import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile, UserRole } from "@/types";
import { getStoredAccessToken, clearStoredTokens, setAuthCookies } from "@/lib/api-client";

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
      setUser: (user, token) => {
        const resolvedToken =
          token ?? (typeof window !== "undefined" ? getStoredAccessToken() : null);
        if (user && resolvedToken) {
          setAuthCookies(resolvedToken, user.role);
        }
        set({
          user,
          isAuthenticated: !!user,
          token: resolvedToken,
        });
      },
      setRole: (role) => {
        set((state) => {
          const updatedUser = state.user ? { ...state.user, role } : null;
          if (updatedUser && state.token) {
            setAuthCookies(state.token, role);
          }
          return { user: updatedUser };
        });
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

// Register global handler for immediate store reset upon fatal 401 or token clearance
if (typeof window !== "undefined") {
  (window as any).__wms_auth_store_logout = () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, token: null });
  };
}
