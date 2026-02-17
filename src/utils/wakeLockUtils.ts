// Screen Wake Lock API utilities

let wakeLock: WakeLockSentinel | null = null;

/**
 * Checks if Wake Lock API is supported
 * @returns True if Wake Lock is supported
 */
export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

/**
 * Requests a wake lock to keep the screen awake
 * @returns Promise that resolves to true if wake lock was acquired, false otherwise
 */
export async function requestWakeLock(): Promise<boolean> {
  // Check if wake lock is supported
  if (!isWakeLockSupported()) {
    console.warn('Wake Lock API is not supported in this browser');
    return false;
  }

  // If we already have a wake lock, don't request another
  if (wakeLock !== null && !wakeLock.released) {
    console.log('Wake lock already active');
    return true;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake lock acquired');

    // Add event listener for when wake lock is released
    wakeLock.addEventListener('release', () => {
      console.log('Wake lock released');
    });

    return true;
  } catch (err) {
    console.error('Failed to acquire wake lock:', err);
    return false;
  }
}

/**
 * Releases the current wake lock
 * @returns Promise that resolves when wake lock is released
 */
export async function releaseWakeLock(): Promise<void> {
  if (wakeLock !== null && !wakeLock.released) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake lock released manually');
    } catch (err) {
      console.error('Failed to release wake lock:', err);
    }
  }
}

/**
 * Gets the current wake lock status
 * @returns True if wake lock is active and not released
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null && !wakeLock.released;
}

/**
 * Handles visibility change to re-request wake lock when page becomes visible
 * This is useful because wake lock is automatically released when page is hidden
 */
export function handleVisibilityChange(): void {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    requestWakeLock();
  }
}
