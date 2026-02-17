/**
 * Notification display helpers
 * Human-readable labels for notification types and subtypes
 */

import type { Notification, EscalationSubtype } from "@/types/notification.types";

/** Human-readable labels for escalation subtypes */
export const ESCALATION_SUBTYPE_LABELS: Record<EscalationSubtype, string> = {
  user_requested: "Human Assistance Requested",
  internal_server_error: "System Error",
  suspected_spam: "Spam Detected",
  sms_redirect_failed: "SMS Redirect Failed",
};

/**
 * Get display title for a notification.
 * Prefers data.title (from backend) when available; otherwise uses notification.title
 * or a friendly subtype label for escalation types.
 */
export function getNotificationDisplayTitle(notification: Notification): string {
  const dataTitle = notification.data?.title;
  if (dataTitle && typeof dataTitle === "string") {
    return dataTitle;
  }
  // Fallback: use friendly subtype label for escalation if title looks like "type/subtype"
  if (notification.type === "escalation" && notification.subtype) {
    const label = ESCALATION_SUBTYPE_LABELS[notification.subtype as EscalationSubtype];
    if (label) return label;
  }
  return notification.title;
}

/**
 * Get display message/description for a notification.
 * Prefers data.description (from backend) when available; otherwise uses notification.message.
 */
export function getNotificationDisplayMessage(notification: Notification): string | null {
  const dataDesc = notification.data?.description;
  if (dataDesc && typeof dataDesc === "string") {
    return dataDesc;
  }
  return notification.message;
}

/**
 * Get human-readable label for escalation subtype.
 * Use for Type column/badge when displaying escalation notifications.
 */
export function getEscalationSubtypeLabel(subtype: EscalationSubtype): string {
  return ESCALATION_SUBTYPE_LABELS[subtype] ?? subtype.replace(/_/g, " ");
}
