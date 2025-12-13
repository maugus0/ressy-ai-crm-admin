/**
 * Users Service
 * Handles admin and client user API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminUser,
  AdminUserParams,
  ClientUser,
  ClientUserParams,
  PaginatedResponse,
} from "@/types/api.types";

// ============================================================================
// Admin Users (Ressy Platform Admins)
// ============================================================================

/**
 * Get paginated admin users
 */
export const getAdminUsers = async (
  params: AdminUserParams = {}
): Promise<PaginatedResponse<AdminUser>> => {
  const { page = 1, limit = 10, role_id } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (role_id) queryParams.set("role_id", String(role_id));

  const url = `${ENDPOINTS.ADMIN_USERS.LIST}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<AdminUser>>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch admin users");
  }

  return response.data;
};

/**
 * Get a single admin user by UUID
 */
export const getAdminUser = async (uuid: string): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(ENDPOINTS.ADMIN_USERS.GET(uuid));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch admin user");
  }

  return response.data;
};

// ============================================================================
// Client Users (Restaurant Users)
// ============================================================================

/**
 * Get paginated client users for a restaurant
 */
export const getClientUsers = async (
  restaurantId: number,
  params: ClientUserParams = {}
): Promise<PaginatedResponse<ClientUser>> => {
  const { page = 1, limit = 10, role_id } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (role_id) queryParams.set("role_id", String(role_id));

  const url = `${ENDPOINTS.CLIENT_USERS.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<ClientUser>>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch client users");
  }

  return response.data;
};

/**
 * Get a single client user by UUID
 */
export const getClientUser = async (restaurantId: number, uuid: string): Promise<ClientUser> => {
  const response = await api.get<ClientUser>(ENDPOINTS.CLIENT_USERS.GET(restaurantId, uuid));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch client user");
  }

  return response.data;
};
