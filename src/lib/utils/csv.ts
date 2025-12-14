/**
 * CSV Parsing Utilities
 * Provides safe CSV parsing with injection prevention
 */

/**
 * Sanitize CSV value to prevent CSV injection attacks
 * Removes potentially dangerous formula prefixes
 */
export const sanitizeCSVValue = (value: string): string => {
  const trimmed = value.trim();
  // Remove formula injection prefixes: =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return trimmed.replace(/^[=+\-@\t\r]+/, "");
  }
  return trimmed;
};

/**
 * Parse a CSV line that handles quoted values with commas
 * Supports escaped quotes within quoted fields
 */
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote)
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator (comma outside quotes)
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
};

/**
 * Maximum file size for CSV uploads (5MB)
 */
export const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate CSV file size
 */
export const validateCSVFileSize = (file: File, maxSize: number = MAX_CSV_FILE_SIZE): boolean => {
  return file.size <= maxSize;
};
