import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { refreshToken, isAuthenticated } from "@/services/auth";
import { getStoredAuthData } from "@/lib/api/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated: contextIsAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const refreshAttemptedRef = useRef(false);

  // Check and refresh token on navigation if needed
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // Prevent multiple simultaneous refresh attempts
      if (refreshAttemptedRef.current) {
        return;
      }

      const authData = getStoredAuthData();
      if (!authData?.expires_at) {
        return;
      }

      // Check if token is expired or expiring within 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      const shouldRefresh = Date.now() >= authData.expires_at - fiveMinutes;

      if (shouldRefresh && isAuthenticated()) {
        refreshAttemptedRef.current = true;
        try {
          await refreshToken();
        } finally {
          // Reset flag after refresh completes (success or failure)
          refreshAttemptedRef.current = false;
        }
      }
    };

    checkAndRefreshToken();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!contextIsAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
