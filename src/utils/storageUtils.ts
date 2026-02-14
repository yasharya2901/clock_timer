// LocalStorage utilities with type safety

/**
 * Timer settings interface
 */
export interface TimerSettings {
  countdownSound: string; // 'off', '5', '10', '15', or custom number as string
  customCountdownValues?: string[]; // Array of custom countdown values
  timerSound: string; // Sound ID for timer alarm and countdown beeps
}

/**
 * Default settings for new users
 */
const DEFAULT_SETTINGS: TimerSettings = {
  countdownSound: '5',
  customCountdownValues: [],
  timerSound: 'default',
};

/**
 * Gets timer settings from localStorage
 * @returns The stored settings or default settings
 */
export function getTimerSettings(): TimerSettings {
  return getStorageJson<TimerSettings>('timer-settings', DEFAULT_SETTINGS);
}

/**
 * Saves timer settings to localStorage
 * @param settings - The settings to save
 */
export function saveTimerSettings(settings: TimerSettings): void {
  setStorageJson('timer-settings', settings);
}

/**
 * Gets an item from localStorage with type safety
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default value
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
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
    if (typeof window === 'undefined') return;
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

/**
 * Gets a JSON object from localStorage with type safety
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns The parsed object or default value
 */
export function getStorageJson<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading JSON from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Sets a JSON object in localStorage
 * @param key - The storage key
 * @param value - The value to store
 */
export function setStorageJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing JSON to localStorage:', error);
  }
}

/**
 * Gets a JSON object from sessionStorage with type safety
 * @param key - The storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns The parsed object or default value
 */
export function getSessionJson<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading JSON from sessionStorage:', error);
    return defaultValue;
  }
}

/**
 * Sets a JSON object in sessionStorage
 * @param key - The storage key
 * @param value - The value to store
 */
export function setSessionJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing JSON to sessionStorage:', error);
  }
}
