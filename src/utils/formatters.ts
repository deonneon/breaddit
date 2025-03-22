/**
 * Format a Unix timestamp to a readable date string
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const today = new Date();

  // Simple check if date is today by comparing date strings
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}; 