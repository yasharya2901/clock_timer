# ClockTimer.in - Online Timer Application

A production-ready, SEO-optimized online countdown timer built with Astro and React. Features advanced functionality including customizable sounds, Picture-in-Picture mode, multiple themes, and persistent state management.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd clock_timer

# Install dependencies
npm install

# Start development server
npm run dev
```

That's it! Open http://localhost:3000 in your browser.

## 📦 Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production with type checking
npm run preview  # Preview production build
npm run check    # Run Astro type checking
npm run format   # Format code with Prettier
npm run lint     # Lint code with ESLint
```

## ✨ Features Overview

### ⏱️ Core Timer Features
- **Countdown Timer**: Hours, minutes, and seconds support (up to 99:59:59)
- **Quick Adjustments**: ±5 minute buttons for fast time changes
- **Repeat Mode**: Automatically restart timer when it completes
- **Edit Mode**: Click on time to manually edit hours, minutes, seconds
- **State Persistence**: Timer state survives page refreshes using sessionStorage

### 🎨 Visual Customization
- **5 Color Themes**: Green (default), Yellow, Blue, Purple, Red
- **Dynamic Favicon**: Changes color based on selected theme
- **Smooth Transitions**: All theme changes animate smoothly
- **Responsive Design**: Optimized for all screen sizes
- **Focus Mode**: Distraction-free, extra-large timer display

### 🔊 Audio System
- **9 Sound Options**: Default, Beep, Chirp, Digital, E-Chirp, Heartbeat, Long Pop, Pop, War
- **Countdown Beeps**: Configurable threshold (5, 10, 15 seconds or custom)
- **Completion Alarm**: Plays when timer reaches 0:00:00
- **Smart Caching**: All sounds pre-loaded and cached for instant playback
- **Fallback System**: Uses Web Audio API if files fail to load

### 🪟 Advanced Display Modes
- **Picture-in-Picture**: Floating timer window that stays on top of all windows
- **Focus Mode**: Click-to-exit full-timer view (ESC or click to exit)
- **Fullscreen Mode**: Standard browser fullscreen
- **Dynamic Tab Title**: Shows countdown in browser tab when running

### 💾 State Management
- **Session Persistence**: Timer state saved across page refreshes
- **Theme Preference**: Remembered in localStorage
- **Sound Settings**: Countdown and alarm preferences persisted
- **Custom Values**: Store up to 2 custom countdown thresholds

### ♿ Accessibility & SEO
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Proper ARIA labels
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards
- **Structured Data**: JSON-LD schema for search engines
- **Fast Loading**: Deferred hydration with Astro's `client:idle`

## 📁 Project Structure

```
clock_timer/
├── src/
│   ├── pages/
│   │   ├── index.astro          # Main page with SEO configuration
│   │   └── 404.astro            # 404 error page
│   ├── components/
│   │   └── Timer.tsx            # Main React timer component (915 lines)
│   ├── utils/
│   │   ├── audioUtils.ts        # Audio playback (alarm & countdown beeps)
│   │   ├── documentUtils.ts     # Dynamic document title updates
│   │   ├── faviconUpdater.ts    # Dynamic SVG favicon generation
│   │   ├── pipUtils.ts          # Picture-in-Picture window management
│   │   ├── soundManager.ts      # Sound caching & loading system
│   │   ├── storageUtils.ts      # localStorage/sessionStorage helpers
│   │   └── timeUtils.ts         # Time formatting & validation
│   └── styles/
│       └── global.css           # Global Tailwind styles
├── public/
│   ├── robots.txt               # SEO crawler directives
│   ├── site.webmanifest        # PWA manifest
│   └── sounds/                  # Audio files (8 alarm sounds)
├── docs/
│   ├── DEPLOYMENT.md
│   ├── QUICKSTART.md
│   └── SEO-GUIDE.md
├── astro.config.mjs             # Astro configuration
├── tailwind.config.mjs          # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies & scripts
```

## 🔧 Feature Deep Dive

### 1. Timer Core Functionality

#### High-Level Overview
The timer provides precise countdown functionality with user-friendly controls. Users can set time up to 99 hours, 59 minutes, and 59 seconds. The timer can be started, paused, reset, and automatically repeated.

