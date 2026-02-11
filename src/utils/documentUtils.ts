// Document utilities for managing page title and metadata

/**
 * Updates the document title with timer information
 * @param formattedTime - The formatted time string
 * @param isRunning - Whether the timer is currently running
 */
export function updateDocumentTitle(formattedTime: string, isRunning: boolean): void {
  if (isRunning) {
    document.title = `${formattedTime} - ClockTimer.in`;
  } else {
    document.title = 'Online Timer - Free Countdown Timer | ClockTimer.in';
  }
}
