/**
 * Callers (Dashboard Users) Service
 * Handles customer/caller management API calls.
 * Dashboard-specific user management with RBAC.
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DashboardUser,
  DashboardUserListResponse,
  DashboardUserParams,
  DashboardUserCreateRequest,
  DashboardUserCreateResponse,
  DashboardUserUpdateRequest,
  DashboardUserUpdateResponse,
  DashboardUserDetailsResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

// ============================================================================
// List Users for Restaurant
// ============================================================================

/**
 * Get all users associated with a restaurant
 * Includes statistics: total calls, orders, and reservations
 */
export const getCallers = async (
  restaurantId: number,
  params: DashboardUserParams = {}
): Promise<DashboardUserListResponse> => {
  const { search, is_spam, limit = 50, offset = 0 } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (is_spam !== undefined) queryParams.set("is_spam", String(is_spam));
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String(offset));

  const url = `${ENDPOINTS.DASHBOARD_USERS.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<DashboardUserListResponse>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch users"));
  }

  return response.data;
};

// ============================================================================
// Get User Details
// ============================================================================

/**
 * Get detailed information about a specific user
 */
export const getCallerDetails = async (userId: number): Promise<DashboardUserDetailsResponse> => {
  const response = await api.get<DashboardUserDetailsResponse>(
    ENDPOINTS.DASHBOARD_USERS.GET(userId)
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch user details"));
  }

  return response.data;
};

// ============================================================================
// Create User
// ============================================================================

/**
 * Create a new user or add an existing user to the restaurant
 * - If user doesn't exist: Creates new user and associates with restaurant
 * - If user exists but not associated: Associates existing user with restaurant
 * - If user exists and already associated: Returns error
 */
export const createCaller = async (
  restaurantId: number,
  data: DashboardUserCreateRequest
): Promise<DashboardUserCreateResponse> => {
  const response = await api.post<DashboardUserCreateResponse>(
    ENDPOINTS.DASHBOARD_USERS.CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create user"));
  }

  return response.data;
};

// ============================================================================
// Update User
// ============================================================================

/**
 * Update a user's information
 */
export const updateCaller = async (
  userId: number,
  data: DashboardUserUpdateRequest
): Promise<DashboardUserUpdateResponse> => {
  const response = await api.put<DashboardUserUpdateResponse>(
    ENDPOINTS.DASHBOARD_USERS.UPDATE(userId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update user"));
  }

  return response.data;
};
