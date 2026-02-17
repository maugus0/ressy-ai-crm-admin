/**
 * Shared relative time formatting utility
 * Consolidates duplicated formatRelativeTime functions across components
 */

import { parseApiDate } from "@/lib/utils/timezone";

/**
 * Format a timestamp as a human-readable relative time string
 * e.g., "Just now", "5m ago", "2h ago", "3d ago"
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const eventTime = parseApiDate(timestamp);
  if (!eventTime) return "";

  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Format a timestamp as a human-readable relative time string with full words
 * e.g., "Just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export const formatRelativeTimeLong = (timestamp: string): string => {
  const now = new Date();
  const eventTime = parseApiDate(timestamp);
  if (!eventTime) return "";

  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};
