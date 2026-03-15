/**
 * Restaurant Service
 * Handles restaurant-related API calls
 */

import { api, apiRequestWithErrorData } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Restaurant,
  RestaurantParams,
  RestaurantCreateRequest,
  RestaurantKillSwitchBulkResponse,
  RestaurantKillSwitchUpdateRequest,
  RestaurantUpdateRequest,
  RestaurantStats,
  PaginatedResponse,
  DeleteResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

/**
 * Extracts a user-friendly error message from API response
 * Preserves validation error details from 422 responses
 */
const getErrorMessage = (error: string | null, fallback: string): string => {
  if (!error) return fallback;

  // If error is already a string message, return it
  if (typeof error === "string") return error;

  return fallback;
};

interface KillSwitchErrorDetail {
  message?: string;
  kill_switch_blockers?: string[];
}

interface KillSwitchErrorResponse {
  detail?: string | KillSwitchErrorDetail;
  message?: string;
}

export class RestaurantKillSwitchError extends Error {
  killSwitchBlockers: string[];

  constructor(message: string, killSwitchBlockers: string[] = []) {
    super(message);
    this.name = "RestaurantKillSwitchError";
    this.killSwitchBlockers = killSwitchBlockers;
  }
}

// ============================================================================
// List Restaurants (paginated)
// ============================================================================

export const getRestaurants = async (
  params: RestaurantParams = {}
): Promise<PaginatedResponse<Restaurant>> => {
  const { page = 1, limit = 20, search, is_credit_card_required } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (search) queryParams.set("search", search);
  if (is_credit_card_required !== undefined) {
    queryParams.set("is_credit_card_required", String(is_credit_card_required));
  }

  const url = `${ENDPOINTS.RESTAURANTS.LIST}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<Restaurant>>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch restaurants"));
  }

  return response.data;
};

// ============================================================================
// Get Single Restaurant
// ============================================================================

export const getRestaurant = async (id: number): Promise<Restaurant> => {
  const response = await api.get<Restaurant>(ENDPOINTS.RESTAURANTS.GET(id));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch restaurant"));
  }

  return response.data;
};

// ============================================================================
// Create Restaurant
// ============================================================================

export const createRestaurant = async (data: RestaurantCreateRequest): Promise<Restaurant> => {
  const response = await api.post<Restaurant>(ENDPOINTS.RESTAURANTS.CREATE, data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create restaurant"));
  }

  return response.data;
};

// ============================================================================
// Update Restaurant
// ============================================================================

export const updateRestaurant = async (
  id: number,
  data: RestaurantUpdateRequest
): Promise<Restaurant> => {
  const response = await api.put<Restaurant>(ENDPOINTS.RESTAURANTS.UPDATE(id), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update restaurant"));
  }

  return response.data;
};

// ============================================================================
// Delete Restaurant
// ============================================================================

export const deleteRestaurant = async (id: number): Promise<DeleteResponse> => {
  const response = await api.delete<DeleteResponse>(ENDPOINTS.RESTAURANTS.DELETE(id));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete restaurant"));
  }

  return response.data;
};

// ============================================================================
// Get Restaurant Stats
// ============================================================================

export const getRestaurantStats = async (id: number): Promise<RestaurantStats> => {
  const response = await api.get<RestaurantStats>(ENDPOINTS.RESTAURANTS.STATS(id));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch restaurant stats"));
  }

  return response.data;
};

// ============================================================================
// Kill Switch Controls
// ============================================================================

export const updateRestaurantKillSwitch = async (
  id: number,
  data: RestaurantKillSwitchUpdateRequest
): Promise<Restaurant> => {
  const response = await apiRequestWithErrorData<Restaurant, KillSwitchErrorResponse>(
    ENDPOINTS.RESTAURANTS.KILL_SWITCH(id),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  if (response.error || !response.data) {
    const detail = response.errorData?.detail;
    const blockers = typeof detail === "object" ? detail?.kill_switch_blockers || [] : [];
    const statusMessage = (() => {
      if (response.status === 401) return "Session expired. Please login again.";
      if (response.status === 403)
        return "Access denied. You don't have permission to perform this action.";
      if (response.status >= 500) return "Server error while updating kill switch.";
      if (response.status > 0)
        return `Failed to update restaurant kill switch (HTTP ${response.status}).`;
      return "Failed to update restaurant kill switch";
    })();
    const message =
      typeof detail === "string" ? detail : detail?.message || response.error || statusMessage;
    throw new RestaurantKillSwitchError(message, blockers);
  }

  return response.data;
};

export const updateAllRestaurantsKillSwitch = async (
  data: RestaurantKillSwitchUpdateRequest
): Promise<RestaurantKillSwitchBulkResponse> => {
  const response = await api.patch<RestaurantKillSwitchBulkResponse>(
    ENDPOINTS.RESTAURANTS.KILL_SWITCH_ALL,
    data
  );

  if (response.error || !response.data) {
    throw new Error(
      getErrorMessage(response.error, "Failed to update kill switch for restaurants")
    );
  }

  return response.data;
};
