/**
 * Restaurant Service
 * Handles restaurant-related API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Restaurant,
  RestaurantParams,
  RestaurantCreateRequest,
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
