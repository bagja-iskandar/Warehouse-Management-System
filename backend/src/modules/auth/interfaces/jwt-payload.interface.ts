import { UserRole, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string | null;
  companyName?: string | null;
  address?: string | null;
  status: UserStatus;
}
