// LocalStorage utilities with type safety

/**
 * Gets an item from localStorage with type safety
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default value
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (item as unknown as T) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Sets an item in localStorage
 * @param key - The storage key
 * @param value - The value to store
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Validates if a value exists in a set of allowed values
 * @param value - Value to validate
 * @param allowedValues - Object containing allowed values
 * @returns True if value is valid
 */
export function isValidStorageValue<T extends Record<string, any>>(
  value: string | null,
  allowedValues: T
): boolean {
  return value !== null && value in allowedValues;
}
