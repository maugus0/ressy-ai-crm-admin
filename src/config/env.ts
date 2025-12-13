/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

export const env = {
  /**
   * API Base URL - Change this for different environments
   * Set VITE_API_BASE_URL in .env.local for local development
   * Set VITE_API_BASE_URL in production environment for deployment
   */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",

  /**
   * API Version prefix
   */
  API_VERSION: import.meta.env.VITE_API_VERSION || "v1",

  /**
   * Full API URL with version
   */
  get API_URL() {
    return `${this.API_BASE_URL}/api/${this.API_VERSION}`;
  },

  /**
   * Token refresh interval in milliseconds (10 minutes)
   */
  TOKEN_REFRESH_INTERVAL: 10 * 60 * 1000,

  /**
   * Is development mode
   */
  IS_DEV: import.meta.env.DEV,
} as const;
