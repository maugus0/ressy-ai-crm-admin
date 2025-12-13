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
import { env } from "@/config/env";
import type { AuthUser } from "@/types/auth.types";

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
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
  const refreshIntervalRef = useRef<number | null>(null);

  /**
   * Stop the token refresh interval
   */
  const stopRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log("[Auth] Token refresh interval stopped");
    }
  }, []);

  /**
   * Refresh the access token
   */
  const refreshAccessToken = useCallback(async () => {
    // Only refresh if we're authenticated and token is expiring soon
    if (!checkIsAuthenticated()) {
      return;
    }

    if (isTokenExpiringSoon()) {
      console.log("[Auth] Token expiring soon, refreshing...");
      const result = await authRefreshToken();

      if (!result.success) {
        console.error("[Auth] Token refresh failed:", result.error);
        // Token refresh failed, log out the user
        setAuthenticated(false);
        setUser(null);
        stopRefreshInterval();
      } else {
        console.log("[Auth] Token refreshed successfully");
      }
    }
  }, [stopRefreshInterval]);

  /**
   * Start the token refresh interval
   */
  const startRefreshInterval = useCallback(() => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval (every 10 minutes)
    refreshIntervalRef.current = window.setInterval(() => {
      refreshAccessToken();
    }, env.TOKEN_REFRESH_INTERVAL);

    console.log("[Auth] Token refresh interval started");
  }, [refreshAccessToken]);

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
        if (isTokenExpiringSoon()) {
          await refreshAccessToken();
        }

        // Start refresh interval
        startRefreshInterval();
      }

      setIsLoading(false);
    };

    initAuth();

    // Cleanup interval on unmount
    return () => {
      stopRefreshInterval();
    };
  }, [refreshAccessToken, startRefreshInterval, stopRefreshInterval]);

  /**
   * Handle user login
   */
  const login = async (credentials: LoginCredentials) => {
    const response = await authLogin(credentials);

    if (response.success && response.user) {
      setAuthenticated(true);
      setUser(response.user);
      startRefreshInterval();
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
