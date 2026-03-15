/**
 * SSE Context
 * Provides global access to Server-Sent Events and notifications
 * Also handles persistent notification catch-up on login
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
import type { SSEEvent, SSEConnectionStats } from "@/types/api.types";
import type { Notification, NotificationType } from "@/types/notification.types";
import { getAdminNotifications, getAdminUnreadCount } from "@/lib/api/notifications";
import {
  initializeAudio,
  areSoundsEnabled,
  setSoundsEnabled,
  startLoopingSound,
  stopLoopingSound,
  stopAllLoopingSounds,
  type NotificationEventType,
} from "@/lib/utils/notification-sounds";
import { TOKEN_REFRESHED_EVENT } from "@/lib/utils/tokenRefresh";
import { toast } from "sonner";

// ============================================================================
// Stable Sound ID Generator (module level for consistency)
// ============================================================================

const getSoundId = (event: SSEEvent): string => {
  if (event.id) {
    return `${event.event_type}-${event.id}`;
  }
  // Use timestamp as fallback for stable IDs
  return `${event.event_type}-fallback-${event.timestamp}`;
};

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
  /** Set of event IDs that have been read */
  readEventIds: Set<string>;
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
  /** Mark a specific event as read */
  markEventAsRead: (eventId: string) => void;
  /** Dismiss a specific event */
  dismissEvent: (eventId: string) => void;
  /** Stop sound for a specific event */
  stopEventSound: (eventId: string) => void;
  /** Refresh connection stats */
  refreshStats: () => Promise<void>;

  // Persistent notification state
  /** Persistent notifications from database */
  persistentNotifications: Notification[];
  /** Total count of persistent notifications */
  persistentTotal: number;
  /** Unread count for persistent notifications */
  persistentUnreadCount: number;
  /** Whether persistent notifications are loading */
  isPersistentLoading: boolean;
  /** Filter type for persistent notifications */
  persistentFilterType: NotificationType | null;
  /** Fetch persistent notifications */
  fetchPersistentNotifications: (type?: NotificationType | null) => Promise<void>;
  /** Refresh persistent unread count */
  refreshPersistentUnreadCount: () => Promise<void>;
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
  const [readEventIds, setReadEventIds] = useState<Set<string>>(new Set());
  const [soundsEnabled, setSoundsEnabledState] = useState(areSoundsEnabled());
  const [connectionStats, setConnectionStats] = useState<SSEConnectionStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  // Persistent notification state
  const [persistentNotifications, setPersistentNotifications] = useState<Notification[]>([]);
  const [persistentTotal, setPersistentTotal] = useState(0);
  const [persistentUnreadCount, setPersistentUnreadCount] = useState(0);
  const [isPersistentLoading, setIsPersistentLoading] = useState(false);
  const [persistentFilterType, setPersistentFilterType] = useState<NotificationType | null>(null);
  const persistentFetchedRef = useRef(false);

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
   * Fetch persistent notifications from API (catch-up on login)
   */
  const fetchPersistentNotifications = useCallback(
    async (type?: NotificationType | null) => {
      if (!isAuthenticated || !user) return;

      try {
        setIsPersistentLoading(true);
        if (type !== undefined) {
          setPersistentFilterType(type);
        }

        const params = {
          type: type || persistentFilterType || undefined,
          limit: 50,
          offset: 0,
        };

        const response = await getAdminNotifications(params);
        setPersistentNotifications(response.notifications);
        setPersistentTotal(response.total);
        setPersistentUnreadCount(response.unread_count);
      } catch (error) {
        console.error("Failed to fetch persistent notifications:", error);
      } finally {
        setIsPersistentLoading(false);
      }
    },
    [isAuthenticated, user, persistentFilterType]
  );

  /**
   * Refresh persistent unread count
   */
  const refreshPersistentUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const count = await getAdminUnreadCount();
      setPersistentUnreadCount(count);
    } catch (error) {
      console.error("Failed to refresh persistent unread count:", error);
    }
  }, [isAuthenticated, user]);

  /**
   * Fetch persistent notifications on login (catch-up mechanism)
   */
  useEffect(() => {
    if (isAuthenticated && user && !persistentFetchedRef.current) {
      persistentFetchedRef.current = true;
      fetchPersistentNotifications();
    }

    // Reset on logout
    if (!isAuthenticated) {
      persistentFetchedRef.current = false;
      setPersistentNotifications([]);
      setPersistentTotal(0);
      setPersistentUnreadCount(0);
      setPersistentFilterType(null);
    }
  }, [isAuthenticated, user, fetchPersistentNotifications]);

  /**
   * Start looping sound for an event (no toast notifications - all go through panel)
   */
  const playEventSound = useCallback((event: SSEEvent) => {
    const { event_type, subtype } = event;
    const soundId = getSoundId(event);

    let soundType: NotificationEventType = "generic";
    let shouldPlaySound = false;

    switch (event_type) {
      case "escalation":
        soundType = "escalation";
        shouldPlaySound = true;
        break;

      case "system":
        soundType = "escalation";
        if (["kill_switch_toggled", "kill_switch_bulk_updated"].includes(subtype)) {
          shouldPlaySound = true;
        }
        break;

      case "order":
        soundType = "order";
        // Only play for recognized order subtypes
        if (["new_order", "order_updated", "order_cancelled"].includes(subtype)) {
          shouldPlaySound = true;
        }
        break;

      case "reservation":
        soundType = "reservation";
        // Only play for recognized reservation subtypes
        if (["new_reservation", "reservation_updated", "reservation_cancelled"].includes(subtype)) {
          shouldPlaySound = true;
        }
        break;

      default:
        break;
    }

    // Start looping sound if applicable
    if (shouldPlaySound) {
      startLoopingSound(soundId, soundType);
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

      // Play looping sound for the event (no toast - all notifications go through panel)
      playEventSound(event);

      if (event.event_type === "system" && event.subtype === "kill_switch_toggled") {
        const enabled = Boolean(event.data?.enabled);
        const restaurantName = (event.data?.restaurant_name as string) || "restaurant";
        const actor = (event.data?.actor_email as string) || (event.data?.actor_type as string);
        toast.warning(
          enabled
            ? `Kill switch enabled for ${restaurantName}`
            : `Kill switch disabled for ${restaurantName}`,
          { description: actor ? `Changed by ${actor}` : undefined }
        );
      }

      if (event.event_type === "system" && event.subtype === "kill_switch_bulk_updated") {
        const enabled = Boolean(event.data?.enabled);
        const updatedCount = Number(event.data?.updated_count ?? 0);
        const skippedCount = Number(event.data?.skipped_count ?? 0);
        const actor = (event.data?.actor_email as string) || (event.data?.actor_type as string);
        toast.warning(
          enabled
            ? `Kill switch enabled in bulk for ${updatedCount} restaurants`
            : `Kill switch disabled in bulk for ${updatedCount} restaurants`,
          {
            description: `${skippedCount} skipped${actor ? ` • Changed by ${actor}` : ""}`,
          }
        );
      }
    },
    [playEventSound]
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
   * Also reconnect when token is refreshed (tokenVersion changes or event fired)
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();

      // Listen for token refresh events for reconnection
      const handleTokenRefresh = () => {
        console.log("SSE: Token refreshed, reconnecting...");
        connect();
      };

      window.addEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh);

      return () => {
        window.removeEventListener(TOKEN_REFRESHED_EVENT, handleTokenRefresh);
        stopAllLoopingSounds();
        if (eventSourceRef.current) {
          disconnectFromSSE(eventSourceRef.current);
          eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    } else {
      stopAllLoopingSounds();
      if (eventSourceRef.current) {
        disconnectFromSSE(eventSourceRef.current);
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setEvents([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user, tokenVersion, connect]);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    // Stop all looping sounds before clearing
    stopAllLoopingSounds();
    setEvents([]);
    setUnreadCount(0);
    setReadEventIds(new Set());
  }, []);

  /**
   * Mark all as read
   */
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  /**
   * Mark a specific event as read
   */
  const markEventAsRead = useCallback((eventId: string) => {
    setReadEventIds((prev) => {
      const wasAlreadyRead = prev.has(eventId);
      const newSet = new Set(prev);
      newSet.add(eventId);

      // Only decrement if this event was not already read
      if (!wasAlreadyRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      return newSet;
    });
  }, []);

  /**
   * Stop sound for a specific event (but keep it in the panel)
   */
  const stopEventSound = useCallback((eventId: string) => {
    setEvents((prev) => {
      const event = prev.find((e) => e.id === eventId);
      if (event) {
        const soundId = getSoundId(event);
        stopLoopingSound(soundId);
      }
      return prev; // Don't modify the array
    });
  }, []);

  /**
   * Dismiss a specific event
   */
  const dismissEvent = useCallback((eventId: string) => {
    setEvents((prev) => {
      // Find the event before removing it to stop its looping sound
      const event = prev.find((e) => e.id === eventId);
      if (event) {
        const soundId = getSoundId(event);
        stopLoopingSound(soundId);
      }
      return prev.filter((e) => e.id !== eventId);
    });
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
        readEventIds,
        soundsEnabled,
        connectionStats,
        isLoadingStats,
        toggleSounds: toggleSoundsHandler,
        clearEvents,
        markAsRead,
        markEventAsRead,
        dismissEvent,
        stopEventSound,
        refreshStats,
        // Persistent notifications
        persistentNotifications,
        persistentTotal,
        persistentUnreadCount,
        isPersistentLoading,
        persistentFilterType,
        fetchPersistentNotifications,
        refreshPersistentUnreadCount,
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
