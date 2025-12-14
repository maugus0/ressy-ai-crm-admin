/**
 * Token Refresh Utilities
 * Centralized token refresh logic to avoid circular dependencies
 */

import { getStoredAuthData, setStoredAuthData, clearStoredAuthData } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import type { RefreshTokenRequest, RefreshTokenResponse, StoredAuthData } from "@/types/auth.types";

/**
 * Refresh access token using refresh token
 * This function is here to avoid circular dependency between client.ts and auth.ts
 */
export const refreshTokenDirect = async (): Promise<{
  success: boolean;
  error?: string;
  user?: unknown;
}> => {
  const authData = getStoredAuthData() as StoredAuthData | null;

  if (!authData?.refresh_token) {
    return {
      success: false,
      error: "No refresh token available",
    };
  }

  const payload: RefreshTokenRequest = {
    refresh_token: authData.refresh_token,
  };

  try {
    const url = `${env.API_URL}${ENDPOINTS.AUTH.REFRESH}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      clearStoredAuthData();
      return {
        success: false,
        error: json.detail || json.message || "Token refresh failed",
      };
    }

    const data: RefreshTokenResponse = await response.json();
    const { access_token, refresh_token: new_refresh_token, expires_in } = data;

    // Update stored auth data with new tokens
    const updatedAuthData: StoredAuthData = {
      ...authData,
      access_token,
      refresh_token: new_refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    };

    setStoredAuthData(updatedAuthData);

    return {
      success: true,
      user: authData.user,
    };
  } catch (error) {
    clearStoredAuthData();
    return {
      success: false,
      error: error instanceof Error ? error.message : "Token refresh failed",
    };
  }
};
