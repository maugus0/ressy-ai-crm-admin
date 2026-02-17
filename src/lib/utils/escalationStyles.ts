/**
 * Shared escalation status and urgency styling utilities
 * Consolidates duplicated color mappings across escalation-related pages
 */

import type { EscalationStatus, EscalationUrgency } from "@/types/escalation.types";

/**
 * Badge color classes for escalation status
 */
export const escalationStatusColors: Record<EscalationStatus, string> = {
  raised: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  forwarded: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
};

/**
 * Badge color classes for escalation urgency
 */
export const escalationUrgencyColors: Record<EscalationUrgency, string> = {
  standard: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};
