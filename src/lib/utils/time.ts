/**
 * Time Utility Functions
 * Handles time format conversions and validation
 */

// Regex patterns for time formats
const TIME_HH_MM_SS = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates if a time string is in valid HH:MM or HH:MM:SS format
 * with proper hour (00-23) and minute/second (00-59) ranges
 */
export const isValidTimeFormat = (time: string): boolean => {
  return TIME_HH_MM_SS.test(time) || TIME_HH_MM.test(time);
};

/**
 * Convert HH:MM to HH:MM:SS format required by backend
 * Returns undefined for empty/invalid input
 */
export const formatTimeForApi = (time: string | undefined): string | undefined => {
  if (!time || time.trim() === "") return undefined;

  // If already in HH:MM:SS format and valid, return as is
  if (TIME_HH_MM_SS.test(time)) return time;

  // If in HH:MM format and valid, append :00
  if (TIME_HH_MM.test(time)) return `${time}:00`;

  // Invalid format - return undefined
  return undefined;
};

/**
 * Convert HH:MM:SS to HH:MM format for HTML input display
 * Returns empty string for empty/invalid input
 */
export const formatTimeForInput = (time: string | null | undefined): string => {
  if (!time || time.trim() === "") return "";

  // If in HH:MM:SS format, strip seconds
  if (TIME_HH_MM_SS.test(time)) return time.slice(0, 5);

  // If already in HH:MM format, return as is
  if (TIME_HH_MM.test(time)) return time;

  // Invalid format - return empty
  return "";
};
