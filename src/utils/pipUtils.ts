// Picture-in-Picture utilities

/**
 * Checks if Document Picture-in-Picture API is supported
 * @returns True if PiP is supported
 */
export function isPipSupported(): boolean {
  return 'documentPictureInPicture' in window;
}

/**
 * Creates the PiP window HTML content
 * @param timeString - Formatted time string to display
 * @returns HTML string for PiP window
 */
export function createPipContent(timeString: string): string {
  return `
    <div style="
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      margin: 0;
      padding: 0;
      font-family: 'JetBrains Mono', monospace;
    ">
      <div id="pip-time" style="
        font-size: 4rem;
        font-weight: bold;
        color: #f5f1e3;
        text-shadow: 0 0 40px rgba(245, 241, 227, 0.3);
        letter-spacing: 0.1em;
      ">${timeString}</div>
    </div>
  `;
}

/**
 * Copies stylesheets from parent window to PiP window
 * @param pipWindow - The PiP window object
 */
export function copyStylesToPip(pipWindow: Window): void {
  const styleSheets = Array.from(document.styleSheets);
  styleSheets.forEach((styleSheet) => {
    try {
      const cssRules = Array.from(styleSheet.cssRules)
        .map((rule) => rule.cssText)
        .join('');
      const style = pipWindow.document.createElement('style');
      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch (e) {
      // Cross-origin stylesheets will throw, add link instead
      const link = pipWindow.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = (styleSheet as any).href;
      pipWindow.document.head.appendChild(link);
    }
  });
}

/**
 * Updates the time display in the PiP window
 * @param pipWindow - The PiP window object
 * @param formattedTime - The formatted time string
 */
export function updatePipTime(pipWindow: Window | null, formattedTime: string): void {
  if (pipWindow) {
    const timeElement = pipWindow.document.getElementById('pip-time');
    if (timeElement) {
      timeElement.textContent = formattedTime;
    }
  }
}

/**
 * Opens a Picture-in-Picture window
 * @param formattedTime - The formatted time string to display
 * @param width - Width of the PiP window (default: 400)
 * @param height - Height of the PiP window (default: 150)
 * @returns Promise resolving to the PiP window object
 */
export async function openPipWindow(
  formattedTime: string,
  width: number = 400,
  height: number = 150
): Promise<Window> {
  const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
    width,
    height,
  });

  // Set minimal title
  pipWindow.document.title = '';

  // Copy styles to PiP window
  copyStylesToPip(pipWindow);

  // Create timer display
  pipWindow.document.body.innerHTML = createPipContent(formattedTime);

  return pipWindow;
}