#### Low-Level Implementation
- **State Management**: Uses React's `useState` hooks for `hours`, `minutes`, `seconds`, and `isRunning` state
- **Timer Mechanism**: `useEffect` with `setInterval` (1000ms) for countdown logic
  - Decrements seconds, cascades to minutes/hours when needed
  - Checks for completion (0:0:0) on each tick
  - Triggers alarm sound and handles repeat mode on completion
- **State Persistence**: `useEffect` saves state to `sessionStorage` as JSON on every change
  - Restores state on component mount using `getSessionJson()` 
  - Persists: current time, running state, repeat mode, initial time values
- **Reference Tracking**: Uses `useRef` to store initial time values (for reset/repeat)
  - `initialHours`, `initialMinutes`, `initialSeconds` refs
  - Updated when timer starts from non-running state

#### Key Code Patterns
```typescript
// Timer countdown logic with cascade
setSeconds(prev => {
  if (prev === 0) {
    setMinutes(prevMin => {
      if (prevMin === 0) {
        setHours(prevHours => {
          if (prevHours === 0) {
            // Timer complete - play alarm & handle repeat
            playAlarm(settings.timerSound);
            return isRepeat ? initialHours.current : 0;
          }
          return prevHours - 1;
        });
        return prevMin === 0 ? (isRepeat ? initialMinutes.current : 0) : 59;
      }
      return prevMin - 1;
    });
    return prev === 0 ? (isRepeat ? initialSeconds.current : 0) : 59;
  }
  return prev - 1;
});
```

---

### 2. Theme System

#### High-Level Overview
Five color themes (Green, Yellow, Blue, Purple, Red) that transform the entire UI. Theme changes animate smoothly and persist across sessions.

#### Low-Level Implementation
- **Theme Storage**: Theme choice saved to `localStorage` using `setStorageItem('timer-theme', theme)`
- **Color Definitions**: Object mapping in component:
  ```typescript
  const themes = {
    green: { primary: '#22c55e', dark: '#16a34a', name: 'Green' },
    // ... other themes
  };
  ```
- **Transition Effect**: White-to-color transition on initial load
  - `isInitialLoad` state tracks first render
  - `setTimeout` after 100ms sets `isInitialLoad` to false
  - CSS transitions handle smooth color morphing (1s ease-in-out)
- **Dynamic Styling**: Inline styles with `displayTheme` object
  - All themed elements use `style={{ color: displayTheme.primary }}`
  - Buttons use both primary and dark (for box-shadow effects)
- **Favicon Integration**: `useEffect` calls `updateFavicon(themeColor)` on theme change
  - Generates dynamic SVG with theme color
  - Creates blob URL and updates `<link rel="icon">` href

---

### 3. Sound System

#### High-Level Overview
Comprehensive audio system with 9 pre-loaded sounds, configurable countdown beeps, and alarm playback. All sounds are cached for instant playback.

#### Low-Level Implementation

**Sound Manager** (`soundManager.ts`):
- **Caching Strategy**: Cache API + Memory double-caching
  - On init: Fetches all MP3 files from `/sounds/` directory
  - Stores responses in browser Cache API (`'timer-sounds-v1'`)
  - Converts to Blob URLs and creates `Audio` elements
  - Stores Audio elements in `Map<string, HTMLAudioElement>`
- **Sound Options Array**:
  ```typescript
  SOUND_OPTIONS = [
    { id: 'default', displayName: 'Default' },
    { id: 'beep', displayName: 'Beep', filePath: '/sounds/beep.mp3' },
    // ... 7 more sounds
  ];
  ```
- **Cloning for Simultaneous Playback**: `getSound()` clones cached Audio element
  - Allows multiple beeps to overlap without interruption

**Audio Utilities** (`audioUtils.ts`):
- **playAlarm()**: Full volume (1.0) playback
- **playCountdownBeep()**: Half volume (0.5) for less intrusive sound
- **Fallback System**: If file loading fails, uses Web Audio API
  - `AudioContext` with `OscillatorNode` for synthesized tones
  - Alarm: 800Hz, 0.3s duration
  - Beep: 600Hz, 0.15s duration

