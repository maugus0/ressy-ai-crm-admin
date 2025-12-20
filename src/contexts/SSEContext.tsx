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
  ReactNode,
} from "react";
import { connectToSSE, disconnectFromSSE } from "@/services/sse";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import type { SSEEvent } from "@/types/api.types";

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
  /** Clear all events */
  clearEvents: () => void;
  /** Mark all as read (reset unread count) */
  markAsRead: () => void;
  /** Dismiss a specific event */
  dismissEvent: (eventId: string) => void;
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

// ============================================================================
// Provider
// ============================================================================

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, tokenVersion } = useAuth();
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  /**
   * Show toast notification based on event type
   */
  const showNotification = useCallback((event: SSEEvent) => {
    const { event_type, subtype, restaurant_id, data } = event;

    const getRestaurantInfo = () => {
      const restaurantName = (data?.restaurant_name as string) || `Restaurant #${restaurant_id}`;
      return restaurantName;
    };

    switch (event_type) {
      case "escalation":
        {
          const escalationMessages: Record<string, string> = {
            user_requested: "Customer requested human assistance",
            internal_server_error: "System error during call",
            suspected_spam: "Call flagged as potential spam",
          };
          toast.error(`⚠️ Escalation Alert`, {
            description: `${getRestaurantInfo()}: ${escalationMessages[subtype] || "Unknown escalation"}`,
            duration: 10000, // 10 seconds for important alerts
          });
        }
        break;

      case "order":
        {
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
        clearEvents,
        markAsRead,
        dismissEvent,
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
