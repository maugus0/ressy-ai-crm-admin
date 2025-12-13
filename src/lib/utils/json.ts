/**
 * JSON Utility Functions
 * Safe JSON parsing and validation
 */

/**
 * Safely parses a JSON string and ensures the result is an object (not primitive)
 * Returns empty object for invalid input
 */
export const safeParseJsonObject = (
  jsonString: string | undefined | null
): Record<string, unknown> => {
  if (!jsonString || jsonString.trim() === "") return {};

  try {
    const parsed = JSON.parse(jsonString);

    // Ensure result is an object and not null or primitive
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * Validates if a string is valid JSON that parses to an object
 * Returns { valid: boolean, error?: string, data?: object }
 */
export const validateJsonObject = (
  jsonString: string
): { valid: boolean; error?: string; data?: Record<string, unknown> } => {
  if (!jsonString || jsonString.trim() === "") {
    return { valid: true, data: {} };
  }

  try {
    const parsed = JSON.parse(jsonString);

    if (parsed === null) {
      return { valid: false, error: "Cannot be null" };
    }

    if (typeof parsed !== "object") {
      return { valid: false, error: "Must be a JSON object, not a primitive value" };
    }

    if (Array.isArray(parsed)) {
      return { valid: false, error: "Must be a JSON object, not an array" };
    }

    return { valid: true, data: parsed as Record<string, unknown> };
  } catch (e) {
    return { valid: false, error: "Invalid JSON format" };
  }
};
