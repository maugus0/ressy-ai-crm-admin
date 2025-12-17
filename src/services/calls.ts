/**
 * Calls Service
 * Handles voice call management API calls including call history, analytics, and transcripts.
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  CallListResponse,
  CallDetails,
  CallAnalytics,
  CallParams,
  CallAnalyticsParams,
  MessageResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

// ============================================================================
// List Calls (paginated with filters)
// ============================================================================

/**
 * Get paginated call history with optional filters
 */
export const getCalls = async (params: CallParams = {}): Promise<CallListResponse> => {
  const {
    restaurant_id,
    date_from,
    date_to,
    status,
    duration_min,
    duration_max,
    caller_phone,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  const queryParams = new URLSearchParams();
  if (restaurant_id) queryParams.set("restaurant_id", restaurant_id);
  if (date_from) queryParams.set("date_from", date_from);
  if (date_to) queryParams.set("date_to", date_to);
  if (status) queryParams.set("status", status);
  if (duration_min !== undefined) queryParams.set("duration_min", String(duration_min));
  if (duration_max !== undefined) queryParams.set("duration_max", String(duration_max));
  if (caller_phone) queryParams.set("caller_phone", caller_phone);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  queryParams.set("sort_by", sort_by);
  queryParams.set("sort_order", sort_order);

  const url = `${ENDPOINTS.CALLS.LIST}?${queryParams.toString()}`;
  const response = await api.get<CallListResponse>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch calls"));
  }

  return response.data;
};

// ============================================================================
// Get Call Details
// ============================================================================

/**
 * Get full call details including transcript
 */
export const getCallDetails = async (callId: string): Promise<CallDetails> => {
  const response = await api.get<CallDetails>(ENDPOINTS.CALLS.GET(callId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch call details"));
  }

  return response.data;
};

// ============================================================================
// Get Call Analytics
// ============================================================================

/**
 * Get aggregated call analytics with required date range
 */
export const getCallAnalytics = async (params: CallAnalyticsParams): Promise<CallAnalytics> => {
  const { restaurant_id, date_from, date_to } = params;

  const queryParams = new URLSearchParams();
  if (restaurant_id) queryParams.set("restaurant_id", restaurant_id);
  queryParams.set("date_from", date_from);
  queryParams.set("date_to", date_to);

  const url = `${ENDPOINTS.CALLS.ANALYTICS}?${queryParams.toString()}`;
  const response = await api.get<CallAnalytics>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch call analytics"));
  }

  return response.data;
};

// ============================================================================
// Search Calls
// ============================================================================

/**
 * Search calls with query parameters
 */
export const searchCalls = async (params: CallParams = {}): Promise<CallListResponse> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  });

  const url = `${ENDPOINTS.CALLS.SEARCH}?${queryParams.toString()}`;
  const response = await api.get<CallListResponse>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to search calls"));
  }

  return response.data;
};

// ============================================================================
// Delete Call
// ============================================================================

/**
 * Delete a call record and its transcript
 */
export const deleteCall = async (callId: string): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.CALLS.DELETE(callId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete call"));
  }

  return response.data;
};

// ============================================================================
// Delete Transcript
// ============================================================================

/**
 * Delete only the transcript for a call
 */
export const deleteTranscript = async (callId: string): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.CALLS.DELETE_TRANSCRIPT(callId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete transcript"));
  }

  return response.data;
};