**Countdown Beep Logic**:
- Runs in timer `useEffect` before decrement
- Checks: `totalSeconds <= threshold && totalSeconds > 0`
- Plays sound at every second within threshold
- Supports: 5, 10, 15 seconds, or custom values (stored in settings)

---

### 4. Picture-in-Picture (PiP)

#### High-Level Overview
Creates a floating window that displays the timer and stays on top of all other windows. Users can control the timer from PiP.

#### Low-Level Implementation

**API Check**: Uses Document Picture-in-Picture API
```typescript
isPipSupported = 'documentPictureInPicture' in window
```

**Window Creation** (`pipUtils.ts`):
1. Request PiP window: `documentPictureInPicture.requestWindow({ width, height })`
2. Create HTML content dynamically with inline styles
3. Copy stylesheets from parent window (or link to external CSS)
4. Inject content into `pipWindow.document.body`
5. Add event listeners for Start button (if paused)

**Real-Time Updates**:
- **Time Updates**: `useEffect` watches `[hours, minutes, seconds, isPipActive]`
  - Calls `updatePipTime(pipWindow, formattedTime)` 
  - Updates `#pip-time` element's `textContent`
- **State Updates**: `useEffect` watches `[isRunning, isPipActive]`
  - Calls `updatePipContent()` to rebuild entire body HTML
  - Adds/removes Start button based on running state

**Window Reference Management**:
- Stored in `useRef`: `pipWindowRef.current`
- Clean up on close: Listen to `'pagehide'` event
  - Sets `isPipActive` to false
  - Nullifies window reference

**Interactive Controls**:
- Start button in PiP calls parent `handleStart()` via closure
- Fall animation before starting (0.5s CSS animation)

---

### 5. Focus Mode (Timer-Only Mode)

#### High-Level Overview
Full-screen, distraction-free timer display with extra-large fonts. Exit by clicking anywhere or pressing ESC.

#### Low-Level Implementation
- **State Toggle**: `timerOnlyMode` boolean state
- **Conditional Rendering**: Ternary in main render
  ```typescript
  {timerOnlyMode ? <FocusModeDisplay /> : <NormalModeDisplay />}
  ```
- **Exit Mechanisms**:
  1. **Click**: `onClick={() => setTimerOnlyMode(false)}` on wrapper div
  2. **Keyboard**: `useEffect` with keydown listener
     ```typescript
     if (e.key === 'Escape' && timerOnlyMode) setTimerOnlyMode(false)
     ```
- **Responsive Sizing**: Uses `clamp()` CSS for fluid typography
  - No hours: `fontSize: 'clamp(4.5rem, 16vw, 30rem)'`
  - With hours: `fontSize: 'clamp(3.5rem, 13vw, 24rem)'`
  - Adjusts gaps dynamically based on hours presence
- **Visual Design**: 
  - Removes all navigation/controls
  - Centers timer with flexbox
  - Adds text-shadow glow effect
  - Shows "Click anywhere or press ESC" on hover (title attribute)

---

### 6. State Persistence System

#### High-Level Overview
Timer state survives page refreshes, browser crashes, and accidental closures. Preferences persist indefinitely.

#### Low-Level Implementation

**Storage Utilities** (`storageUtils.ts`):

Two storage mechanisms:

1. **SessionStorage** (dies with tab/browser close):
   - Timer state: `hours`, `minutes`, `seconds`, `isRunning`, `isRepeat`
   - Initial time values for reset/repeat
   - Uses `setSessionJson()` helper with JSON.stringify

2. **LocalStorage** (persists forever):
   - Theme preference: `'timer-theme'`
   - Sound settings: 
     ```typescript
     interface TimerSettings {
       countdownSound: string;      // '5', '10', '15', 'off', or custom
       customCountdownValues: string[];  // User's custom thresholds
       timerSound: string;          // Selected alarm sound ID
     }
     ```

**Restore Flow**:
1. Component mounts
2. `useEffect` with empty dependency array runs once
3. Reads from storage: `getSessionJson('timer-state', null)`
4. If found: Updates all state with saved values
5. If not found: Uses default state (0:15:00)

