/**
 * Centralized Resilient API Client for WMS Nusantara Frontend
 * Implements 15s Timeout, X-Request-ID Correlation, 401 Token Refresh Rotation,
 * HTTP Status Normalization, and Human-Friendly Error Messages.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const ACCESS_TOKEN_KEY = "wms_access_token";
const REFRESH_TOKEN_KEY = "wms_refresh_token";
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    path: string;
    correlationId?: string;
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
  };
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class AppApiError extends Error {
  public status: number;
  public code?: string;
  public correlationId?: string;
  public errors?: ApiErrorDetail[];
  public rawData?: any;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      correlationId?: string;
      errors?: ApiErrorDetail[];
      rawData?: any;
    }
  ) {
    super(message);
    this.name = "AppApiError";
    this.status = status;
    this.code = options?.code;
    this.correlationId = options?.correlationId;
    this.errors = options?.errors;
    this.rawData = options?.rawData;
  }
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
  timeoutMs?: number;
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

function generateRequestId(): string {
  return `wms_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Normalizes HTTP response status and payloads into human-friendly error messages
 */
function normalizeErrorMessage(status: number, data: any): string {
  let backendMsg: string | null = null;

  if (data) {
    if (typeof data.message === "string" && data.message.trim()) {
      backendMsg = data.message.trim();
    } else if (Array.isArray(data.message) && data.message.length > 0) {
      backendMsg = data.message.map((m: any) => (typeof m === "string" ? m : JSON.stringify(m))).join(", ");
    } else if (typeof data.error === "string" && data.error.trim()) {
      backendMsg = data.error.trim();
    }
  }

  // If backend provided a specific business message, prefer it unless it's a generic internal error
  if (backendMsg && !backendMsg.includes("Internal server error") && !backendMsg.includes("PrismaClient")) {
    return backendMsg;
  }

  switch (status) {
    case 400:
      return backendMsg || "Permintaan tidak valid. Silakan periksa kembali data yang dimasukkan.";
    case 401:
      return "Sesi login Anda telah berakhir. Silakan masuk kembali.";
    case 403:
      return "Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini.";
    case 404:
      return backendMsg || "Data yang dicari tidak ditemukan dalam sistem.";
    case 409:
      return backendMsg || "Terjadi konflik data operasional. Data mungkin telah diubah oleh pengguna lain.";
    case 422:
      return backendMsg || "Data tidak dapat diproses karena tidak memenuhi aturan bisnis.";
    case 429:
      return "Terlalu banyak permintaan ke server. Silakan tunggu beberapa saat sebelum mencoba kembali.";
    case 500:
      return "Terjadi kendala pada server WMS. Data Anda tetap aman. Silakan coba beberapa saat lagi.";
    case 502:
    case 503:
    case 504:
      return "Layanan server WMS Nusantara sedang tidak tersedia sementara. Silakan coba kembali.";
    default:
      return backendMsg || `Terjadi kesalahan operasional (Kode: ${status}).`;
  }
}

/**
 * Core Fetch Wrapper with Timeout, Interceptors, and Resilience
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    params,
    signal: callerSignal,
    ...fetchOptions
  } = options;

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

  const requestId = generateRequestId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": requestId,
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getStoredAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Setup Timeout Controller
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error("REQUEST_TIMEOUT"));
  }, timeoutMs);

  if (callerSignal) {
    callerSignal.addEventListener("abort", () => abortController.abort());
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: abortController.signal,
    });
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);

    if (fetchErr?.name === "AbortError" || fetchErr?.message === "REQUEST_TIMEOUT") {
      throw new AppApiError(
        "Permintaan melebihi batas waktu (timeout). Silakan periksa koneksi internet Anda dan coba lagi.",
        408,
        { code: "TIMEOUT", correlationId: requestId }
      );
    }

    if (typeof window !== "undefined" && !navigator.onLine) {
      throw new AppApiError(
        "Koneksi internet terputus. Pastikan perangkat Anda terhubung ke jaringan.",
        0,
        { code: "OFFLINE", correlationId: requestId }
      );
    }

    throw new AppApiError(
      "Tidak dapat terhubung ke server WMS Nusantara. Periksa koneksi jaringan Anda.",
      0,
      { code: "NETWORK_ERROR", correlationId: requestId }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle 401 Unauthorized with Automatic Refresh Token Rotation
  if (
    res.status === 401 &&
    !skipAuth &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/reset-password")
  ) {
    const refreshToken = getStoredRefreshToken();

    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Request-ID": generateRequestId(),
            },
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

            return handleResponse<T>(retryRes, requestId);
          } else {
            // Refresh token invalid or expired -> logout
            clearStoredTokens();
            isRefreshing = false;
            if (typeof window !== "undefined") {
              window.location.href = "/login?expired=true";
            }
            throw new AppApiError(
              "Sesi login Anda telah berakhir. Silakan masuk kembali.",
              401,
              { code: "SESSION_EXPIRED", correlationId: requestId }
            );
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
              resolve(await handleResponse<T>(retryRes, requestId));
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    } else {
      clearStoredTokens();
      throw new AppApiError(
        "Sesi login Anda tidak valid atau telah berakhir.",
        401,
        { code: "UNAUTHORIZED", correlationId: requestId }
      );
    }
  }

  return handleResponse<T>(res, requestId);
}

async function handleResponse<T>(res: Response, correlationId?: string): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = normalizeErrorMessage(res.status, data);
    const code = data?.code || data?.error;
    const errors = data?.errors;

    throw new AppApiError(message, res.status, {
      code,
      correlationId: data?.meta?.correlationId || correlationId,
      errors,
      rawData: data,
    });
  }

  // Extract 'data' from backend response envelope if present
  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}
