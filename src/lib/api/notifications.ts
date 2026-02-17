/**
 * Notification API Service
 * Handles persistent notification CRUD operations
 */

import { api } from "./client";
import { ENDPOINTS } from "./endpoints";
import type {
  Notification,
  NotificationListResponse,
  NotificationQueryParams,
  UnreadCountResponse,
  MarkAllReadResponse,
} from "@/types/notification.types";

// ============================================================================
// Admin Notification Functions (for Admin Dashboard)
// ============================================================================

/**
 * List all notifications across restaurants (Admin)
 */
export const getAdminNotifications = async (
  params: NotificationQueryParams = {}
): Promise<NotificationListResponse> => {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params.restaurant_id !== undefined) {
    queryParams.restaurant_id = params.restaurant_id;
  }
  if (params.is_read !== undefined) {
    queryParams.is_read = params.is_read;
  }
  if (params.type) {
    queryParams.type = params.type;
  }
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }
  if (params.offset !== undefined) {
    queryParams.offset = params.offset;
  }

  const response = await api.get<NotificationListResponse>(ENDPOINTS.ADMIN_NOTIFICATIONS.LIST, {
    params: queryParams,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notifications");
  }

  return response.data;
};

/**
 * Get a single notification by ID (Admin)
 */
export const getAdminNotification = async (id: number): Promise<Notification> => {
  const response = await api.get<Notification>(ENDPOINTS.ADMIN_NOTIFICATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notification");
  }

  return response.data;
};

/**
 * Get unread notification count for Admin
 * Admin doesn't have a dedicated unread-count endpoint, so derive from list
 */
export const getAdminUnreadCount = async (restaurantId?: number): Promise<number> => {
  const response = await getAdminNotifications({
    is_read: false,
    restaurant_id: restaurantId,
    limit: 1, // We only need the total count
  });
  return response.unread_count;
};

// ============================================================================
// Dashboard Notification Functions (for Client Dashboard)
// ============================================================================

/**
 * List notifications for authenticated restaurant (Client)
 */
export const getDashboardNotifications = async (
  params: Omit<NotificationQueryParams, "restaurant_id"> = {}
): Promise<NotificationListResponse> => {
  const queryParams: Record<string, string | number | boolean | undefined> = {};

  if (params.is_read !== undefined) {
    queryParams.is_read = params.is_read;
  }
  if (params.type) {
    queryParams.type = params.type;
  }
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }
  if (params.offset !== undefined) {
    queryParams.offset = params.offset;
  }

  const response = await api.get<NotificationListResponse>(ENDPOINTS.DASHBOARD_NOTIFICATIONS.LIST, {
    params: queryParams,
  });

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notifications");
  }

  return response.data;
};

/**
 * Get unread count for authenticated restaurant (Client)
 */
export const getDashboardUnreadCount = async (): Promise<number> => {
  const response = await api.get<UnreadCountResponse>(
    ENDPOINTS.DASHBOARD_NOTIFICATIONS.UNREAD_COUNT
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch unread count");
  }

  return response.data.unread_count;
};

/**
 * Get a single notification by ID (Client)
 */
export const getDashboardNotification = async (id: number): Promise<Notification> => {
  const response = await api.get<Notification>(ENDPOINTS.DASHBOARD_NOTIFICATIONS.GET(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch notification");
  }

  return response.data;
};

/**
 * Mark a single notification as read (Client)
 */
export const markNotificationAsRead = async (id: number): Promise<Notification> => {
  const response = await api.patch<Notification>(ENDPOINTS.DASHBOARD_NOTIFICATIONS.MARK_READ(id));

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to mark notification as read");
  }

  return response.data;
};

/**
 * Mark all notifications as read (Client)
 */
export const markAllNotificationsAsRead = async (type?: string): Promise<MarkAllReadResponse> => {
  const queryParams: Record<string, string | undefined> = {};
  if (type) {
    queryParams.type = type;
  }

  const response = await api.patch<MarkAllReadResponse>(
    ENDPOINTS.DASHBOARD_NOTIFICATIONS.MARK_ALL_READ,
    undefined,
    { params: queryParams }
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to mark all as read");
  }

  return response.data;
};
