/**
 * Shared notification type icon utilities
 * Consolidates duplicated icon mappings across notification-related components
 */

import { AlertTriangle, Bell, CalendarDays, ShieldAlert, ShoppingBag } from "lucide-react";
import type { NotificationType } from "@/types/notification.types";
import type { SSEEvent } from "@/types/api.types";

/**
 * Get the appropriate icon for a notification type
 */
export const getNotificationTypeIcon = (type: NotificationType, className = "h-4 w-4") => {
  switch (type) {
    case "order":
      return <ShoppingBag className={`${className} text-blue-500`} />;
    case "reservation":
      return <CalendarDays className={`${className} text-green-500`} />;
    case "escalation":
      return <AlertTriangle className={`${className} text-destructive`} />;
    case "system":
      return <ShieldAlert className={`${className} text-amber-500`} />;
    default:
      return <Bell className={className} />;
  }
};

/**
 * Get the appropriate icon for an SSE event
 */
export const getSSEEventIcon = (event: SSEEvent, className = "h-4 w-4") => {
  switch (event.event_type) {
    case "escalation":
      return <AlertTriangle className={`${className} text-destructive`} />;
    case "order":
      return <ShoppingBag className={`${className} text-blue-500`} />;
    case "reservation":
      return <CalendarDays className={`${className} text-green-500`} />;
    case "system":
      return <ShieldAlert className={`${className} text-amber-500`} />;
    default:
      return <Bell className={className} />;
  }
};

/**
 * Badge color classes for notification types
 */
export const notificationTypeBadgeColors: Record<NotificationType, string> = {
  order: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  reservation: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  escalation: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  system: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};
