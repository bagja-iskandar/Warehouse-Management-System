/**
 * Centralized API Client for WMS Nusantara Frontend
 * Handles baseURL, Bearer Token injection, 401 Token Refresh Rotation, and Error Handling.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const ACCESS_TOKEN_KEY = "wms_access_token";
const REFRESH_TOKEN_KEY = "wms_refresh_token";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  data?: any;
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    timestamp: string;
    path: string;
  };
}

// Token Storage Helpers (Client-side safe)
export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Core Fetch Wrapper with Interceptors
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, params, ...fetchOptions } = options;

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 Unauthorized with Automatic Refresh Token Rotation
  if (res.status === 401 && !skipAuth && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    const refreshToken = getStoredRefreshToken();

    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData: ApiResponse<{
              accessToken: string;
              refreshToken: string;
            }> = await refreshRes.json();

            setStoredTokens(
              refreshData.data.accessToken,
              refreshData.data.refreshToken
            );
            isRefreshing = false;
            onRefreshed(refreshData.data.accessToken);

            // Retry original request with new token
            headers["Authorization"] = `Bearer ${refreshData.data.accessToken}`;
            const retryRes = await fetch(url, {
              ...fetchOptions,
              headers,
            });

            return handleResponse<T>(retryRes);
          } else {
            // Refresh token invalid or expired -> logout
            clearStoredTokens();
            isRefreshing = false;
            if (typeof window !== "undefined") {
              window.location.href = "/login?expired=true";
            }
            throw new Error("Your session has expired. Please sign in again.");
          }
        } catch (refreshErr) {
          clearStoredTokens();
          isRefreshing = false;
          throw refreshErr;
        }
      } else {
        // Wait for token refresh to complete
        return new Promise<T>((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            try {
              headers["Authorization"] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, {
                ...fetchOptions,
                headers,
              });
              resolve(await handleResponse<T>(retryRes));
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    } else {
      clearStoredTokens();
      throw new Error("Authentication failed: Your session is invalid or has expired.");
    }
  }

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg =
      data?.message ||
      `HTTP Error ${res.status}: ${res.statusText || "An error occurred on the server"}`;
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    (error as any).data = data;
    throw error;
  }

  // Extract 'data' from backend response envelope if present
  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}
