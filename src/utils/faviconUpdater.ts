// Dynamic favicon updater utility
export function updateFavicon(color: string = '#ffffff') {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="50" cy="50" r="30" stroke="${color}" stroke-width="8" fill="none" filter="url(#glow)"/>
    </svg>
  `;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  // Update or create favicon link
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  // Clean up previous blob URL
  if (link.href.startsWith('blob:')) {
    URL.revokeObjectURL(link.href);
  }

  link.type = 'image/svg+xml';
  link.href = url;
}
