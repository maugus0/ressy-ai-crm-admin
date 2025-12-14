/**
 * Users Service
 * Handles admin and client user API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminUser,
  AdminUserParams,
  AdminUserCreateRequest,
  AdminUserUpdateRequest,
  AdminUserResetPasswordRequest,
  AdminUserUpdateRoleRequest,
  AdminUserBulkCreateRequest,
  AdminUserBulkCreateResponse,
  ClientUser,
  ClientUserParams,
  ClientUserCreateRequest,
  ClientUserUpdateRequest,
  ClientUserResetPasswordRequest,
  ClientUserUpdateRoleRequest,
  ClientUserBulkCreateRequest,
  ClientUserBulkCreateResponse,
  PaginatedResponse,
  MessageResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

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

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (role_id !== undefined) queryParams.set("role_id", String(role_id));

  const url = `${ENDPOINTS.ADMIN_USERS.LIST}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<AdminUser>>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch admin users"));
  }

  return response.data;
};

/**
 * Get a single admin user by UUID
 */
export const getAdminUser = async (uuid: string): Promise<AdminUser> => {
  const response = await api.get<AdminUser>(ENDPOINTS.ADMIN_USERS.GET(uuid));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch admin user"));
  }

  return response.data;
};

/**
 * Create a new admin user
 */
export const createAdminUser = async (data: AdminUserCreateRequest): Promise<AdminUser> => {
  const response = await api.post<AdminUser>(ENDPOINTS.ADMIN_USERS.CREATE, data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create admin user"));
  }

  return response.data;
};

/**
 * Update an admin user
 */
export const updateAdminUser = async (
  uuid: string,
  data: AdminUserUpdateRequest
): Promise<AdminUser> => {
  const response = await api.put<AdminUser>(ENDPOINTS.ADMIN_USERS.UPDATE(uuid), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update admin user"));
  }

  return response.data;
};

/**
 * Delete an admin user
 */
export const deleteAdminUser = async (uuid: string): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.ADMIN_USERS.DELETE(uuid));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete admin user"));
  }

  return response.data;
};

/**
 * Reset admin user password
 */
export const resetAdminPassword = async (
  uuid: string,
  data: AdminUserResetPasswordRequest
): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(
    ENDPOINTS.ADMIN_USERS.RESET_PASSWORD(uuid),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to reset admin password"));
  }

  return response.data;
};

/**
 * Update admin user role
 */
export const updateAdminRole = async (
  uuid: string,
  data: AdminUserUpdateRoleRequest
): Promise<AdminUser> => {
  const response = await api.patch<AdminUser>(ENDPOINTS.ADMIN_USERS.UPDATE_ROLE(uuid), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update admin role"));
  }

  return response.data;
};

/**
 * Bulk create admin users
 */
export const bulkCreateAdminUsers = async (
  data: AdminUserBulkCreateRequest
): Promise<AdminUserBulkCreateResponse> => {
  const response = await api.post<AdminUserBulkCreateResponse>(
    ENDPOINTS.ADMIN_USERS.BULK_CREATE,
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to bulk create admin users"));
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

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (role_id !== undefined) queryParams.set("role_id", String(role_id));

  const url = `${ENDPOINTS.CLIENT_USERS.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<ClientUser>>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch client users"));
  }

  return response.data;
};

/**
 * Get a single client user by UUID
 */
export const getClientUser = async (restaurantId: number, uuid: string): Promise<ClientUser> => {
  const response = await api.get<ClientUser>(ENDPOINTS.CLIENT_USERS.GET(restaurantId, uuid));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch client user"));
  }

  return response.data;
};

/**
 * Create a new client user for a restaurant
 */
export const createClientUser = async (
  restaurantId: number,
  data: ClientUserCreateRequest
): Promise<ClientUser> => {
  const response = await api.post<ClientUser>(ENDPOINTS.CLIENT_USERS.CREATE(restaurantId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create client user"));
  }

  return response.data;
};

/**
 * Update a client user
 */
export const updateClientUser = async (
  restaurantId: number,
  uuid: string,
  data: ClientUserUpdateRequest
): Promise<ClientUser> => {
  const response = await api.put<ClientUser>(
    ENDPOINTS.CLIENT_USERS.UPDATE(restaurantId, uuid),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update client user"));
  }

  return response.data;
};

/**
 * Delete a client user
 */
export const deleteClientUser = async (
  restaurantId: number,
  uuid: string
): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(
    ENDPOINTS.CLIENT_USERS.DELETE(restaurantId, uuid)
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete client user"));
  }

  return response.data;
};

/**
 * Reset client user password
 */
export const resetClientPassword = async (
  restaurantId: number,
  uuid: string,
  data: ClientUserResetPasswordRequest
): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(
    ENDPOINTS.CLIENT_USERS.RESET_PASSWORD(restaurantId, uuid),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to reset client password"));
  }

  return response.data;
};

/**
 * Update client user role
 */
export const updateClientRole = async (
  restaurantId: number,
  uuid: string,
  data: ClientUserUpdateRoleRequest
): Promise<ClientUser> => {
  const response = await api.patch<ClientUser>(
    ENDPOINTS.CLIENT_USERS.UPDATE_ROLE(restaurantId, uuid),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update client role"));
  }

  return response.data;
};

/**
 * Bulk create client users for a restaurant
 */
export const bulkCreateClientUsers = async (
  restaurantId: number,
  data: ClientUserBulkCreateRequest
): Promise<ClientUserBulkCreateResponse> => {
  const response = await api.post<ClientUserBulkCreateResponse>(
    ENDPOINTS.CLIENT_USERS.BULK_CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to bulk create client users"));
  }

  return response.data;
};
