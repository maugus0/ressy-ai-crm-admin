/**
 * Menu-related formatting utilities shared across menu components
 */

export const formatPriceDelta = (delta: number): string => {
  if (delta === 0) return "Free";
  return `+$${delta.toFixed(2)}`;
};

export const promptStyleLabel = (style: string): string => {
  switch (style) {
    case "ASK_ALWAYS":
      return "Always Ask";
    case "ASK_IF_MENTIONED":
      return "If Mentioned";
    case "SUGGEST_POPULAR":
      return "Suggest Popular";
    default:
      return style;
  }
};
