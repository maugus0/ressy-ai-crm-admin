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

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number: string;
  twilio_details: Record<string, unknown>;
  deepgram_details: Record<string, unknown>;
  open_table_details: Record<string, unknown>;
  forward_minutes: number;
  backward_minutes: number;
  is_credit_card_required_for_reservation: boolean;
  opening_time: string | null;
  closing_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCreateRequest {
  name: string;
  address: string;
  phone_number: string;
  twilio_phone_number?: string;
  forward_minutes?: number;
  backward_minutes?: number;
  is_credit_card_required_for_reservation?: boolean;
  opening_time?: string;
  closing_time?: string;
  twilio_details?: Record<string, unknown>;
  deepgram_details?: Record<string, unknown>;
  open_table_details?: Record<string, unknown>;
}

export interface RestaurantUpdateRequest {
  name?: string;
  address?: string;
  phone_number?: string;
  twilio_phone_number?: string;
  forward_minutes?: number;
  backward_minutes?: number;
  is_credit_card_required_for_reservation?: boolean;
  opening_time?: string;
  closing_time?: string;
  twilio_details?: Record<string, unknown>;
  deepgram_details?: Record<string, unknown>;
  open_table_details?: Record<string, unknown>;
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
  item_name: string;
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
// Caller
// ============================================================================

export interface Caller {
  id: number;
  phone_number: string;
  name: string | null;
  email: string | null;
  total_calls: number;
  total_orders: number;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallerParams extends PaginationParams {
  search?: string;
}

// ============================================================================
// Call
// ============================================================================

export interface Call {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  caller_id: number | null;
  caller_phone: string;
  direction: "inbound" | "outbound";
  status: "completed" | "missed" | "failed" | "in-progress";
  duration_seconds: number;
  recording_url: string | null;
  transcript_id: number | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface CallParams extends PaginationParams {
  restaurant_id?: number;
  status?: string;
  direction?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// Order
// ============================================================================

export interface OrderItem {
  id: number;
  menu_item_id: number;
  item_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  caller_id: number | null;
  caller_phone: string | null;
  call_id: number | null;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  total_amount: string;
  items: OrderItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderParams extends PaginationParams {
  restaurant_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
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
  confirmation_number: string;
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
  name: string;
  email: string | null;
  phone_number: string;
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

export interface ReservationParams {
  status?: "pending" | "confirmed" | "cancelled" | "completed" | "no_show" | "all";
  start_date?: string; // ISO format
  end_date?: string; // ISO format
  // Note: search is not supported by backend - handled client-side
  limit?: number; // default: 100, max: 1000
  offset?: number; // default: 0
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
