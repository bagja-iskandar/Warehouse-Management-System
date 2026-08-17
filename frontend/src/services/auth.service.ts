import { mockDb } from "@/mock/db/mock-db";
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
      setStoredTokens(res.accessToken, res.refreshToken);
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
      setStoredTokens(res.accessToken, res.refreshToken);
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

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const user = await mockDb.getUserByEmail(credentials.email);
    if (!user) {
      if (credentials.role) {
        const users = await mockDb.getUsers();
        const roleUser = users.find((u) => u.role === credentials.role);
        if (roleUser) {
          setStoredTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
          return roleUser;
        }
      }
      throw new Error("Invalid email or password.");
    }
    setStoredTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
    return user;
  }

  async getCurrentUser(id?: string): Promise<UserProfile | null> {
    if (!id) {
      const users = await mockDb.getUsers();
      return users[0] || null;
    }
    return mockDb.getUserById(id);
  }

  async logout(): Promise<boolean> {
    clearStoredTokens();
    return true;
  }

  async registerCustomer(input: RegisterCustomerInput): Promise<UserProfile> {
    const existing = await mockDb.getUserByEmail(input.email);
    if (existing) {
      throw new Error("Email is already registered.");
    }

    const newUser: UserProfile = {
      id: `usr-cust-${Date.now()}`,
      name: input.name,
      email: input.email,
      role: "CUSTOMER",
      phone: input.phone,
      companyName: input.companyName,
      address: input.address,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    };

    setStoredTokens("mock-jwt-access-token", "mock-jwt-refresh-token");
    return mockDb.createUser(newUser);
  }

  async updateProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    return mockDb.updateUser(id, updates);
  }

  async changePassword(
    _id: string,
    currentPass: string,
    newPass: string
  ): Promise<boolean> {
    if (!currentPass || !newPass) {
      throw new Error("Current password and new password are required.");
    }
    if (newPass.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return mockDb.deleteUser(id);
  }

  async getUsers(): Promise<UserProfile[]> {
    return mockDb.getUsers();
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const authService: IAuthService = isMock
  ? new MockAuthService()
  : new HttpAuthService();