**Save Flow**:
1. Any state change triggers `useEffect` with dependencies
2. Current values packaged into object
3. `setSessionJson('timer-state', timerState)` called
4. JSON.stringify converts to string
5. Stored in sessionStorage

**Type Safety**:
- Generic helper functions: `getStorageJson<T>(key, default)`
- Type checking with interfaces
- Validation helper: `isValidStorageValue()`

---

### 7. Dynamic UI Features

#### High-Level Overview
The browser tab title shows live countdown, and the favicon changes color with themes.

#### Low-Level Implementation

**Document Title** (`documentUtils.ts`):
- **Live Updates**: `useEffect` watches `[hours, minutes, seconds, isRunning]`
- **Conditional Text**:
  - Running: `"25:00 - ClockTimer.in"`
  - Paused: `"Online Timer - Free Countdown Timer | ClockTimer.in"`
- **Format Function**: `formatTime()` creates "HH:MM:SS" or "MM:SS" string

**Dynamic Favicon** (`faviconUpdater.ts`):
- **SVG Generation**: Creates SVG string with template literal
  ```typescript
  const svg = `<svg>...<circle stroke="${color}"/></svg>`
  ```
- **Glow Effect**: SVG filter with `feGaussianBlur` for soft glow
- **Blob URL Creation**: 
  1. `new Blob([svg], { type: 'image/svg+xml' })`
  2. `URL.createObjectURL(blob)`
  3. Assign to `<link rel="icon">` href
- **Memory Management**: Revokes old blob URL before creating new one
  ```typescript
  if (link.href.startsWith('blob:')) URL.revokeObjectURL(link.href)
  ```
- **White-to-Color Transition**: Matches theme transition timing
  - Starts white on mount
  - Transitions to theme color after 100ms

---

### 8. Edit Mode

#### High-Level Overview
Click the timer display to enter edit mode with dedicated input fields and increment/decrement controls.

#### Low-Level Implementation
- **State Management**:
  - `isEditing`: Boolean toggle
  - `editHours`, `editMinutes`, `editSeconds`: String states (for empty inputs)
  - `focusedField`: Tracks which input has focus ('')
- **Entry**: Click handler on timer display (only when not running)
  ```typescript
  onClick={handleTimeClick}  // Sets isEditing=true, populates edit states
  ```
- **Input Fields**: Three number inputs with:
  - `type="number"`, `min`, `max` attributes
  - `onFocus` sets `focusedField` state
  - Dynamic border color based on focus
  - CSS to hide spinners: `[appearance:textfield]`
- **Controls**:
  - **+/- Buttons**: Call `handleIncrement()`/`handleDecrement()`
    - Respects `focusedField` to increment correct value
    - Clamps to valid ranges (hours: 0-99, min/sec: 0-59)
  - **Save**: Parses strings to integers, applies `clampTime()`, updates main state
  - **Cancel**: Reverts to previous values, exits edit mode
- **Visual Design**:
  - Gray background input boxes with cream text
  - Focused input gets theme-colored border
  - Label below each input
  - Rounded buttons with theme colors and box-shadow

---

### 9. Quick Adjustment Buttons

#### High-Level Overview
Add or subtract 5 minutes with single button press. Handles hour overflow gracefully.

#### Low-Level Implementation

**Add (+) Logic**:
```typescript
const newMinutes = minutes + 5;
if (newMinutes > 59) {
  const addedHours = Math.floor(newMinutes / 60);      // e.g., 65 / 60 = 1
  const remainingMinutes = newMinutes % 60;             // e.g., 65 % 60 = 5
  setHours(Math.min(hours + addedHours, 99));          // Cap at 99 hours
  setMinutes(remainingMinutes);
} else {
  setMinutes(newMinutes);
}
```

**Subtract (-) Logic**:
```typescript
const newMinutes = minutes - 5;
if (newMinutes < 0) {
  if (hours > 0) {
    setHours(hours - 1);
    setMinutes(60 + newMinutes);  // e.g., 60 + (-3) = 57
  } else {
    setMinutes(0);  // Floor at 0:00:00
  }
} else {
  setMinutes(newMinutes);
}
```

**UI Behavior**:
- Only visible when timer is NOT running
- Circular buttons with theme-colored borders
- Hover effect: Fill with theme color, invert text
- Positioned to right of timer display

