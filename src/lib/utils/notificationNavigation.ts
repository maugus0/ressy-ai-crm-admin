/**
 * Notification click navigation
 * Returns the path + search to show the relevant order, reservation, escalation, or call.
 */

import type { Notification } from "@/types/notification.types";

/**
 * Get the navigation target for a notification click.
 * - Order: /orders?order_id=<id> so Orders page can open that order.
 * - Reservation: /reservations?reservation_id=<id> so Reservations page can open that reservation.
 * - Escalation: If we have data.escalation_id -> /escalations/<id>. Otherwise show the call where the escalation happened: use data.call_id or entity_id (backend often stores call_id in entity_id) -> /calls?call_id=...
 */
export function getNotificationNavigationTarget(notification: Notification): {
  pathname: string;
  search?: string;
} {
  const { type, entity_id, data } = notification;
  const d = data ?? {};

  if (type === "order") {
    const orderId = (d.order_id as number) ?? entity_id;
    if (orderId != null) {
      return { pathname: "/orders", search: `?order_id=${orderId}` };
    }
    return { pathname: "/orders" };
  }

  if (type === "reservation") {
    const reservationId = (d.reservation_id as number) ?? entity_id;
    if (reservationId != null) {
      return { pathname: "/reservations", search: `?reservation_id=${reservationId}` };
    }
    return { pathname: "/reservations" };
  }

  if (type === "escalation") {
    const escalationId = d.escalation_id as number | undefined;
    // Prefer explicit call_id in data; fall back to entity_id (backend often stores call_id there for escalations)
    const callId =
      d.call_id != null ? String(d.call_id) : entity_id != null ? String(entity_id) : undefined;
    if (escalationId != null) {
      return { pathname: `/escalations/${escalationId}` };
    }
    if (callId != null && callId !== "") {
      return { pathname: "/calls", search: `?call_id=${encodeURIComponent(callId)}` };
    }
    return { pathname: "/escalations" };
  }

  if (type === "system") {
    if (
      notification.subtype === "kill_switch_toggled" ||
      notification.subtype === "kill_switch_bulk_updated"
    ) {
      return { pathname: "/kill-switch" };
    }
    return { pathname: "/notifications" };
  }

  return { pathname: "/notifications" };
}
