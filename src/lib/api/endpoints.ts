/**
 * API Endpoints
 * Centralized endpoint definitions matching backend routes
 */

export const ENDPOINTS = {
  // ============================================================================
  // Authentication
  // ============================================================================
  AUTH: {
    ADMIN_LOGIN: "/auth/admin/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },

  // ============================================================================
  // Restaurants
  // ============================================================================
  RESTAURANTS: {
    LIST: "/restaurants/",
    CREATE: "/restaurants/",
    GET: (id: number) => `/restaurants/${id}`,
    UPDATE: (id: number) => `/restaurants/${id}`,
    DELETE: (id: number) => `/restaurants/${id}`,
    STATS: (id: number) => `/restaurants/${id}/stats`,
  },

  // ============================================================================
  // Menu (per restaurant)
  // ============================================================================
  MENU: {
    // Restaurant-scoped operations
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/menu`,
    CREATE: (restaurantId: number) => `/admin/restaurants/${restaurantId}/menu`,
    CATEGORIES: (restaurantId: number) => `/admin/restaurants/${restaurantId}/menu/categories`,
    BULK_AVAILABILITY: (restaurantId: number) =>
      `/admin/restaurants/${restaurantId}/menu/bulk-availability`,
    // Menu item operations (by menu_id)
    GET: (menuId: number) => `/admin/menu/${menuId}`,
    UPDATE: (menuId: number) => `/admin/menu/${menuId}`,
    DELETE: (menuId: number) => `/admin/menu/${menuId}`,
    TOGGLE_AVAILABILITY: (menuId: number) => `/admin/menu/${menuId}/availability`,
    TOGGLE_SPECIAL: (menuId: number) => `/admin/menu/${menuId}/special`,
  },

  // ============================================================================
  // FAQ (per restaurant)
  // ============================================================================
  FAQ: {
    // Restaurant-scoped operations
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/faqs`,
    CREATE: (restaurantId: number) => `/admin/restaurants/${restaurantId}/faqs`,
    BULK_CREATE: (restaurantId: number) => `/admin/restaurants/${restaurantId}/faqs/bulk`,
    // FAQ item operations (by faq_id)
    GET: (faqId: number) => `/admin/faqs/${faqId}`,
    UPDATE: (faqId: number) => `/admin/faqs/${faqId}`,
    DELETE: (faqId: number) => `/admin/faqs/${faqId}`,
    // Global search
    SEARCH: "/admin/faqs/search",
  },

  // ============================================================================
  // Admin Users (Ressy platform admins)
  // ============================================================================
  ADMIN_USERS: {
    LIST: "/admin/admin-users",
    CREATE: "/admin/admin-users",
    GET: (uuid: string) => `/admin/admin-users/${uuid}`,
    UPDATE: (uuid: string) => `/admin/admin-users/${uuid}`,
    DELETE: (uuid: string) => `/admin/admin-users/${uuid}`,
    RESET_PASSWORD: (uuid: string) => `/admin/admin-users/${uuid}/reset-password`,
    UPDATE_ROLE: (uuid: string) => `/admin/admin-users/${uuid}/role`,
    BULK_CREATE: "/admin/admin-users/bulk",
  },

  // ============================================================================
  // Client Users (Restaurant users, per restaurant)
  // ============================================================================
  CLIENT_USERS: {
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/client-users`,
    CREATE: (restaurantId: number) => `/admin/restaurants/${restaurantId}/client-users`,
    GET: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}`,
    UPDATE: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}`,
    DELETE: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}`,
    RESET_PASSWORD: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}/reset-password`,
    UPDATE_ROLE: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}/role`,
    BULK_CREATE: (restaurantId: number) => `/admin/restaurants/${restaurantId}/client-users/bulk`,
  },

  // ============================================================================
  // Dashboard Users (Callers/Customers)
  // ============================================================================
  DASHBOARD_USERS: {
    // Restaurant-scoped operations
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/users`,
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/users`,
    // User-scoped operations (by user_id)
    GET: (userId: number) => `/dashboard/users/${userId}`,
    UPDATE: (userId: number) => `/dashboard/users/${userId}`,
  },

  // ============================================================================
  // Calls (Admin)
  // ============================================================================
  CALLS: {
    LIST: "/admin/calls",
    ANALYTICS: "/admin/calls/analytics",
    SEARCH: "/admin/calls/search",
    GET: (callId: string) => `/admin/calls/${callId}`,
    DELETE: (callId: string) => `/admin/calls/${callId}`,
    DELETE_TRANSCRIPT: (callId: string) => `/admin/calls/${callId}/transcript`,
  },

  // ============================================================================
  // Dashboard Orders
  // ============================================================================
  DASHBOARD_ORDERS: {
    // Restaurant-scoped operations
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/orders`,
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/orders`,
    // Order-scoped operations (by order_id)
    GET: (orderId: number) => `/dashboard/orders/${orderId}`,
    UPDATE: (orderId: number) => `/dashboard/orders/${orderId}`,
    DELETE: (orderId: number) => `/dashboard/orders/${orderId}`,
    UPDATE_STATUS: (orderId: number) => `/dashboard/orders/${orderId}/status`,
    CANCEL: (orderId: number) => `/dashboard/orders/${orderId}/cancel`,
    RESTORE: (orderId: number) => `/dashboard/orders/${orderId}/restore`,
  },

  // ============================================================================
  // Reservations (Dashboard)
  // ============================================================================
  RESERVATIONS: {
    LIST: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/reservations`,
    CREATE: (restaurantId: number) => `/dashboard/restaurants/${restaurantId}/reservations`,
    GET: (reservationId: number) => `/dashboard/reservations/${reservationId}`,
    UPDATE: (reservationId: number) => `/dashboard/reservations/${reservationId}`,
    FINALIZE: (reservationId: number) => `/dashboard/reservations/${reservationId}/finalize`,
    CANCEL: (reservationId: number) => `/dashboard/reservations/${reservationId}/cancel`,
  },

  // ============================================================================
  // Transcripts (placeholder - API not ready)
  // ============================================================================
  TRANSCRIPTS: {
    LIST: "/transcripts",
    GET: (id: number) => `/transcripts/${id}`,
  },

  // ============================================================================
  // SSE (Server-Sent Events)
  // ============================================================================
  SSE: {
    STREAM: "/sse/events/stream",
    ESCALATION: (restaurantId: number) => `/sse/events/escalation/${restaurantId}`,
    STATS: "/sse/events/stats",
  },

  // ============================================================================
  // Admin Notifications
  // ============================================================================
  ADMIN_NOTIFICATIONS: {
    LIST: "/admin/notifications",
    GET: (id: number) => `/admin/notifications/${id}`,
  },

  // ============================================================================
  // Dashboard Notifications (Client)
  // ============================================================================
  DASHBOARD_NOTIFICATIONS: {
    LIST: "/dashboard/notifications",
    UNREAD_COUNT: "/dashboard/notifications/unread-count",
    GET: (id: number) => `/dashboard/notifications/${id}`,
    MARK_READ: (id: number) => `/dashboard/notifications/${id}/read`,
    MARK_ALL_READ: "/dashboard/notifications/read-all",
  },

  // ============================================================================
  // Admin Escalations
  // ============================================================================
  ADMIN_ESCALATIONS: {
    LIST: "/admin/escalations",
    GET: (id: number) => `/admin/escalations/${id}`,
    UPDATE_STATUS: (id: number) => `/admin/escalations/${id}/status`,
  },

  // ============================================================================
  // Client Escalations
  // ============================================================================
  CLIENT_ESCALATIONS: {
    LIST: "/client/escalations",
    GET: (id: number) => `/client/escalations/${id}`,
    UPDATE_STATUS: (id: number) => `/client/escalations/${id}/status`,
  },
} as const;
