import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get("wms_auth_token")?.value;
  const userRole = request.cookies.get("wms_user_role")?.value;

  const isAuthenticated = Boolean(authToken);

  // Helper to determine destination dashboard by role
  const getRoleDashboard = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DRIVER":
        return "/driver/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      default:
        return "/login";
    }
  };

  // 1. Protected Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), request.url));
    }
  }

  // 2. Protected Customer Routes
  if (pathname.startsWith("/customer")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== "CUSTOMER") {
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), request.url));
    }
  }

  // 3. Protected Driver Routes
  if (pathname.startsWith("/driver")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole && userRole !== "DRIVER") {
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), request.url));
    }
  }

  // 4. Protected Profile Routes (Available to all authenticated roles)
  if (pathname.startsWith("/profile")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Auth / Guest-only Routes (Redirect already-authenticated users)
  if (pathname === "/login" || pathname === "/register") {
    if (isAuthenticated && userRole) {
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
    "/driver/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
