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
    GET: (id: number) => `/restaurants/${id}`,
  },

  // ============================================================================
  // Menu (per restaurant)
  // ============================================================================
  MENU: {
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/menu`,
    GET: (restaurantId: number, itemId: number) => `/admin/restaurants/${restaurantId}/menu/${itemId}`,
  },

  // ============================================================================
  // FAQ (per restaurant)
  // ============================================================================
  FAQ: {
    LIST: (restaurantId: number) => `/admin/restaurants/${restaurantId}/faqs`,
    GET: (restaurantId: number, faqId: number) => `/admin/restaurants/${restaurantId}/faqs/${faqId}`,
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
    GET: (restaurantId: number, uuid: string) => `/admin/restaurants/${restaurantId}/client-users/${uuid}`,
  },
} as const;
