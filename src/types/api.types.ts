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
  twilio_details: Record<string, string>;
  deepgram_details: Record<string, string>;
  open_table_details: Record<string, string>;
  forward_minutes: number;
  backward_minutes: number;
  is_credit_card_required_for_reservation: number;
  created_at: string;
  updated_at: string;
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

// ============================================================================
// FAQ
// ============================================================================

export interface FAQ {
  id: number;
  restaurant_id: number;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface FAQParams extends PaginationParams {
  search?: string;
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

