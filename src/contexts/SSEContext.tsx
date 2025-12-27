/**
 * SSE Context
 * Provides global access to Server-Sent Events and notifications
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { connectToSSE, disconnectFromSSE, getSSEStats } from "@/services/sse";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import type { SSEEvent, SSEConnectionStats } from "@/types/api.types";
import {
  playNotificationSound,
  initializeAudio,
  areSoundsEnabled,
  setSoundsEnabled,
  type NotificationEventType,
} from "@/lib/utils/notification-sounds";

// ============================================================================
// Types
// ============================================================================

interface SSEContextType {
  /** All received events (most recent first) */
  events: SSEEvent[];
  /** Escalation events only */
  escalations: SSEEvent[];
  /** Whether SSE connection is active */
  isConnected: boolean;
  /** Number of unread notifications */
  unreadCount: number;
  /** Whether notification sounds are enabled */
  soundsEnabled: boolean;
  /** SSE connection statistics */
  connectionStats: SSEConnectionStats | null;
  /** Whether stats are loading */
  isLoadingStats: boolean;
  /** Toggle notification sounds on/off */
  toggleSounds: () => void;
  /** Clear all events */
  clearEvents: () => void;
  /** Mark all as read (reset unread count) */
  markAsRead: () => void;
  /** Dismiss a specific event */
  dismissEvent: (eventId: string) => void;
  /** Refresh connection stats */
  refreshStats: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const SSEContext = createContext<SSEContextType | undefined>(undefined);

// ============================================================================
// Constants
// ============================================================================

const MAX_EVENTS = 100; // Keep last 100 events in memory
const RECONNECT_DELAY = 5000; // 5 seconds
const STATS_REFRESH_INTERVAL = 120000; // 2 minutes

// ============================================================================
// Provider
// ============================================================================

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, tokenVersion } = useAuth();
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundsEnabled, setSoundsEnabledState] = useState(areSoundsEnabled());
  const [connectionStats, setConnectionStats] = useState<SSEConnectionStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  // Initialize audio context on mount (for user interaction)
  useEffect(() => {
    // Initialize on first click/keypress to comply with browser autoplay policies
    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  /**
   * Show toast notification based on event type and play appropriate sound
   */
  const showNotification = useCallback((event: SSEEvent) => {
    const { event_type, subtype, restaurant_id, data } = event;

    const getRestaurantInfo = () => {
      const restaurantName = (data?.restaurant_name as string) || `Restaurant #${restaurant_id}`;
      return restaurantName;
    };

    // Determine sound type based on event
    let soundType: NotificationEventType = "generic";

    switch (event_type) {
      case "escalation":
        {
          soundType = "escalation";
          const escalationMessages: Record<string, string> = {
            user_requested: "Customer requested human assistance",
            internal_server_error: "System error during call",
            suspected_spam: "Call flagged as potential spam",
          };

          // Extract reason and urgency from event data
          const reason = data?.reason as string;
          const urgency = data?.urgency as string;
          const baseMessage = escalationMessages[subtype] || "Unknown escalation";

          // Build description with reason prominently displayed
          let description = `${getRestaurantInfo()}: ${baseMessage}`;
          if (reason) {
            description = `${getRestaurantInfo()}: ${baseMessage}\n\n${reason}`;
          }

          // Add urgency to title if available
          let title = "⚠️ Escalation Alert";
          if (urgency) {
            title = `⚠️ Escalation Alert (${urgency.toUpperCase()})`;
          }

          toast.error(title, {
            description,
            duration: 12000, // 12 seconds for important alerts with reason
          });
        }
        break;

      case "order":
        {
          soundType = "order";
          const orderMessages: Record<string, { icon: string; title: string }> = {
            new_order: { icon: "🛍️", title: "New Order" },
            order_updated: { icon: "📝", title: "Order Updated" },
            order_cancelled: { icon: "❌", title: "Order Cancelled" },
          };
          const config = orderMessages[subtype];
          if (config) {
            toast.info(`${config.icon} ${config.title}`, {
              description: getRestaurantInfo(),
            });
          }
        }
        break;

      case "reservation":
        {
          soundType = "reservation";
          const reservationMessages: Record<string, { icon: string; title: string }> = {
            new_reservation: { icon: "📅", title: "New Reservation" },
            reservation_updated: { icon: "📝", title: "Reservation Updated" },
            reservation_cancelled: { icon: "❌", title: "Reservation Cancelled" },
          };
          const config = reservationMessages[subtype];
          if (config) {
            toast.info(`${config.icon} ${config.title}`, {
              description: getRestaurantInfo(),
            });
          }
        }
        break;

      default:
        break;
    }

    // Play notification sound
    playNotificationSound(soundType);
  }, []);

  /**
   * Handle incoming SSE event
   */
  const handleEvent = useCallback(
    (event: SSEEvent) => {
      // Add event to the list (most recent first)
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      showNotification(event);
    },
    [showNotification]
  );

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      disconnectFromSSE(eventSourceRef.current);
    }

    const eventSource = connectToSSE({
      onEvent: handleEvent,
      onOpen: () => {
        setIsConnected(true);
        // Clear reconnect timeout if connection succeeds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      },
      onError: () => {
        setIsConnected(false);

        // Schedule reconnection (EventSource has built-in reconnection, but we add extra handling)
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (isAuthenticated) {
              console.log("SSE: Attempting to reconnect...");
              connect();
            }
          }, RECONNECT_DELAY);
        }
      },
    });

    eventSourceRef.current = eventSource;
  }, [handleEvent, isAuthenticated]);

  /**
   * Connect when authenticated, disconnect when not
   * Also reconnect when token is refreshed (tokenVersion changes)
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setEvents([]);
      setUnreadCount(0);
    }

    return () => {
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, tokenVersion, connect]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
  }, []);

  /**
   * Mark all as read
   */
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  /**
   * Dismiss a specific event
   */
  const dismissEvent = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }, []);

  /**
   * Toggle notification sounds
   */
  const toggleSoundsHandler = useCallback(() => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    setSoundsEnabledState(newState);
  }, [soundsEnabled]);

  // Memoize admin check to stabilize refreshStats callback
  const isAdmin = useMemo(() => {
    return user?.role === "admin" || user?.permissions?.includes("*");
  }, [user?.role, user?.permissions]);

  /**
   * Fetch SSE connection stats (admin only)
   */
  const refreshStats = useCallback(async () => {
    if (!isAuthenticated || !user || !isAdmin) return;

    try {
      setIsLoadingStats(true);
      const stats = await getSSEStats();
      setConnectionStats(stats);
    } catch (error) {
      console.error("Failed to fetch SSE stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [isAuthenticated, user, isAdmin]);

  /**
   * Fetch stats periodically when connected
   */
  useEffect(() => {
    if (isConnected && isAuthenticated && isAdmin) {
      // Fetch immediately
      refreshStats();

      // Set up interval
      statsIntervalRef.current = window.setInterval(() => {
        refreshStats();
      }, STATS_REFRESH_INTERVAL);
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [isConnected, isAuthenticated, isAdmin, refreshStats]);

  /**
   * Get escalation events only
   */
  const escalations = events.filter((e) => e.event_type === "escalation");

  return (
    <SSEContext.Provider
      value={{
        events,
        escalations,
        isConnected,
        unreadCount,
        soundsEnabled,
        connectionStats,
        isLoadingStats,
        toggleSounds: toggleSoundsHandler,
        clearEvents,
        markAsRead,
        dismissEvent,
        refreshStats,
      }}
    >
      {children}
    </SSEContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
};
