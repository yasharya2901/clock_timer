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
 * @param isRunning - Whether the timer is currently running
 * @param themeColor - The primary theme color
 * @param themeDark - The dark theme color
 * @returns HTML string for PiP window
 */
export function createPipContent(timeString: string, isRunning: boolean = true, themeColor: string = '#22c55e', themeDark: string = '#16a34a'): string {
  return `
    <style>
      @keyframes fallDown {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(200px); opacity: 0; }
      }
      .fall-animation {
        animation: fallDown 0.5s ease-in forwards;
      }
    </style>
    <div style="
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      margin: 0;
      padding: 0;
      font-family: 'JetBrains Mono', monospace;
      gap: 1.5rem;
    ">
      <div id="pip-time" style="
        font-size: 4rem;
        font-weight: bold;
        color: #f5f1e3;
        text-shadow: 0 0 40px rgba(245, 241, 227, 0.3);
        letter-spacing: 0.1em;
      ">${timeString}</div>
      ${!isRunning ? `
        <button id="pip-start-btn" style="
          background: ${themeColor};
          color: #0a0a0a;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          font-family: 'Arial', sans-serif;
          font-size: 1.5rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 0 ${themeDark};
          transition: all 0.2s;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
        " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">▶</button>
      ` : ''}
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
 * Updates the PiP window content based on running state
 * @param pipWindow - The PiP window object
 * @param formattedTime - The formatted time string
 * @param isRunning - Whether the timer is running
 * @param themeColor - The primary theme color
 * @param themeDark - The dark theme color
 * @param onStartClick - Callback when start button is clicked
 */
export function updatePipContent(pipWindow: Window | null, formattedTime: string, isRunning: boolean, themeColor: string, themeDark: string, onStartClick?: () => void): void {
  if (pipWindow) {
    pipWindow.document.body.innerHTML = createPipContent(formattedTime, isRunning, themeColor, themeDark);
    
    if (!isRunning && onStartClick) {
      const startBtn = pipWindow.document.getElementById('pip-start-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          startBtn.classList.add('fall-animation');
          setTimeout(() => {
            onStartClick();
          }, 300);
        });
      }
    }
  }
}

/**
 * Opens a Picture-in-Picture window
 * @param formattedTime - The formatted time string to display
 * @param isRunning - Whether the timer is currently running
 * @param themeColor - The primary theme color
 * @param themeDark - The dark theme color
 * @param onStartClick - Callback when start button is clicked
 * @param width - Width of the PiP window (default: 400)
 * @param height - Height of the PiP window (default: 200)
 * @returns Promise resolving to the PiP window object
 */
export async function openPipWindow(
  formattedTime: string,
  isRunning: boolean = true,
  themeColor: string = '#22c55e',
  themeDark: string = '#16a34a',
  onStartClick?: () => void,
  width: number = 400,
  height: number = 200
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
  pipWindow.document.body.innerHTML = createPipContent(formattedTime, isRunning, themeColor, themeDark);
  
  // Add start button event listener if not running
  if (!isRunning && onStartClick) {
    const startBtn = pipWindow.document.getElementById('pip-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        startBtn.classList.add('fall-animation');
        setTimeout(() => {
          onStartClick();
        }, 300);
      });
    }
  }

  return pipWindow;
}
