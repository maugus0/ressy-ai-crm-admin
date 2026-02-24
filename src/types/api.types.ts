/**
 * Common API Types
 * Shared types for API responses
 */

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// Restaurant
// ============================================================================

/**
 * SMS Redirect Configuration
 * Configuration for redirecting order/reservation requests to external platforms via SMS
 */
export interface SMSRedirectConfig {
  /** Whether SMS redirect is enabled for this capability */
  enabled: boolean;
  /** URL to redirect customers to (required when enabled) */
  redirect_url: string | null;
  /** Custom SMS message template (null = use default) */
  redirect_message: string | null;
}

export interface RestaurantFeatures {
  orders_enabled?: boolean;
  reservations_enabled?: boolean;
  faqs_enabled?: boolean;
  /** SMS redirect configuration for orders (when orders_enabled is false) */
  orders_sms_redirect?: SMSRedirectConfig | null;
  /** SMS redirect configuration for reservations (when reservations_enabled is false) */
  reservations_sms_redirect?: SMSRedirectConfig | null;
}

export interface DayHours {
  open: string | null;
  close: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number: string;
  forward_escalations: boolean | null;
  escalation_phone_number: string | null;
  kill_switch_enabled: boolean;
  kill_switch_can_redirect: boolean;
  kill_switch_blockers: string[];
  timezone: string | null;
  twilio_details: Record<string, unknown>;
  deepgram_details: Record<string, unknown>;
  open_table_details: Record<string, unknown>;
  forward_minutes: number;
  backward_minutes: number;
  is_credit_card_required_for_reservation: boolean;
  operating_hours: OperatingHours | null;
  reservation_seating_capacity: number | null;
  reservation_advance_days: number | null;
  features: RestaurantFeatures | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCreateRequest {
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number?: string;
  forward_escalations?: boolean;
  escalation_phone_number?: string;
  timezone?: string;
  forward_minutes?: number;
  backward_minutes?: number;
  is_credit_card_required_for_reservation?: boolean;
  operating_hours?: OperatingHours;
  reservation_seating_capacity?: number;
  reservation_advance_days?: number;
  twilio_details?: Record<string, unknown>;
  deepgram_details?: Record<string, unknown>;
  open_table_details?: Record<string, unknown>;
  features?: Partial<RestaurantFeatures>;
}

export interface RestaurantUpdateRequest {
  name?: string;
  address?: string;
  phone_number?: string;
  twilio_phone_number?: string;
  forward_escalations?: boolean;
  escalation_phone_number?: string;
  timezone?: string;
  forward_minutes?: number;
  backward_minutes?: number;
  is_credit_card_required_for_reservation?: boolean;
  operating_hours?: OperatingHours;
  reservation_seating_capacity?: number;
  reservation_advance_days?: number;
  twilio_details?: Record<string, unknown>;
  deepgram_details?: Record<string, unknown>;
  open_table_details?: Record<string, unknown>;
  features?: Partial<RestaurantFeatures>;
}

export interface RestaurantKillSwitchUpdateRequest {
  enabled: boolean;
}

export interface RestaurantKillSwitchBulkSkipped {
  restaurant_id: number;
  restaurant_name: string | null;
  kill_switch_blockers: string[];
}

export interface RestaurantKillSwitchBulkResponse {
  enabled: boolean;
  targeted_count: number;
  eligible_count: number;
  updated_count: number;
  skipped_count: number;
  skipped: RestaurantKillSwitchBulkSkipped[];
}

export interface RestaurantParams extends PaginationParams {
  search?: string;
  is_credit_card_required?: boolean;
}

export interface RestaurantStats {
  total_menu_items: number;
  available_menu_items: number;
  special_items_count: number;
  total_faqs: number;
  total_administrators: number;
  total_calls: number;
  total_minute_usage: number;
}

// ============================================================================
// Menu
// ============================================================================

export interface MenuItem {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  category: string;
  sub_category: string | null;
  item_name: string | null;
  item_desc: string | null;
  price: string;
  avg_prep_time: number;
  suggested_items: string[];
  is_available: boolean;
  is_special: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuParams extends PaginationParams {
  category?: string;
  sub_category?: string;
  is_available?: boolean;
  is_special?: boolean;
  search?: string;
}

export interface MenuItemCreateRequest {
  item_name: string;
  price: number;
  category: string;
  sub_category?: string;
  item_desc?: string;
  avg_prep_time?: number;
  is_available?: boolean;
  is_special?: boolean;
}

export interface MenuItemUpdateRequest {
  item_name?: string;
  price?: number;
  category?: string;
  sub_category?: string;
  item_desc?: string;
  avg_prep_time?: number;
  is_available?: boolean;
  is_special?: boolean;
}

export interface MenuAvailabilityRequest {
  is_available: boolean;
}

export interface MenuSpecialRequest {
  is_special: boolean;
}

export interface MenuBulkAvailabilityRequest {
  menu_item_ids: number[];
  is_available: boolean;
}

export interface MenuBulkAvailabilityResponse {
  updated_count: number;
}

export interface MenuCategoriesResponse {
  categories: Record<string, string[]>;
}

export interface MenuDeleteResponse {
  message: string;
  menu_id: number;
}

// ============================================================================
// FAQ
// ============================================================================

export interface FAQ {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface FAQParams extends PaginationParams {
  search?: string;
}

export interface FAQSearchParams extends PaginationParams {
  q?: string;
}

export interface FAQCreateRequest {
  question: string;
  answer: string;
}

export interface FAQUpdateRequest {
  question?: string;
  answer?: string;
}

export interface FAQBulkCreateRequest {
  faqs: FAQCreateRequest[];
}

export interface FAQBulkCreateResponse {
  items: FAQ[];
}

export interface FAQDeleteResponse {
  message: string;
}

// ============================================================================
// Admin User
// ============================================================================

export interface AdminUser {
  uuid: string;
  email: string;
  role_id: number;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login: string | null;
  last_active: string | null;
}

export interface AdminUserParams extends PaginationParams {
  role_id?: number;
}

export interface AdminUserCreateRequest {
  email: string;
  password: string;
  role_id: number;
}

export interface AdminUserUpdateRequest {
  email?: string;
  role_id?: number;
}

export interface AdminUserResetPasswordRequest {
  new_password: string;
}

export interface AdminUserUpdateRoleRequest {
  role_id: number;
}

export interface AdminUserBulkCreateRequest {
  users: AdminUserCreateRequest[];
}

export interface AdminUserBulkCreateResponse {
  items: AdminUser[];
}

// ============================================================================
// Client User
// ============================================================================

export interface ClientUser {
  uuid: string;
  restaurant_id: number;
  restaurant_name: string;
  email: string;
  role_id: number;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login: string | null;
  last_active: string | null;
}

export interface ClientUserParams extends PaginationParams {
  role_id?: number;
}

export interface ClientUserCreateRequest {
  email: string;
  password: string;
  role_id: number;
}

export interface ClientUserUpdateRequest {
  email?: string;
  role_id?: number;
}

export interface ClientUserResetPasswordRequest {
  new_password: string;
}

export interface ClientUserUpdateRoleRequest {
  role_id: number;
}

export interface ClientUserBulkCreateRequest {
  users: ClientUserCreateRequest[];
}

export interface ClientUserBulkCreateResponse {
  items: ClientUser[];
}

// ============================================================================
// Message Response (for password reset, delete, etc.)
// ============================================================================

export interface MessageResponse {
  message: string;
}

// ============================================================================
// Dashboard User (Caller/Customer)
// ============================================================================

export interface DashboardUserStatistics {
  total_calls: number;
  total_orders: number;
  total_reservations: number;
}

export interface DashboardUser {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_spam: number | boolean;
  credit_card: string | null;
  created_at: string;
  updated_at: string;
  statistics?: DashboardUserStatistics;
  restaurant_ids?: number[];
}

export interface DashboardUserListResponse {
  restaurant_id: number;
  users: DashboardUser[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface DashboardUserParams {
  search?: string;
  is_spam?: boolean;
  limit?: number;
  offset?: number;
}

export interface DashboardUserCreateRequest {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_spam?: boolean;
  credit_card?: string;
}

export interface DashboardUserCreateResponse {
  message: string;
  user_id: number;
  user: DashboardUser;
  is_new_user: boolean;
}

export interface DashboardUserUpdateRequest {
  name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  is_spam?: boolean;
  credit_card?: string;
}

export interface DashboardUserUpdateResponse {
  message: string;
  user: DashboardUser;
}

export interface DashboardUserDetailsResponse extends DashboardUser {
  restaurant_ids: number[];
}

// ============================================================================
// Call
// ============================================================================

export interface CallListItem {
  call_id: string;
  restaurant_id: string;
  restaurant_name: string;
  caller_phone: string;
  duration_seconds: number;
  status: string;
  started_at: string;
  has_transcript: boolean;
  summary: string | null;
}

export interface CallListResponse {
  items: CallListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CallTranscriptEntry {
  sequence: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface CallDetails {
  call_id: string;
  restaurant_id: string;
  restaurant_name: string;
  caller_phone: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  twilio_cost: number | null;
  deepgram_cost: number | null;
  ressy_cost: number | null;
  call_direction: "inbound" | "outbound";
  has_transcript: boolean;
  transcript: CallTranscriptEntry[] | null;
  order_id: string | null;
  reservation_id: string | null;
  summary: string | null;
}

export interface CallAnalytics {
  total_calls: number;
  average_call_duration: number;
  status_breakdown: Record<string, number>;
  time_of_day_distribution: Array<{ hour_bucket: number; count: number }>;
  top_restaurants: Array<{ restaurant_id: string; count: number }>;
  calls_by_day_of_week: Array<{ day_of_week: number; count: number }>;
}

export interface CallParams {
  restaurant_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  duration_min?: number;
  duration_max?: number;
  caller_phone?: string;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "duration" | "restaurant_id" | "started_at";
  sort_order?: "asc" | "desc";
}

export interface CallAnalyticsParams {
  restaurant_id?: string;
  date_from: string;
  date_to: string;
}

// ============================================================================
// Dashboard Order
// ============================================================================

export type DashboardOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface DashboardOrderItem {
  item_id: number;
  name: string;
  quantity: number;
  price: number;
  instructions?: string | null;
}

export interface DashboardOrderCustomization {
  delivery?: boolean;
  notes?: string;
  table_number?: number;
  [key: string]: unknown;
}

export interface DashboardOrder {
  id: number;
  user_id: number | null;
  restaurant_id: number;
  status: DashboardOrderStatus;
  total_amount: number;
  order_details: DashboardOrderItem[];
  customization: DashboardOrderCustomization | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DashboardOrderListResponse {
  restaurant_id: number;
  orders: DashboardOrder[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardOrderParams {
  status?: DashboardOrderStatus;
  start_date?: string;
  end_date?: string;
  include_deleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface DashboardOrderCreateItem {
  item_id?: number;
  name: string;
  quantity: number;
  price: number;
  instructions?: string;
}

export interface DashboardOrderCreateRequest {
  order_details: DashboardOrderCreateItem[];
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customization?: DashboardOrderCustomization;
  status?: DashboardOrderStatus;
}

export interface DashboardOrderCreateResponse {
  order_id: number;
  restaurant_id: number;
  user_id: number | null;
  status: DashboardOrderStatus;
  total_amount: number;
  order_details: DashboardOrderItem[];
  customization: DashboardOrderCustomization | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  message: string;
}

export interface DashboardOrderUpdateRequest {
  status?: DashboardOrderStatus;
  total_amount?: number;
  order_details?: DashboardOrderCreateItem[];
  customization?: DashboardOrderCustomization;
}

export interface DashboardOrderStatusUpdateRequest {
  status: DashboardOrderStatus;
}

export interface DashboardOrderStatusUpdateResponse {
  order_id: number;
  status: DashboardOrderStatus;
  message: string;
}

export interface DashboardOrderCancelResponse {
  order_id: number;
  status: "cancelled";
  previous_status: DashboardOrderStatus;
  message: string;
}

export interface DashboardOrderRestoreResponse {
  order_id: number;
  message: string;
}

// Order History Types
export type OrderHistoryAction =
  | "created"
  | "status_changed"
  | "items_updated"
  | "amount_updated"
  | "customer_updated"
  | "customization_updated"
  | "deleted"
  | "restored";

export interface OrderHistoryEntry {
  id: number;
  action: OrderHistoryAction;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_summary: string;
  created_at: string;
}

export interface DashboardOrderWithHistory extends DashboardOrder {
  history: OrderHistoryEntry[];
}

// ============================================================================
// Reservation
// ============================================================================

export interface Reservation {
  id: number;
  reservation_type: string;
  table_availability_request_id: number | null;
  slot_booking_id: number | null;
  user_id: number | null;
  confirmation_number: string | null;
  last_cancel_time: string | null;
  manage_reservation_url: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  special_request: string | null;
  party_size: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  date_time: string;
  restaurant_id: number;
  name: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface ReservationListResponse {
  restaurant_id: number;
  reservations: Reservation[];
  total: number;
}

export interface ReservationCreateRequest {
  date_time: string; // ISO format
  party_size: number; // 1-20
  name: string;
  phone_number: string;
  email_address?: string;
  special_request?: string;
  notes?: string;
}

export interface ReservationCreateResponse {
  reservation_id: number;
  slot_id: number;
  confirmation_number: string;
  status: string;
  date_time: string;
  party_size: number;
  name: string;
  phone_number: string;
  email_address?: string;
  special_request?: string;
  notes?: string;
  message: string;
}

export interface ReservationUpdateRequest {
  date_time?: string; // ISO format
  party_size?: number;
  special_request?: string;
  notes?: string;
  confirmation_number?: string;
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  last_cancel_time?: string; // ISO format
  manage_reservation_url?: string;
}

export interface ReservationFinalizeRequest {
  confirmation_number?: string;
}

export interface ReservationCancelResponse {
  reservation_id: number;
  status: string;
  message: string;
}

/**
 * Parameters for querying reservations.
 *
 * Note: search is not supported by backend - handled client-side.
 */
export interface ReservationParams {
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show" | "all";
  start_date?: string; // ISO format
  end_date?: string; // ISO format
  limit?: number; // default: 100, max: 1000
  offset?: number; // default: 0
}

// Reservation History Types
export type ReservationHistoryAction =
  | "created"
  | "status_changed"
  | "party_size_changed"
  | "date_time_changed"
  | "guest_info_updated"
  | "notes_updated"
  | "cancelled";

export interface ReservationHistoryEntry {
  id: number;
  action: ReservationHistoryAction;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_summary: string;
  created_at: string;
}

export interface ReservationWithHistory extends Reservation {
  history: ReservationHistoryEntry[];
}

// ============================================================================
// Transcript
// ============================================================================

export interface Transcript {
  id: number;
  call_id: number;
  content: string;
  summary: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  created_at: string;
}

// ============================================================================
// Delete Response
// ============================================================================

export interface DeleteResponse {
  message: string;
}

// ============================================================================
// SSE (Server-Sent Events)
// ============================================================================

export type SSEEscalationType =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed"
  | "kill_switch_redirected";

export type SSEEventType = "escalation" | "order" | "reservation" | "heartbeat";

export type SSEEventSubtype =
  | "user_requested"
  | "internal_server_error"
  | "suspected_spam"
  | "sms_redirect_failed"
  | "kill_switch_redirected"
  | "new_order"
  | "order_updated"
  | "order_cancelled"
  | "new_reservation"
  | "reservation_updated"
  | "reservation_cancelled";

export interface SSEEvent {
  id: string;
  event_type: SSEEventType;
  subtype: SSEEventSubtype;
  restaurant_id: number;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface SSEConnectionStats {
  total_connections: number;
  admin_connections: number;
  restaurants_with_connections: number;
  connections_per_restaurant: Record<string, number>;
}

export interface SSEEscalationRequest {
  type: SSEEscalationType;
  data: Record<string, unknown>;
}
