export type UserRole = "ADMIN" | "CUSTOMER" | "DRIVER";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  companyName?: string;
  address?: string;
  createdAt: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  activeOrdersCount?: number;
}

export type User = UserProfile;

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role?: UserRole;
}

export interface RegisterCustomerInput {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  password?: string;
}
