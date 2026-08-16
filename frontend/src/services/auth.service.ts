import { mockDb } from "@/mock/db/mock-db";
import { UserProfile, LoginCredentials, RegisterCustomerInput } from "@/types";

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<UserProfile>;
  registerCustomer(input: RegisterCustomerInput): Promise<UserProfile>;
  updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  changePassword(id: string, currentPass: string, newPass: string): Promise<boolean>;
  getCurrentUser(id: string): Promise<UserProfile | null>;
  deleteAccount(id: string): Promise<boolean>;
  getUsers(): Promise<UserProfile[]>;
}

export class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const user = await mockDb.getUserByEmail(credentials.email);
    if (!user) {
      // If role specified during demo, find first user with that role
      if (credentials.role) {
        const users = await mockDb.getUsers();
        const roleUser = users.find((u) => u.role === credentials.role);
        if (roleUser) return roleUser;
      }
      throw new Error("Email atau password tidak ditemukan.");
    }
    return user;
  }

  async registerCustomer(input: RegisterCustomerInput): Promise<UserProfile> {
    const existing = await mockDb.getUserByEmail(input.email);
    if (existing) {
      throw new Error("Email sudah terdaftar.");
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

    return mockDb.createUser(newUser);
  }

  async updateProfile(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    return mockDb.updateUser(id, updates);
  }

  async changePassword(
    id: string,
    currentPass: string,
    newPass: string
  ): Promise<boolean> {
    if (!currentPass || !newPass) {
      throw new Error("Kata sandi saat ini dan kata sandi baru wajib diisi.");
    }
    if (newPass.length < 6) {
      throw new Error("Kata sandi baru minimal 6 karakter.");
    }
    // In mock DB, simulate successful password change
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }

  async getCurrentUser(id: string): Promise<UserProfile | null> {
    return mockDb.getUserById(id);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return mockDb.deleteUser(id);
  }

  async getUsers(): Promise<UserProfile[]> {
    return mockDb.getUsers();
  }
}

export const authService: IAuthService = new MockAuthService();
