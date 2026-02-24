/**
 * Restaurant Service
 * Handles restaurant-related API calls
 */

import { api, getAccessToken } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { env } from "@/config/env";
import { refreshTokenDirect } from "@/lib/utils/tokenRefresh";
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

const executeKillSwitchRequest = async (
  id: number,
  data: RestaurantKillSwitchUpdateRequest
): Promise<Response> => {
  const url = `${env.API_URL}${ENDPOINTS.RESTAURANTS.KILL_SWITCH(id)}`;

  const makeRequest = (token: string | null) =>
    fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

  let token = getAccessToken();
  let response = await makeRequest(token);

  if (response.status === 401 && token) {
    const refreshResult = await refreshTokenDirect();
    if (refreshResult.success) {
      token = getAccessToken();
      response = await makeRequest(token);
    }
  }

  return response;
};

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
  const response = await executeKillSwitchRequest(id, data);

  const responseJson = (await response.json().catch(() => null)) as
    | KillSwitchErrorResponse
    | Restaurant
    | null;

  if (!response.ok || !responseJson) {
    const errorPayload = responseJson as KillSwitchErrorResponse | null;
    const detail = errorPayload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || errorPayload?.message || "Failed to update restaurant kill switch";
    const blockers = typeof detail === "object" ? detail?.kill_switch_blockers || [] : [];
    throw new RestaurantKillSwitchError(message, blockers);
  }

  return responseJson as Restaurant;
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
