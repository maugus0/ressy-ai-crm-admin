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

  const response = await api.get<CallListResponse>(ENDPOINTS.CALLS.LIST, {
    params: {
      restaurant_id,
      date_from,
      date_to,
      status,
      duration_min,
      duration_max,
      caller_phone,
      page,
      limit,
      sort_by,
      sort_order,
    },
  });

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

  const response = await api.get<CallAnalytics>(ENDPOINTS.CALLS.ANALYTICS, {
    params: {
      restaurant_id,
      date_from,
      date_to,
    },
  });

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
  const response = await api.get<CallListResponse>(ENDPOINTS.CALLS.SEARCH, {
    params: params as Record<string, string | number | boolean | undefined>,
  });

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
