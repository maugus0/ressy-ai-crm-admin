/**
 * Reservations Service
 * Handles reservation-related API calls including CRUD, finalize, and cancel operations.
 *
 * RBAC: Backend enforces access control. Admin users can access all restaurants;
 * restaurant managers can only access their own restaurant. Access validated via
 * _check_restaurant_access() for restaurant-scoped ops and _check_reservation_access()
 * for reservation-scoped ops.
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Reservation,
  ReservationListResponse,
  ReservationCreateRequest,
  ReservationCreateResponse,
  ReservationUpdateRequest,
  ReservationFinalizeRequest,
  ReservationCancelResponse,
  ReservationParams,
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
 * Get reservations for a restaurant with optional filters
 */
export const getReservations = async (
  restaurantId: number,
  params: ReservationParams = {}
): Promise<ReservationListResponse> => {
  const { status, start_date, end_date, limit = 100, offset = 0 } = params;

  const queryParams = new URLSearchParams();
  if (status && status !== "all") queryParams.set("status", status);
  if (start_date) queryParams.set("start_date", start_date);
  if (end_date) queryParams.set("end_date", end_date);
  // Note: Backend doesn't support search parameter - handled client-side
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String(offset));

  const url = `${ENDPOINTS.RESERVATIONS.LIST(restaurantId)}?${queryParams.toString()}`;
  const response = await api.get<ReservationListResponse>(url);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch reservations"));
  }
  return response.data;
};

/**
 * Get a single reservation by ID
 */
export const getReservation = async (reservationId: number): Promise<Reservation> => {
  const response = await api.get<Reservation>(ENDPOINTS.RESERVATIONS.GET(reservationId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch reservation"));
  }
  return response.data;
};

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Create a confirmed reservation
 */
export const createReservation = async (
  restaurantId: number,
  data: ReservationCreateRequest
): Promise<ReservationCreateResponse> => {
  const response = await api.post<ReservationCreateResponse>(
    ENDPOINTS.RESERVATIONS.CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to create reservation"));
  }
  return response.data;
};

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update a reservation
 */
export const updateReservation = async (
  reservationId: number,
  data: ReservationUpdateRequest
): Promise<Reservation> => {
  const response = await api.put<Reservation>(ENDPOINTS.RESERVATIONS.UPDATE(reservationId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update reservation"));
  }
  return response.data;
};

/**
 * Finalize a pending reservation (change status from pending to confirmed)
 */
export const finalizeReservation = async (
  reservationId: number,
  data?: ReservationFinalizeRequest
): Promise<Reservation> => {
  const response = await api.put<Reservation>(
    ENDPOINTS.RESERVATIONS.FINALIZE(reservationId),
    data || {}
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to finalize reservation"));
  }
  return response.data;
};

/**
 * Cancel a reservation
 */
export const cancelReservation = async (
  reservationId: number
): Promise<ReservationCancelResponse> => {
  const response = await api.put<ReservationCancelResponse>(
    ENDPOINTS.RESERVATIONS.CANCEL(reservationId),
    {}
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to cancel reservation"));
  }
  return response.data;
};
