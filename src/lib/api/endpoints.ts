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
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/menu`,
    GET: (restaurantId: number, itemId: number) =>
      `/admin/restaurants/${restaurantId}/menu/${itemId}`,
  },

  // ============================================================================
  // FAQ (per restaurant)
  // ============================================================================
  FAQ: {
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/faqs`,
    GET: (restaurantId: number, faqId: number) =>
      `/admin/restaurants/${restaurantId}/faqs/${faqId}`,
  },

  // ============================================================================
  // Admin Users (Ressy platform admins)
  // ============================================================================
  ADMIN_USERS: {
    LIST: "/admin/admin-users",
    GET: (uuid: string) => `/admin/admin-users/${uuid}`,
  },

  // ============================================================================
  // Client Users (Restaurant users, per restaurant)
  // ============================================================================
  CLIENT_USERS: {
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/client-users`,
    GET: (restaurantId: number, uuid: string) =>
      `/admin/restaurants/${restaurantId}/client-users/${uuid}`,
  },

  // ============================================================================
  // Callers (placeholder - API not ready)
  // ============================================================================
  CALLERS: {
    LIST: "/callers",
    GET: (id: number) => `/callers/${id}`,
  },

  // ============================================================================
  // Calls (placeholder - API not ready)
  // ============================================================================
  CALLS: {
    LIST: "/calls",
    GET: (id: number) => `/calls/${id}`,
  },

  // ============================================================================
  // Orders (placeholder - API not ready)
  // ============================================================================
  ORDERS: {
    LIST: "/orders",
    GET: (id: number) => `/orders/${id}`,
  },

  // ============================================================================
  // Reservations (placeholder - API not ready)
  // ============================================================================
  RESERVATIONS: {
    LIST: "/reservations",
    GET: (id: number) => `/reservations/${id}`,
  },

  // ============================================================================
  // Transcripts (placeholder - API not ready)
  // ============================================================================
  TRANSCRIPTS: {
    LIST: "/transcripts",
    GET: (id: number) => `/transcripts/${id}`,
  },
} as const;
