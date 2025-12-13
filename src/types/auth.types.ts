/**
 * Authentication Types
 * Matches the backend API contracts
 */

// ============================================================================
// Request Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  uuid: string;
  email: string;
  role: string;
  permissions: string[];
  user_type: "admin";
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface LogoutResponse {
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ValidationError {
  detail: ValidationErrorDetail[];
}

export interface ApiError {
  detail?: string | ValidationErrorDetail[];
  message?: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface AuthUser {
  uuid: string;
  email: string;
  role: string;
  permissions: string[];
  user_type: "admin";
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StoredAuthData {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  expires_at: number; // Unix timestamp
}
