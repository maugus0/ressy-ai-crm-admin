/**
 * Escalation API Service
 * Handles escalation CRUD operations for Admin and Client dashboards
 */

import { api } from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Escalation,
  EscalationListResponse,
  EscalationQueryParams,
  EscalationStatus,
  EscalationUrgency,
} from "@/types/escalation.types";

// ============================================================================
// Admin Escalation Functions
// ============================================================================

/**
 * List all escalations across restaurants (Admin)
 */
export const getAdminEscalations = async (
  params: EscalationQueryParams = {}
): Promise<EscalationListResponse> => {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  // Map all params
  if (params.restaurant_id) queryParams.restaurant_id = params.restaurant_id;
  if (params.status) queryParams.status = params.status;
  if (params.urgency) queryParams.urgency = params.urgency;
  if (params.reason) queryParams.reason = params.reason;
  if (params.caller_phone) queryParams.caller_phone = params.caller_phone;
  if (params.call_id) queryParams.call_id = params.call_id;
  if (params.call_sid) queryParams.call_sid = params.call_sid;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.sort_order) queryParams.sort_order = params.sort_order;

  const response = await api.get<EscalationListResponse | AdminEscalationsRawResponse>(
    ENDPOINTS.ADMIN_ESCALATIONS.LIST,
    { params: queryParams }
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalations");
  }

  const data = response.data;

  // Backend returns { items, total, page, limit }; we normalize to EscalationListResponse
  if ("items" in data && Array.isArray(data.items)) {
    const escalations: Escalation[] = data.items.map((item: EscalationRawItem) => ({
      id: item.id,
      call_id: item.call_id ?? null,
      user_id: item.user_id ?? null,
      restaurant_id: item.restaurant_id,
      twilio_call_sid: item.call_sid ?? item.twilio_call_sid ?? null,
      call_sid: item.call_sid ?? null,
      caller_phone: item.caller_phone ?? null,
      escalation_phone_number: item.escalation_phone_number ?? null,
      urgency: item.urgency as EscalationUrgency,
      reason: item.reason ?? null,
      status: item.status as EscalationStatus,
      forwarded: item.forwarded ?? false,
      requested_at: item.requested_at,
      created_at: item.created_at ?? item.requested_at,
      updated_at: item.updated_at ?? item.requested_at,
      restaurant_name: item.restaurant_name,
    }));
    const limit = data.limit ?? 20;
    return {
      escalations,
      total: data.total,
      page: data.page,
      limit,
      total_pages: Math.ceil((data.total ?? 0) / limit) || 1,
    };
  }

  return data as EscalationListResponse;
};

/** Raw response shape from backend (items instead of escalations) */
interface AdminEscalationsRawResponse {
  items: EscalationRawItem[];
  total: number;
  page: number;
  limit: number;
}

interface EscalationRawItem {
  id: number;
  call_id?: string | number | null;
  user_id?: string | number | null;
  restaurant_id: string;
  call_sid?: string | null;
  twilio_call_sid?: string | null;
  caller_phone?: string | null;
  escalation_phone_number?: string | null;
  urgency: string;
  reason?: string | null;
  status: string;
  forwarded?: boolean;
  requested_at: string;
  created_at?: string;
  updated_at?: string;
  restaurant_name?: string;
}

/**
 * Get a single escalation by ID (Admin)
 */
export const getAdminEscalation = async (id: number): Promise<Escalation> => {
  const response = await api.get<Escalation>(ENDPOINTS.ADMIN_ESCALATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalation");
  }

  return response.data;
};

/**
 * Update escalation status (Admin)
 */
export const updateAdminEscalationStatus = async (
  id: number,
  status: EscalationStatus
): Promise<Escalation> => {
  const response = await api.patch<Escalation>(ENDPOINTS.ADMIN_ESCALATIONS.UPDATE_STATUS(id), {
    status,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update escalation status");
  }

  return response.data;
};

// ============================================================================
// Client Escalation Functions
// ============================================================================

/**
 * List escalations for authenticated restaurant (Client)
 */
export const getClientEscalations = async (
  params: Omit<EscalationQueryParams, "restaurant_id"> = {}
): Promise<EscalationListResponse> => {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  // Map all params except restaurant_id
  if (params.status) queryParams.status = params.status;
  if (params.urgency) queryParams.urgency = params.urgency;
  if (params.reason) queryParams.reason = params.reason;
  if (params.caller_phone) queryParams.caller_phone = params.caller_phone;
  if (params.call_id) queryParams.call_id = params.call_id;
  if (params.call_sid) queryParams.call_sid = params.call_sid;
  if (params.date_from) queryParams.date_from = params.date_from;
  if (params.date_to) queryParams.date_to = params.date_to;
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.sort_order) queryParams.sort_order = params.sort_order;

  const response = await api.get<EscalationListResponse>(ENDPOINTS.CLIENT_ESCALATIONS.LIST, {
    params: queryParams,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalations");
  }

  return response.data;
};

/**
 * Get a single escalation by ID (Client)
 */
export const getClientEscalation = async (id: number): Promise<Escalation> => {
  const response = await api.get<Escalation>(ENDPOINTS.CLIENT_ESCALATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch escalation");
  }

  return response.data;
};

/**
 * Update escalation status (Client)
 */
export const updateClientEscalationStatus = async (
  id: number,
  status: EscalationStatus
): Promise<Escalation> => {
  const response = await api.patch<Escalation>(ENDPOINTS.CLIENT_ESCALATIONS.UPDATE_STATUS(id), {
    status,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to update escalation status");
  }

  return response.data;
};
