/**
 * Menu Service
 * Handles menu-related API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { MenuItem, MenuParams, PaginatedResponse } from "@/types/api.types";

// ============================================================================
// Service
// ============================================================================

/**
 * Get paginated menu items for a restaurant
 */
export const getMenuItems = async (
  restaurantId: number,
  params: MenuParams = {}
): Promise<PaginatedResponse<MenuItem>> => {
  const { page = 1, limit = 50, category, sub_category, is_available, is_special, search } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (category) queryParams.set("category", category);
  if (sub_category) queryParams.set("sub_category", sub_category);
  if (is_available !== undefined) queryParams.set("is_available", String(is_available));
  if (is_special !== undefined) queryParams.set("is_special", String(is_special));
  if (search) queryParams.set("search", search);

  const url = `${ENDPOINTS.MENU.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<MenuItem>>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu items");
  }

  return response.data;
};

/**
 * Get a single menu item
 */
export const getMenuItem = async (restaurantId: number, itemId: number): Promise<MenuItem> => {
  const response = await api.get<MenuItem>(ENDPOINTS.MENU.GET(restaurantId, itemId));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch menu item");
  }

  return response.data;
};
