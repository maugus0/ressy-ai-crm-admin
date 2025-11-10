/**
 * Mocked Authentication Service
 * This service simulates authentication without a real backend
 */

const AUTH_STORAGE_KEY = "ressy_auth_token";
const VALID_EMAIL = "ressy@admin.com";
const VALID_PASSWORD = "Ressy123";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Simulates a login API call with a delay
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Validate credentials
  if (credentials.email === VALID_EMAIL && credentials.password === VALID_PASSWORD) {
    // Generate a mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Store token in localStorage
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    
    return {
      success: true,
      token,
    };
  }

  return {
    success: false,
    error: "Invalid email or password",
  };
};

/**
 * Logs out the user by removing the token
 */
export const logout = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Checks if the user is currently authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  return !!token;
};

/**
 * Gets the current auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

