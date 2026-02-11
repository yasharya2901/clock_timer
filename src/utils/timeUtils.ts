// Time formatting utilities

/**
 * Formats time values into a displayable string
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "25:00" or "1:30:45")
 */
export function formatTime(hours: number, minutes: number, seconds: number): string {
  const parts = [];
  if (hours > 0) parts.push(String(hours).padStart(2, '0'));
  parts.push(String(minutes).padStart(2, '0'));
  parts.push(String(seconds).padStart(2, '0'));
  return parts.join(':');
}

/**
 * Validates and clamps a time value within specified bounds
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clampTime(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
