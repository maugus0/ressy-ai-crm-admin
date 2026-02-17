/**
 * Escalation Types
 * Maps to backend Escalations table and API responses
 */

export type EscalationStatus = "raised" | "forwarded" | "failed" | "resolved";
export type EscalationUrgency = "standard" | "high" | "critical";

export interface Escalation {
  id: number;
  call_id: number | string | null;
  user_id: number | string | null;
  restaurant_id: string;
  /** Backend may return call_sid; we normalize to twilio_call_sid */
  twilio_call_sid?: string | null;
  call_sid?: string | null;
  caller_phone: string | null;
  escalation_phone_number: string | null;
  urgency: EscalationUrgency;
  reason: string | null;
  status: EscalationStatus;
  forwarded?: boolean;
  requested_at: string;
  created_at?: string;
  updated_at?: string;
  restaurant_name?: string;
}

export interface EscalationListResponse {
  escalations: Escalation[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface EscalationQueryParams {
  restaurant_id?: string;
  status?: EscalationStatus;
  urgency?: EscalationUrgency;
  reason?: string;
  caller_phone?: string;
  call_id?: string;
  call_sid?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface UpdateEscalationStatusRequest {
  status: EscalationStatus;
}
