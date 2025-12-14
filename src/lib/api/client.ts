/**
 * API Client
 * Centralized HTTP client with authentication handling
 */

import { env } from "@/config/env";
import { refreshTokenDirect } from "@/lib/utils/tokenRefresh";

// ============================================================================
// Types
// ============================================================================

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  AUTH_DATA: "ressy_auth_data",
} as const;

// ============================================================================
// Token Management
// ============================================================================

export const getStoredAuthData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_DATA);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setStoredAuthData = (data: unknown) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_DATA, JSON.stringify(data));
};

export const clearStoredAuthData = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_DATA);
};

export const getAccessToken = (): string | null => {
  const authData = getStoredAuthData();
  return authData?.access_token || null;
};

export const getRefreshToken = (): string | null => {
  const authData = getStoredAuthData();
  return authData?.refresh_token || null;
};

// ============================================================================
// API Client
// ============================================================================

/**
 * Makes an API request with automatic auth header injection
 */
export async function apiRequest<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, headers = {}, ...restConfig } = config;

  // Build headers
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };

  // Add auth header if not skipped
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      (requestHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const url = endpoint.startsWith("http") ? endpoint : `${env.API_URL}${endpoint}`;

    let response = await fetch(url, {
      ...restConfig,
      headers: requestHeaders,
    });

    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401 && !skipAuth && getAccessToken()) {
      // Attempt to refresh token
      const refreshResult = await refreshTokenDirect();

      if (refreshResult.success) {
        // Retry the original request with new token
        const newToken = getAccessToken();
        if (newToken) {
          (requestHeaders as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;

          response = await fetch(url, {
            ...restConfig,
            headers: requestHeaders,
          });
        }
      } else {
        // Refresh failed, return 401 error
        return {
          data: null,
          error: "Session expired. Please login again.",
          status: 401,
        };
      }
    }

    // Parse response
    let data: T | null = null;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const json = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage =
          typeof json.detail === "string"
            ? json.detail
            : json.message || `Request failed with status ${response.status}`;

        return {
          data: null,
          error: errorMessage,
          status: response.status,
        };
      }

      data = json as T;
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return {
      data: null,
      error: message,
      status: 0,
    };
  }
}

// ============================================================================
// HTTP Methods
// ============================================================================

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: "DELETE" }),
};
