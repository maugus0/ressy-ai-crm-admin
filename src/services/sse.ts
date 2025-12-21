/**
 * SSE (Server-Sent Events) Service
 * Handles real-time event streaming from the backend
 *
 * Uses standard EventSource API with token query parameter
 * Backend supports both Authorization header and query param authentication
 */

import { env } from "@/config/env";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { api, getAccessToken } from "@/lib/api/client";
import type { SSEEvent, SSEConnectionStats, SSEEscalationType } from "@/types/api.types";

// ============================================================================
// Types
// ============================================================================

export interface SSEConnectOptions {
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  restaurantId?: number;
}

// ============================================================================
// SSE Service
// ============================================================================

/**
 * Connect to SSE event stream using standard EventSource API
 * Token is passed via query parameter (backend supports both header and query param)
 * Returns an EventSource that should be closed when no longer needed
 */
export const connectToSSE = (options: SSEConnectOptions): EventSource | null => {
  const { onEvent, onError, onOpen, restaurantId } = options;

  const token = getAccessToken();
  if (!token) {
    console.error("SSE: No access token available");
    return null;
  }

  // Build URL with token as query parameter
  let url = `${env.API_URL}${ENDPOINTS.SSE.STREAM}?token=${encodeURIComponent(token)}`;
  if (restaurantId) {
    url += `&restaurant_id=${restaurantId}`;
  }

  try {
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log("SSE: Connection established");
      onOpen?.();
    };

    // Helper to parse and handle SSE events
    const handleSSEMessage = (event: MessageEvent) => {
      try {
        const parsedEvent = JSON.parse(event.data) as SSEEvent;
        console.log("SSE: Event received:", parsedEvent.event_type, parsedEvent.subtype);
        onEvent(parsedEvent);
      } catch (error) {
        console.error("SSE: Failed to parse event:", error, event.data);
      }
    };

    // Listen for generic messages (no event type specified)
    eventSource.onmessage = (event) => {
      try {
        const parsedEvent = JSON.parse(event.data) as SSEEvent;

        // Skip heartbeat events for normal handling (but log them for debugging)
        if (parsedEvent.event_type === "heartbeat") {
          console.debug("SSE: Heartbeat received");
          return;
        }

        console.log("SSE: Generic message received:", parsedEvent.event_type);
        onEvent(parsedEvent);
      } catch (error) {
        console.error("SSE: Failed to parse event:", error, event.data);
      }
    };

    // Listen for named event types (backend sends event: escalation, event: order, etc.)
    // The backend uses these event types: escalation, order, reservation, heartbeat
    const eventTypes = ["escalation", "order", "reservation", "heartbeat"];

    eventTypes.forEach((eventType) => {
      eventSource.addEventListener(eventType, (event) => {
        if (eventType === "heartbeat") {
          console.debug("SSE: Heartbeat received");
          return;
        }
        handleSSEMessage(event as MessageEvent);
      });
    });

    eventSource.onerror = (error) => {
      console.error("SSE: Connection error:", error);
      onError?.(error);
    };

    return eventSource;
  } catch (error) {
    console.error("SSE: Failed to create EventSource:", error);
    return null;
  }
};

/**
 * Disconnect from SSE event stream
 */
export const disconnectFromSSE = (eventSource: EventSource | null) => {
  if (eventSource) {
    eventSource.close();
    console.log("SSE: Connection closed");
  }
};

/**
 * Trigger an escalation event
 */
export const triggerEscalation = async (
  restaurantId: number,
  type: SSEEscalationType,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> => {
  const response = await api.post(ENDPOINTS.SSE.ESCALATION(restaurantId), {
    type,
    data,
  });

  if (response.error) {
    return { success: false, error: response.error };
  }

  return { success: true };
};

/**
 * Get SSE connection statistics (admin only)
 */
export const getSSEStats = async (): Promise<SSEConnectionStats | null> => {
  const response = await api.get<SSEConnectionStats>(ENDPOINTS.SSE.STATS);

  if (response.error || !response.data) {
    console.error("Failed to get SSE stats:", response.error);
    return null;
  }

  return response.data;
};