---

### 10. Repeat Mode

#### High-Level Overview
Automatically restart timer with original time when it reaches 0:00:00.

#### Low-Level Implementation
- **Toggle**: Checkbox rendered as custom styled toggle switch
  - `isRepeat` state controls appearance
  - Switch background color changes with theme
  - Sliding circle animates with CSS transform
- **Logic Integration**: In timer countdown `useEffect`
  ```typescript
  if (prevHours === 0 && prevMin === 0 && prev === 0) {
    playAlarm();
    if (isRepeat) {
      setHours(initialHours.current);   // Reset to initial values
      setMinutes(initialMinutes.current);
      setSeconds(initialSeconds.current);
      // isRunning stays true - timer continues
    } else {
      setIsRunning(false);  // Stop timer
    }
  }
  ```
- **Initial Values**: Stored in refs, set when timer starts
  - Ensures repeated timers use the time user originally started with
  - Not affected by pause/resume cycles

---

### 11. Fullscreen Mode

#### High-Level Overview
Standard browser fullscreen using Fullscreen API.

#### Low-Level Implementation
```typescript
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};
```
- Checks current fullscreen state
- Requests fullscreen on entire document element
- Exits if already in fullscreen
- No state tracking needed (browser handles it)

---

## 🎯 SEO & Performance Features

### SEO Implementation
- **Meta Tags**: Title, description, keywords, robots, canonical URL
- **Open Graph**: og:type, og:title, og:description, og:image, og:url
- **Twitter Cards**: twitter:card, twitter:title, twitter:description, twitter:image
- **Structured Data**: JSON-LD schema for WebApplication
  - Defines app name, URL, category, pricing (free)
  - Lists key features for rich search results
- **Sitemap**: Auto-generated by `@astrojs/sitemap` integration
- **Robots.txt**: Allows all crawlers, specifies sitemap location

### Performance Optimizations
- **Deferred Hydration**: `<Timer client:idle />` in Astro
  - JavaScript loads only after browser idle
  - Faster initial page load
- **Font Preloading**: `<link rel="preconnect">` for Google Fonts
- **CSS Inlining**: Small stylesheets inlined automatically
- **Sound Caching**: Cache API + memory caching prevents repeated downloads
- **Blob URL Management**: Cleanup of old URLs prevents memory leaks
- **Build Optimizations**:
  - HTML compression enabled
  - CSS code splitting
  - esbuild minification
  - No sourcemaps in production

### Accessibility
- **Semantic HTML**: `<nav>`, `<button>`, proper heading hierarchy
- **Keyboard Navigation**: All interactive elements reachable
- **Focus Management**: Visible focus states on inputs
- **ARIA Labels**: Descriptive labels where needed
- **Screen Reader Support**: Text alternatives for icon buttons
- **No-JS Fallback**: `<noscript>` section with instructions

---

## 🛠️ Technology Stack

### Core Frameworks
- **Astro 5.17.1**: Static site generation with partial hydration
- **React 18.3.1**: UI component library for interactive timer
- **TypeScript 5.6.2**: Type-safe development

### Styling
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Custom Fonts**: JetBrains Mono (timer), Space Mono (UI)

### Build Tools & Integrations
- **@astrojs/react**: React integration for Astro
- **@astrojs/tailwind**: Tailwind CSS integration
- **@astrojs/sitemap**: Automatic sitemap generation
- **@vercel/analytics**: Web analytics (optional)

### Browser APIs Used
- **Web Audio API**: Fallback sound synthesis
- **Cache API**: Sound file caching
- **localStorage**: Theme and settings persistence
- **sessionStorage**: Timer state during session
- **Document PiP API**: Floating window support
- **Fullscreen API**: Fullscreen mode
- **Intersection Observer**: Astro's idle hydration

---

## 🎨 Customization Guide

### Changing Colors

Edit [tailwind.config.mjs](tailwind.config.mjs):
```javascript
colors: {
  'bg-black': '#0a0a0a',      // Background
  'cream': '#f5f1e3',         // Text color
}
```

