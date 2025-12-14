/**
 * FAQ Service
 * Handles FAQ-related API calls including CRUD, search, and bulk operations
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  FAQ,
  FAQParams,
  FAQSearchParams,
  FAQCreateRequest,
  FAQUpdateRequest,
  FAQBulkCreateRequest,
  FAQBulkCreateResponse,
  FAQDeleteResponse,
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
 * Get paginated FAQs for a restaurant with optional search
 */
export const getFAQs = async (
  restaurantId: number,
  params: FAQParams = {}
): Promise<PaginatedResponse<FAQ>> => {
  const { page = 1, limit = 20, search } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (search) queryParams.set("search", search);

  const url = `${ENDPOINTS.FAQ.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<FAQ>>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch FAQs"));
  }

  return response.data;
};

/**
 * Get a single FAQ by ID
 */
export const getFAQ = async (faqId: number): Promise<FAQ> => {
  const response = await api.get<FAQ>(ENDPOINTS.FAQ.GET(faqId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch FAQ"));
  }

  return response.data;
};

/**
 * Search FAQs across all restaurants (global search)
 */
export const searchFAQs = async (params: FAQSearchParams = {}): Promise<PaginatedResponse<FAQ>> => {
  const { page = 1, limit = 20, q } = params;

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (q) queryParams.set("q", q);

  const url = `${ENDPOINTS.FAQ.SEARCH}?${queryParams.toString()}`;
  const response = await api.get<PaginatedResponse<FAQ>>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to search FAQs"));
  }

  return response.data;
};

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new FAQ for a restaurant
 */
export const createFAQ = async (restaurantId: number, data: FAQCreateRequest): Promise<FAQ> => {
  const response = await api.post<FAQ>(ENDPOINTS.FAQ.CREATE(restaurantId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create FAQ"));
  }

  return response.data;
};

/**
 * Update an existing FAQ
 */
export const updateFAQ = async (faqId: number, data: FAQUpdateRequest): Promise<FAQ> => {
  const response = await api.put<FAQ>(ENDPOINTS.FAQ.UPDATE(faqId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update FAQ"));
  }

  return response.data;
};

/**
 * Delete a FAQ
 */
export const deleteFAQ = async (faqId: number): Promise<FAQDeleteResponse> => {
  const response = await api.delete<FAQDeleteResponse>(ENDPOINTS.FAQ.DELETE(faqId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete FAQ"));
  }

  return response.data;
};

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk create FAQs for a restaurant
 */
export const bulkCreateFAQs = async (
  restaurantId: number,
  data: FAQBulkCreateRequest
): Promise<FAQBulkCreateResponse> => {
  const response = await api.post<FAQBulkCreateResponse>(
    ENDPOINTS.FAQ.BULK_CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to bulk create FAQs"));
  }

  return response.data;
};
