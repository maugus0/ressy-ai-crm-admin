/**
 * Orders (Dashboard Orders) Service
 * Handles order management API calls including CRUD, status updates, cancellation, and restore.
 * Dashboard-specific order management with RBAC.
 */

import { api } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DashboardOrder,
  DashboardOrderWithHistory,
  DashboardOrderListResponse,
  DashboardOrderParams,
  DashboardOrderCreateRequest,
  DashboardOrderCreateResponse,
  DashboardOrderUpdateRequest,
  DashboardOrderStatusUpdateRequest,
  DashboardOrderStatusUpdateResponse,
  DashboardOrderCancelResponse,
  DashboardOrderRestoreResponse,
  MessageResponse,
} from "@/types/api.types";

// ============================================================================
// Error Handling Helper
// ============================================================================

const getErrorMessage = (error: string | null, fallback: string): string => {
  return error || fallback;
};

const toFriendlyOrderError = (error: string | null, fallback: string): string => {
  const msg = error || "";
  // Backend sometimes returns raw DB errors; map the common ones to admin-friendly text.
  // Prefer backend-standardized error codes/messages over parsing DB/vendor strings when available.
  if (
    msg.includes("Column 'user_id' cannot be null") ||
    (msg.includes("user_id") && msg.includes("cannot be null"))
  ) {
    return "Customer phone number is required to create an order.";
  }
  return getErrorMessage(error, fallback);
};

// ============================================================================
// List Orders for Restaurant
// ============================================================================

/**
 * Get all orders for a restaurant with optional filters
 */
export const getOrders = async (
  restaurantId: number,
  params: DashboardOrderParams = {}
): Promise<DashboardOrderListResponse> => {
  const { status, start_date, end_date, include_deleted = false, limit = 100, offset = 0 } = params;

  const response = await api.get<DashboardOrderListResponse>(
    ENDPOINTS.DASHBOARD_ORDERS.LIST(restaurantId),
    {
      params: {
        status,
        start_date,
        end_date,
        include_deleted,
        limit,
        offset,
      },
    }
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch orders"));
  }

  return response.data;
};

// ============================================================================
// Get Order Details
// ============================================================================

/**
 * Get detailed information about a specific order including history
 */
export const getOrderDetails = async (orderId: number): Promise<DashboardOrderWithHistory> => {
  const response = await api.get<DashboardOrderWithHistory>(
    ENDPOINTS.DASHBOARD_ORDERS.GET(orderId)
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to fetch order details"));
  }

  return response.data;
};

// ============================================================================
// Create Order
// ============================================================================

/**
 * Create a new order for a restaurant
 */
export const createOrder = async (
  restaurantId: number,
  data: DashboardOrderCreateRequest
): Promise<DashboardOrderCreateResponse> => {
  const response = await api.post<DashboardOrderCreateResponse>(
    ENDPOINTS.DASHBOARD_ORDERS.CREATE(restaurantId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(toFriendlyOrderError(response.error, "Failed to create order"));
  }

  return response.data;
};

// ============================================================================
// Update Order
// ============================================================================

/**
 * Update order details including status, items, amount, and customization
 */
export const updateOrder = async (
  orderId: number,
  data: DashboardOrderUpdateRequest
): Promise<DashboardOrder> => {
  const response = await api.put<DashboardOrder>(ENDPOINTS.DASHBOARD_ORDERS.UPDATE(orderId), data);

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update order"));
  }

  return response.data;
};

// ============================================================================
// Update Order Status
// ============================================================================

/**
 * Update only the order status (quick status update)
 */
export const updateOrderStatus = async (
  orderId: number,
  data: DashboardOrderStatusUpdateRequest
): Promise<DashboardOrderStatusUpdateResponse> => {
  const response = await api.put<DashboardOrderStatusUpdateResponse>(
    ENDPOINTS.DASHBOARD_ORDERS.UPDATE_STATUS(orderId),
    data
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to update order status"));
  }

  return response.data;
};

// ============================================================================
// Cancel Order
// ============================================================================

/**
 * Cancel an order (changes status to 'cancelled')
 */
export const cancelOrder = async (orderId: number): Promise<DashboardOrderCancelResponse> => {
  const response = await api.put<DashboardOrderCancelResponse>(
    ENDPOINTS.DASHBOARD_ORDERS.CANCEL(orderId),
    {}
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to cancel order"));
  }

  return response.data;
};

// ============================================================================
// Delete Order (Soft Delete)
// ============================================================================

/**
 * Soft delete an order (sets deleted_at timestamp)
 */
export const deleteOrder = async (orderId: number): Promise<MessageResponse> => {
  const response = await api.delete<MessageResponse>(ENDPOINTS.DASHBOARD_ORDERS.DELETE(orderId));

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to delete order"));
  }

  return response.data;
};

// ============================================================================
// Restore Order
// ============================================================================

/**
 * Restore a soft-deleted order (clears deleted_at timestamp)
 */
export const restoreOrder = async (orderId: number): Promise<DashboardOrderRestoreResponse> => {
  const response = await api.put<DashboardOrderRestoreResponse>(
    ENDPOINTS.DASHBOARD_ORDERS.RESTORE(orderId),
    {}
  );

  if (response.error || !response.data) {
    throw new Error(getErrorMessage(response.error, "Failed to restore order"));
  }

  return response.data;
};
