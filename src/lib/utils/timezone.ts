/**
 * Timezone Utility Functions
 * Handles Vancouver timezone (America/Vancouver) conversions
 * Vancouver timezone: PST (UTC-8) or PDT (UTC-7) depending on DST
 */

export const VANCOUVER_TIMEZONE = "America/Vancouver";

/**
 * Convert a date string (from datetime-local input) to ISO string in Vancouver timezone
 * The input is assumed to be in Vancouver local time (no timezone info)
 *
 * Strategy:
 * 1. Parse the datetime-local string
 * 2. Create a date object treating it as UTC
 * 3. Use Intl to format it in Vancouver timezone to see what time it represents there
 * 4. Calculate the offset and adjust
 */
export const vancouverDateTimeToISO = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";

  // Parse the datetime-local string (YYYY-MM-DDTHH:mm format)
  const [datePart, timePart] = dateTimeLocal.split("T");
  if (!datePart || !timePart) return "";

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Create a UTC date from the components
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  // Format this UTC date in Vancouver timezone to see what time it represents
  const vancouverFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VANCOUVER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const vancouverStr = vancouverFormatter.format(utcDate);
  // Format is: YYYY-MM-DD, HH:mm
  const [vcDatePart, vcTimePart] = vancouverStr.split(", ");

  if (!vcDatePart || !vcTimePart) {
    // Fallback: return as-is (shouldn't happen)
    return utcDate.toISOString();
  }

  const [vcYear, vcMonth, vcDay] = vcDatePart.split("-").map(Number);
  const [vcHour, vcMinute] = vcTimePart.split(":").map(Number);

  // Calculate the difference between what we want (input) and what we got
  // The input represents Vancouver local time, so we need to adjust the UTC date
  const targetTime = hours * 60 + minutes; // minutes since midnight
  const actualTime = vcHour * 60 + vcMinute; // minutes since midnight

  // Also check date difference (in case of day boundary)
  const targetDate = new Date(year, month - 1, day).getTime();
  const actualDate = new Date(vcYear, vcMonth - 1, vcDay).getTime();
  const dateDiffDays = Math.round((targetDate - actualDate) / (1000 * 60 * 60 * 24));

  // Calculate total difference in minutes
  const timeDiffMinutes = targetTime - actualTime + dateDiffDays * 24 * 60;

  // Adjust the UTC date by the difference (subtract because if Vancouver is behind UTC,
  // we need to add to UTC to get the same Vancouver time)
  const adjustedUTC = new Date(utcDate.getTime() - timeDiffMinutes * 60 * 1000);

  return adjustedUTC.toISOString();
};

/**
 * Convert an ISO string to datetime-local format in Vancouver timezone
 * Returns format: YYYY-MM-DDTHH:mm
 */
export const isoToVancouverDateTime = (isoString: string): string => {
  if (!isoString) return "";

  const date = new Date(isoString);

  // Format date in Vancouver timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VANCOUVER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Format a date/time in Vancouver timezone for display
 */
export const formatVancouverDateTime = (
  isoString: string,
  options?: {
    dateStyle?: "short" | "medium" | "long" | "full";
    timeStyle?: "short" | "medium" | "long" | "full";
  }
): string => {
  if (!isoString) return "";

  const date = new Date(isoString);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: VANCOUVER_TIMEZONE,
    dateStyle: options?.dateStyle || "short",
    timeStyle: options?.timeStyle || "short",
  });

  return formatter.format(date);
};

/**
 * Get Vancouver timezone offset in minutes for a given date
 * Accounts for DST automatically
 */
export const getVancouverOffset = (date: Date): number => {
  // Create a formatter for Vancouver timezone
  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const vancouverFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: VANCOUVER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Get UTC and Vancouver representations of the same moment
  const utcStr = utcFormatter.format(date);
  const vancouverStr = vancouverFormatter.format(date);

  // Parse and calculate difference
  const utcParts = utcStr.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);
  const vcParts = vancouverStr.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);

  if (utcParts && vcParts) {
    const utcTime = new Date(
      parseInt(utcParts[3]),
      parseInt(utcParts[1]) - 1,
      parseInt(utcParts[2]),
      parseInt(utcParts[4]),
      parseInt(utcParts[5]),
      parseInt(utcParts[6])
    ).getTime();

    const vcTime = new Date(
      parseInt(vcParts[3]),
      parseInt(vcParts[1]) - 1,
      parseInt(vcParts[2]),
      parseInt(vcParts[4]),
      parseInt(vcParts[5]),
      parseInt(vcParts[6])
    ).getTime();

    return (vcTime - utcTime) / (1000 * 60); // Convert to minutes
  }

  // Fallback: use a simple calculation
  return -8 * 60; // PST is UTC-8 (will be adjusted for DST by the formatter)
};

/**
 * Get current date/time in Vancouver timezone as datetime-local string
 */
export const getCurrentVancouverDateTime = (): string => {
  const now = new Date();
  return isoToVancouverDateTime(now.toISOString());
};

/**
 * Check if a time (HH:mm format) is within opening hours
 * openingTime and closingTime should be in HH:MM:SS or HH:MM format
 */
export const isWithinOpeningHours = (
  time: string, // HH:mm format
  openingTime: string | null | undefined,
  closingTime: string | null | undefined
): boolean => {
  if (!openingTime || !closingTime) return true; // No restrictions if hours not set

  // Normalize times to HH:mm format
  const normalizeTime = (t: string): string => {
    if (t.includes(":")) {
      return t.slice(0, 5); // Take HH:mm part
    }
    return t;
  };

  const normalizedTime = normalizeTime(time);
  const normalizedOpening = normalizeTime(openingTime);
  const normalizedClosing = normalizeTime(closingTime);

  // Handle case where closing time is next day (e.g., 22:00 to 02:00)
  if (normalizedClosing < normalizedOpening) {
    // Closing time is next day
    return normalizedTime >= normalizedOpening || normalizedTime <= normalizedClosing;
  }

  // Normal case: opening < closing
  return normalizedTime >= normalizedOpening && normalizedTime <= normalizedClosing;
};

/**
 * Get time from datetime-local string (HH:mm format)
 */
export const getTimeFromDateTime = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  const parts = dateTimeLocal.split("T");
  return parts[1] || "";
};

/**
 * Get Vancouver time components (hour and day of week) from a date
 * Returns hour (0-23) and dayOfWeek (1=Monday, 7=Sunday) in ISO format
 */
export const getVancouverTimeComponents = (date: Date): { hour: number; dayOfWeek: number } => {
  // Use Intl.DateTimeFormat to get components in Vancouver timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: VANCOUVER_TIMEZONE,
    hour: "numeric",
    hour12: false,
    weekday: "long",
  });

  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";

  // Convert weekday name to ISO day of week (1=Monday, 7=Sunday)
  const weekdayMap: Record<string, number> = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };
  const dayOfWeek = weekdayMap[weekday] || 1;

  return { hour, dayOfWeek };
};
