/**
 * FAQ Service
 * Handles FAQ-related API calls
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { FAQ, FAQParams, PaginatedResponse } from "@/types/api.types";

// ============================================================================
// Service
// ============================================================================

/**
 * Get paginated FAQs for a restaurant
 */
export const getFAQs = async (
  restaurantId: number,
  params: FAQParams = {}
): Promise<PaginatedResponse<FAQ>> => {
  const { page = 1, limit = 20, search } = params;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (search) queryParams.set("search", search);

  const url = `${ENDPOINTS.FAQ.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<FAQ>>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch FAQs");
  }

  return response.data;
};

/**
 * Get a single FAQ
 */
export const getFAQ = async (restaurantId: number, faqId: number): Promise<FAQ> => {
  const response = await api.get<FAQ>(ENDPOINTS.FAQ.GET(restaurantId, faqId));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch FAQ");
  }

  return response.data;
};

