import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  login as authLogin,
  logout as authLogout,
  refreshToken as authRefreshToken,
  isAuthenticated as checkIsAuthenticated,
  isTokenExpiringSoon,
  getCurrentUser,
  LoginCredentials,
} from "@/services/auth";
import { getStoredAuthData } from "@/lib/api/client";
import { env } from "@/config/env";
import type { AuthUser } from "@/types/auth.types";

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  /** Increments whenever token is refreshed - SSE can watch this to reconnect */
  tokenVersion: number;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenVersion, setTokenVersion] = useState(0);
  const refreshIntervalRef = useRef<number | null>(null);

  /**
   * Stop the token refresh interval
   */
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  /**
   * Refresh the access token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // Only refresh if we're authenticated
    if (!checkIsAuthenticated()) {
      return false;
    }

    // Check if token is expired or expiring soon
    const authData = getStoredAuthData();
    if (!authData?.expires_at) {
      return false;
    }

    // Refresh if expired or expiring within 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    const shouldRefresh = Date.now() >= authData.expires_at - fiveMinutes;

    if (shouldRefresh) {
      const result = await authRefreshToken();

      if (!result.success) {
        // Token refresh failed, log out the user
        setAuthenticated(false);
        setUser(null);
        stopRefreshInterval();
        return false;
      }

      // Update user data if needed
      if (result.user) {
        setUser(result.user);
      }

      // Increment token version so SSE can reconnect with new token
      setTokenVersion((v) => v + 1);
      console.log("Auth: Token refreshed, SSE will reconnect");

      return true;
    }

    return true;
  }, [stopRefreshInterval]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const isAuth = checkIsAuthenticated();

      if (isAuth) {
        setAuthenticated(true);
        setUser(getCurrentUser());

        // Check if token needs refresh on init
        await refreshAccessToken();

        // Start refresh interval
        // Clear any existing interval first
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }

        // Set up new interval (every 15 minutes)
        refreshIntervalRef.current = window.setInterval(() => {
          refreshAccessToken();
        }, env.TOKEN_REFRESH_INTERVAL);
      }

      setIsLoading(false);
    };

    initAuth();

    // Cleanup interval on unmount
    return () => {
      stopRefreshInterval();
    };
  }, [refreshAccessToken, stopRefreshInterval]);

  /**
   * Handle user login
   */
  const login = async (credentials: LoginCredentials) => {
    const response = await authLogin(credentials);

    if (response.success && response.user) {
      setAuthenticated(true);
      setUser(response.user);

      // Start refresh interval (inline setup to avoid dependency issues)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = window.setInterval(() => {
        refreshAccessToken();
      }, env.TOKEN_REFRESH_INTERVAL);

      return { success: true };
    }

    return { success: false, error: response.error };
  };

  /**
   * Handle user logout
   */
  const logout = async () => {
    stopRefreshInterval();
    await authLogout();
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,
        isLoading,
        user,
        tokenVersion,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
