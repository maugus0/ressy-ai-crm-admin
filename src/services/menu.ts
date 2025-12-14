/**
 * Menu Service
 * Handles menu-related API calls including CRUD, availability, specials, and categories
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  MenuItem,
  MenuParams,
  MenuItemCreateRequest,
  MenuItemUpdateRequest,
  MenuAvailabilityRequest,
  MenuSpecialRequest,
  MenuBulkAvailabilityRequest,
  MenuBulkAvailabilityResponse,
  MenuCategoriesResponse,
  MenuDeleteResponse,
  PaginatedResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

// ============================================================================
// List & Get Operations
// ============================================================================

/**
 * Get paginated menu items for a restaurant with optional filters
 */
export const getMenuItems = async (
  restaurantId: number,
  params: MenuParams = {}
): Promise<PaginatedResponse<MenuItem>> => {
  const { page = 1, limit = 50, category, sub_category, is_available, is_special, search } = params;

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
    throw new Error(getErrorMessage(response.error, "Failed to fetch menu items"));
  }

  return response.data;
};

/**
 * Get a single menu item by ID
 */
export const getMenuItem = async (menuId: number): Promise<MenuItem> => {
  const response = await api.get<MenuItem>(ENDPOINTS.MENU.GET(menuId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch menu item"));
  }

  return response.data;
};

/**
 * Get menu categories for a restaurant (category -> subcategories mapping)
 */
export const getMenuCategories = async (restaurantId: number): Promise<MenuCategoriesResponse> => {
  const response = await api.get<MenuCategoriesResponse>(ENDPOINTS.MENU.CATEGORIES(restaurantId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch menu categories"));
  }

  return response.data;
};

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new menu item for a restaurant
 */
export const createMenuItem = async (
  restaurantId: number,
  data: MenuItemCreateRequest
): Promise<MenuItem> => {
  const response = await api.post<MenuItem>(ENDPOINTS.MENU.CREATE(restaurantId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create menu item"));
  }

  return response.data;
};

/**
 * Update an existing menu item
 */
export const updateMenuItem = async (
  menuId: number,
  data: MenuItemUpdateRequest
): Promise<MenuItem> => {
  const response = await api.put<MenuItem>(ENDPOINTS.MENU.UPDATE(menuId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update menu item"));
  }

  return response.data;
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (menuId: number): Promise<MenuDeleteResponse> => {
  const response = await api.delete<MenuDeleteResponse>(ENDPOINTS.MENU.DELETE(menuId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete menu item"));
  }

  return response.data;
};

// ============================================================================
// Availability & Special Status Operations
// ============================================================================

/**
 * Toggle menu item availability
 */
export const toggleMenuItemAvailability = async (
  menuId: number,
  data: MenuAvailabilityRequest
): Promise<MenuItem> => {
  const response = await api.patch<MenuItem>(ENDPOINTS.MENU.TOGGLE_AVAILABILITY(menuId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update availability"));
  }

  return response.data;
};

/**
 * Toggle menu item special status
 */
export const toggleMenuItemSpecial = async (
  menuId: number,
  data: MenuSpecialRequest
): Promise<MenuItem> => {
  const response = await api.patch<MenuItem>(ENDPOINTS.MENU.TOGGLE_SPECIAL(menuId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update special status"));
  }

  return response.data;
};

/**
 * Bulk update availability for multiple menu items
 */
export const bulkUpdateMenuAvailability = async (
  restaurantId: number,
  data: MenuBulkAvailabilityRequest
): Promise<MenuBulkAvailabilityResponse> => {
  const response = await api.patch<MenuBulkAvailabilityResponse>(
    ENDPOINTS.MENU.BULK_AVAILABILITY(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to bulk update availability"));
  }

  return response.data;
};
