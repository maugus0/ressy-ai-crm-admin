/**
 * Persistent Notification Types
 * Maps to backend Notifications table and API responses
 */

// Notification event types (matches SSE event types)
export type NotificationType = "order" | "reservation" | "escalation";

// Order subtypes
export type OrderSubtype = "new_order" | "order_updated" | "order_cancelled";

// Reservation subtypes
export type ReservationSubtype =
  | "new_reservation"
  | "reservation_updated"
  | "reservation_cancelled";

// Escalation subtypes
export type EscalationSubtype =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed";

export type NotificationSubtype = OrderSubtype | ReservationSubtype | EscalationSubtype;

// Single notification from API
export interface Notification {
  id: number;
  restaurant_id: number;
  type: NotificationType;
  subtype: NotificationSubtype;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  entity_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// List response from API
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

// Unread count response
export interface UnreadCountResponse {
  unread_count: number;
}

// Mark all read response
export interface MarkAllReadResponse {
  updated_count: number;
}

// Query parameters for listing notifications
export interface NotificationQueryParams {
  is_read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
  restaurant_id?: number; // Admin only
}
