import { UserProfile, LoginCredentials, RegisterCustomerInput } from "@/types";
import {
  apiClient,
  setStoredTokens,
  clearStoredTokens,
  getStoredRefreshToken,
} from "@/lib/api-client";

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<UserProfile>;
  registerCustomer(input: RegisterCustomerInput): Promise<UserProfile>;
  updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  changePassword(id: string, currentPass: string, newPass: string): Promise<boolean>;
  /** Step 1: Request a one-time secure reset token for the given email */
  requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }>;
  /** Step 2: Confirm reset using the token obtained in step 1 */
  confirmPasswordReset(token: string, newPassword: string): Promise<boolean>;
  getCurrentUser(id?: string): Promise<UserProfile | null>;
  logout(): Promise<boolean>;
  deleteAccount(id: string): Promise<boolean>;
  getUsers(): Promise<UserProfile[]>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email and password are required.");
    }

    const res = await apiClient<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      expiresIn: number;
      user: UserProfile;
    }>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    if (res && res.accessToken && res.refreshToken) {
      setStoredTokens(res.accessToken, res.refreshToken, res.user?.role);
    }

    return res.user;
  }

  async getCurrentUser(_id?: string): Promise<UserProfile | null> {
    try {
      const user = await apiClient<UserProfile>("/auth/me");
      return user;
    } catch (err) {
      clearStoredTokens();
      return null;
    }
  }

  async logout(): Promise<boolean> {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await apiClient("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (err) {
      // Ignore network failure during logout
    } finally {
      clearStoredTokens();
    }
    return true;
  }

  async registerCustomer(input: RegisterCustomerInput): Promise<UserProfile> {
    const res = await apiClient<{
      accessToken?: string;
      refreshToken?: string;
      user?: UserProfile;
    }>("/auth/register", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(input),
    });

    if (res?.accessToken && res?.refreshToken) {
      setStoredTokens(res.accessToken, res.refreshToken, res.user?.role || "CUSTOMER");
    }

    if (res?.user) return res.user;

    // Fallback if backend returns user directly
    return res as unknown as UserProfile;
  }

  async updateProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    return apiClient<UserProfile>(`/users/${id}/profile`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async changePassword(
    _id: string,
    currentPass: string,
    newPass: string
  ): Promise<boolean> {
    await apiClient("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        currentPassword: currentPass,
        newPassword: newPass,
      }),
    });
    return true;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }> {
    const res = await apiClient<{ success: boolean; message: string; resetToken?: string }>("/auth/request-reset", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return { success: res.success ?? true, resetToken: res.resetToken };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    await apiClient("/auth/confirm-reset", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ token, newPassword }),
    });
    return true;
  }

  async deleteAccount(id: string): Promise<boolean> {
    await apiClient(`/users/${id}`, {
      method: "DELETE",
    });
    return true;
  }

  async getUsers(): Promise<UserProfile[]> {
    return apiClient<UserProfile[]>("/users");
  }
}

export const authService: IAuthService = new HttpAuthService();
