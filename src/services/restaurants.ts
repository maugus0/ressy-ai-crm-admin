/**
 * Restaurant Service
 * Handles restaurant-related API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { Restaurant } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

export interface RestaurantsResponse {
  restaurants: Restaurant[];
  total: number;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Get all restaurants
 * Note: API returns [[restaurants], count] format
 */
export const getRestaurants = async (): Promise<RestaurantsResponse> => {
  const response = await api.get<[Restaurant[], number]>(ENDPOINTS.RESTAURANTS.LIST);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch restaurants");
  }

  // API returns [[restaurants], count]
  const [restaurants, total] = response.data;
  
  return {
    restaurants: Array.isArray(restaurants) ? restaurants : [],
    total: total || 0,
  };
};

/**
 * Get a single restaurant by ID
 */
export const getRestaurant = async (id: number): Promise<Restaurant> => {
  const response = await api.get<Restaurant>(ENDPOINTS.RESTAURANTS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch restaurant");
  }

  return response.data;
};

