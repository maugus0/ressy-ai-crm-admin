/**
 * Authentication Service
 * Handles all authentication API calls
 */

import {
  api,
  getStoredAuthData,
  setStoredAuthData,
  clearStoredAuthData,
  getAccessToken,
} from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutResponse,
  AuthUser,
  StoredAuthData,
} from "@/types/auth.types";

// ============================================================================
// Types
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// ============================================================================
// Auth Service
// ============================================================================

/**
 * Login with admin credentials
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const payload: LoginRequest = {
    email: credentials.email,
    password: credentials.password,
  };

  const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.ADMIN_LOGIN, payload, {
    skipAuth: true,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: response.error || "Login failed",
    };
  }

  const { access_token, refresh_token, uuid, email, role, permissions, user_type, expires_in } =
    response.data;

  // Calculate expiration timestamp
  const expires_at = Date.now() + expires_in * 1000;

  // Store auth data
  const authData: StoredAuthData = {
    access_token,
    refresh_token,
    user: {
      uuid,
      email,
      role,
      permissions,
      user_type,
    },
    expires_at,
  };

  setStoredAuthData(authData);

  return {
    success: true,
    user: authData.user,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
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

  const response = await api.post<RefreshTokenResponse>(ENDPOINTS.AUTH.REFRESH, payload, {
    skipAuth: true,
  });

  if (response.error || !response.data) {
    // Clear auth data on refresh failure
    clearStoredAuthData();
    return {
      success: false,
      error: response.error || "Token refresh failed",
    };
  }

  const { access_token, refresh_token: new_refresh_token, expires_in } = response.data;

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
};

/**
 * Logout and invalidate session
 */
export const logout = async (): Promise<void> => {
  const token = getAccessToken();

  // Call logout endpoint if we have a token
  if (token) {
    await api.post<LogoutResponse>(ENDPOINTS.AUTH.LOGOUT);
  }

  // Always clear local auth data
  clearStoredAuthData();
};

/**
 * Check if user is authenticated (has valid stored auth data)
 */
export const isAuthenticated = (): boolean => {
  const authData = getStoredAuthData() as StoredAuthData | null;

  if (!authData?.access_token) {
    return false;
  }

  // Check if token is expired (with 30 second buffer)
  const isExpired = Date.now() >= authData.expires_at - 30000;

  return !isExpired;
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenExpiringSoon = (): boolean => {
  const authData = getStoredAuthData() as StoredAuthData | null;

  if (!authData?.expires_at) {
    return false;
  }

  // Check if expiring within 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= authData.expires_at - fiveMinutes;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): AuthUser | null => {
  const authData = getStoredAuthData() as StoredAuthData | null;
  return authData?.user || null;
};

/**
 * Get current access token
 */
export { getAccessToken };