Add new theme in [Timer.tsx](src/components/Timer.tsx):
```typescript
const themes = {
  // ... existing themes
  orange: { primary: '#f97316', dark: '#ea580c', name: 'Orange' },
};
```

### Adding New Sounds

1. Add MP3 file to `/public/sounds/`
2. Update [soundManager.ts](src/utils/soundManager.ts):
```typescript
export const SOUND_OPTIONS: SoundOption[] = [
  // ... existing sounds
  { id: 'mysound', displayName: 'My Sound', filePath: '/sounds/mysound.mp3' },
];
```
3. Sound auto-loads on app initialization

### Changing Fonts

Update Google Fonts link in [index.astro](src/pages/index.astro):
```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font&display=swap" rel="stylesheet">
```

Update Tailwind config:
```javascript
fontFamily: {
  'jet': ['Your Font', 'monospace'],
}
```

### Modifying Timer Limits

Edit in [Timer.tsx](src/components/Timer.tsx):
```typescript
setHours(clampTime(newHours, 0, 99));  // Change 99 to your max
```

---

## 📱 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core Timer | ✅ | ✅ | ✅ | ✅ |
| Themes | ✅ | ✅ | ✅ | ✅ |
| Sounds | ✅ | ✅ | ✅ | ✅ |
| Picture-in-Picture | ✅ 116+ | ❌ | ❌ | ✅ 116+ |
| Fullscreen | ✅ | ✅ | ✅ | ✅ |
| Storage APIs | ✅ | ✅ | ✅ | ✅ |

**Note**: Picture-in-Picture requires Document PiP API (Chrome/Edge 116+). Other features work on all modern browsers.

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload ./dist folder to Netlify
```

### Static Hosting
```bash
npm run build
# Upload ./dist folder to any static host (GitHub Pages, Cloudflare Pages, etc.)
```

### Environment Variables
None required! This is a fully static site with no backend dependencies.

---

## 🧪 Development Tips

### Hot Module Replacement
Astro dev server supports HMR. Changes to Timer.tsx reflect instantly without page reload.

### TypeScript Checking
```bash
npm run check  # Run before committing
```

### Adding Debug Logging
In [Timer.tsx](src/components/Timer.tsx), add console logs:
```typescript
useEffect(() => {
  console.log('Timer state:', { hours, minutes, seconds, isRunning });
}, [hours, minutes, seconds, isRunning]);
```

### Testing Sounds Locally
Sounds require HTTP server (not `file://`). Always use `npm run dev`.

### Testing State Persistence
1. Run `npm run dev`
2. Set timer and start
3. Refresh page (timer continues)
4. Close tab and reopen (timer resets - sessionStorage cleared)

---

## 📊 Project Statistics

- **Total Lines of Code**: ~2,500
- **Main Component**: 915 lines (Timer.tsx)
- **Utility Functions**: 7 files, ~500 lines
- **Sound Files**: 8 MP3s (beep, chirp, digital, e-chirp, heartbeat, long-pop, pop, war)
- **Dependencies**: 6 production, 6 dev
- **Bundle Size** (gzipped):
  - HTML: ~3 KB
  - CSS: ~15 KB
  - JS: ~45 KB (React + Timer component)
  - Total First Load: ~63 KB

---

## 🐛 Troubleshooting

### Sounds Not Playing
- **Issue**: Browser autoplay policy blocking sounds
- **Solution**: User must interact with page first (click start button)
- **Check**: Open DevTools Console for error messages

### PiP Not Working
- **Issue**: Document PiP API not supported
- **Solution**: Use Chrome/Edge 116+ or disable feature (auto-detects support)

### Timer State Lost
- **Issue**: sessionStorage cleared (browser/tab closed)
- **Expected Behavior**: State persists only during active session
- **Theme/Settings**: Persist in localStorage (permanent)

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Astro cache
rm -rf .astro node_modules/.astro
npm run build
```

---

## 📝 License

MIT License - Free to use, modify, and distribute.

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **Astro**: For amazing static site generation
- **React**: For robust component architecture
- **Tailwind CSS**: For rapid UI development
- **Vercel**: For seamless deployment
- **Sound Files**: Sourced from free sound libraries

---

Built with ❤️ for productivity enthusiasts worldwide
