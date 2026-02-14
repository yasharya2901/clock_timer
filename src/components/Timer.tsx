import { useState, useEffect, useRef } from 'react';
import { updateFavicon } from '../utils/faviconUpdater';
import { formatTime, clampTime } from '../utils/timeUtils';
import { playAlarm, playCountdownBeep } from '../utils/audioUtils';
import { getStorageItem, setStorageItem, isValidStorageValue, getSessionJson, setSessionJson, getTimerSettings, saveTimerSettings, type TimerSettings } from '../utils/storageUtils';
import { updateDocumentTitle } from '../utils/documentUtils';
import { isPipSupported as checkPipSupport, openPipWindow, updatePipTime, updatePipContent } from '../utils/pipUtils';

type Theme = 'green' | 'yellow' | 'blue' | 'purple' | 'red';

const themes = {
  green: { primary: '#22c55e', dark: '#16a34a', name: 'Green' },
  yellow: { primary: '#ffd700', dark: '#ccaa00', name: 'Yellow' },
  blue: { primary: '#3b82f6', dark: '#2563eb', name: 'Blue' },
  purple: { primary: '#a855f7', dark: '#9333ea', name: 'Purple' },
  red: { primary: '#ef4444', dark: '#dc2626', name: 'Red' },
};

export default function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');
  const [focusedField, setFocusedField] = useState<'hours' | 'minutes' | 'seconds'>('minutes');
  const [theme, setTheme] = useState<Theme>('green');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timerOnlyMode, setTimerOnlyMode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(getTimerSettings());
  const [customInput, setCustomInput] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const initialHours = useRef(0);
  const initialMinutes = useRef(15);
  const initialSeconds = useRef(0);

  // Check PiP support on mount
  useEffect(() => {
    setIsPipSupported(checkPipSupport());
  }, []);

  // Load timer state from sessionStorage on mount
  useEffect(() => {
    const savedState = getSessionJson<{
      hours: number;
      minutes: number;
      seconds: number;
      isRunning: boolean;
      isRepeat: boolean;
      initialHours: number;
      initialMinutes: number;
      initialSeconds: number;
    } | null>('timer-state', null);

    if (savedState) {
      setHours(savedState.hours);
      setMinutes(savedState.minutes);
      setSeconds(savedState.seconds);
      setIsRunning(savedState.isRunning);
      setIsRepeat(savedState.isRepeat);
      initialHours.current = savedState.initialHours;
      initialMinutes.current = savedState.initialMinutes;
      initialSeconds.current = savedState.initialSeconds;
    }
  }, []);

  // Save timer state to sessionStorage whenever it changes
  useEffect(() => {
    const timerState = {
      hours,
      minutes,
      seconds,
      isRunning,
      isRepeat,
      initialHours: initialHours.current,
      initialMinutes: initialMinutes.current,
      initialSeconds: initialSeconds.current,
    };
    setSessionJson('timer-state', timerState);
  }, [hours, minutes, seconds, isRunning, isRepeat]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = getStorageItem('timer-theme', 'green');
    if (isValidStorageValue(savedTheme, themes)) {
      setTheme(savedTheme as Theme);
    }
    // Trigger transition from white to theme color after a brief delay
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
  }, []);

  // Update favicon when theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Start with white, then transition to theme color
      if (isInitialLoad) {
        updateFavicon('#ffffff');
      } else {
        const themeColor = themes[theme].primary;
        updateFavicon(themeColor);
      }
    }
  }, [theme, isInitialLoad]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    setStorageItem('timer-theme', theme);
  }, [theme]);

  // Handle ESC key to exit timer-only mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && timerOnlyMode) {
        setTimerOnlyMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerOnlyMode]);

  // Update document title dynamically
  useEffect(() => {
    const formattedTime = formatTime(hours, minutes, seconds);
    updateDocumentTitle(formattedTime, isRunning);
  }, [hours, minutes, seconds, isRunning]);

  // Update PiP window when time changes
  useEffect(() => {
    if (isPipActive && pipWindowRef.current) {
      const formattedTime = formatTime(hours, minutes, seconds);
      updatePipTime(pipWindowRef.current, formattedTime);
    }
  }, [hours, minutes, seconds, isPipActive]);

  // Update PiP window when running state changes
  useEffect(() => {
    if (isPipActive && pipWindowRef.current) {
      const formattedTime = formatTime(hours, minutes, seconds);
      updatePipContent(pipWindowRef.current, formattedTime, isRunning, displayTheme.primary, displayTheme.dark, handleStart);
    }
  }, [isRunning, isPipActive]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => {
          // Calculate total remaining seconds (before decrement)
          const totalSeconds = hours * 3600 + minutes * 60 + prev;
          
          // Play countdown beep if enabled and at threshold
          if (settings.countdownSound !== 'off') {
            const threshold = parseInt(settings.countdownSound);
            if (!isNaN(threshold) && totalSeconds > 0 && totalSeconds <= threshold) {
              playCountdownBeep();
            }
          }
          
          if (prev === 0) {
            setMinutes(prevMin => {
              if (prevMin === 0) {
                setHours(prevHours => {
                  if (prevHours === 0) {
                    // Timer complete
                    playAlarm();
                    if (isRepeat) {
                      // Reset to initial time and keep running
                      setHours(initialHours.current);
                      setMinutes(initialMinutes.current);
                      setSeconds(initialSeconds.current);
                      return initialHours.current;
                    } else {
                      // Stop at 0:0:0
                      setIsRunning(false);
                      return 0;
                    }
                  }
                  return prevHours - 1;
                });
                // If we just completed (prevMin was 0), return appropriate value
                if (hours === 0) {
                  return isRepeat ? initialMinutes.current : 0;
                }
                return 59;
              }
              return prevMin - 1;
            });
            // If we just completed (prev was 0, prevMin was 0), return appropriate value
            if (minutes === 0 && hours === 0) {
              return isRepeat ? initialSeconds.current : 0;
            }
            return 59;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isRepeat, hours, minutes, seconds, settings.countdownSound]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveTimerSettings(settings);
  }, [settings]);

  const handleStart = () => {
    if (!isRunning) {
      // If timer is at 0:0:0, reset to initial values
      if (hours === 0 && minutes === 0 && seconds === 0) {
        setHours(initialHours.current);
        setMinutes(initialMinutes.current);
        setSeconds(initialSeconds.current);
      } else if (hours > 0 || minutes > 0 || seconds > 0) {
        // Save current values as initial if not already set
        initialHours.current = hours;
        initialMinutes.current = minutes;
        initialSeconds.current = seconds;
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHours(initialHours.current);
    setMinutes(initialMinutes.current);
    setSeconds(initialSeconds.current);
  };

  const handleTimeClick = () => {
    if (!isRunning) {
      setIsEditing(true);
      setEditHours(hours > 0 ? String(hours) : '');
      setEditMinutes(String(minutes));
      setEditSeconds(String(seconds));
    }
  };

  const handleEditSubmit = () => {
    const newHours = parseInt(editHours) || 0;
    const newMinutes = parseInt(editMinutes) || 0;
    const newSeconds = parseInt(editSeconds) || 0;
    
    setHours(clampTime(newHours, 0, 99));
    setMinutes(clampTime(newMinutes, 0, 59));
    setSeconds(clampTime(newSeconds, 0, 59));
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleIncrement = () => {
    if (focusedField === 'hours') {
      const current = parseInt(editHours) || 0;
      setEditHours(String(Math.min(current + 1, 99)));
    } else if (focusedField === 'minutes') {
      const current = parseInt(editMinutes) || 0;
      setEditMinutes(String(Math.min(current + 1, 59)));
    } else if (focusedField === 'seconds') {
      const current = parseInt(editSeconds) || 0;
      setEditSeconds(String(Math.min(current + 1, 59)));
    }
  };

  const handleDecrement = () => {
    if (focusedField === 'hours') {
      const current = parseInt(editHours) || 0;
      setEditHours(String(Math.max(current - 1, 0)));
    } else if (focusedField === 'minutes') {
      const current = parseInt(editMinutes) || 0;
      setEditMinutes(String(Math.max(current - 1, 0)));
    } else if (focusedField === 'seconds') {
      const current = parseInt(editSeconds) || 0;
      setEditSeconds(String(Math.max(current - 1, 0)));
    }
  };

  const handleQuickAdd = () => {
    if (!isRunning) {
      const newMinutes = minutes + 5;
      if (newMinutes > 59) {
        const addedHours = Math.floor(newMinutes / 60);
        const remainingMinutes = newMinutes % 60;
        setHours(Math.min(hours + addedHours, 99));
        setMinutes(remainingMinutes);
      } else {
        setMinutes(newMinutes);
      }
    }
  };

  const handleQuickSubtract = () => {
    if (!isRunning) {
      const newMinutes = minutes - 5;
      if (newMinutes < 0) {
        if (hours > 0) {
          setHours(hours - 1);
          setMinutes(60 + newMinutes);
        } else {
          setMinutes(0);
        }
      } else {
        setMinutes(newMinutes);
      }
    }
  };

  const currentTheme = themes[theme];
  const displayTheme = {
    primary: isInitialLoad ? '#f5f1e3' : currentTheme.primary,
    dark: isInitialLoad ? '#d4cfc0' : currentTheme.dark,
    name: currentTheme.name
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const togglePip = async () => {
    if (!isPipSupported) return;

    try {
      if (isPipActive && pipWindowRef.current) {
        // Close PiP
        pipWindowRef.current.close();
        pipWindowRef.current = null;
        setIsPipActive(false);
      } else {
        // Open PiP
        const timeString = formatTime(hours, minutes, seconds);
        const pipWindow = await openPipWindow(timeString, isRunning, displayTheme.primary, displayTheme.dark, handleStart);

        pipWindowRef.current = pipWindow;
        setIsPipActive(true);

        // Handle PiP window close
        pipWindow.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
          setIsPipActive(false);
        });
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const handleCountdownSoundChange = (value: string) => {
    if (value === 'custom') {
      setIsAddingCustom(true);
      setCustomInput('');
    } else {
      setSettings(prev => ({ ...prev, countdownSound: value }));
    }
  };

  const handleCustomSubmit = () => {
    const customValue = parseInt(customInput);
    if (!isNaN(customValue) && customValue > 0) {
      const customStr = String(customValue);
      setSettings(prev => {
        const existingCustomValues = prev.customCountdownValues || [];
        const updatedCustomValues = [...existingCustomValues, customStr]
          .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates
          .slice(-2); // Keep only last 2 custom values
        
        return {
          ...prev,
          countdownSound: customStr,
          customCountdownValues: updatedCustomValues,
        };
      });
      setIsAddingCustom(false);
      setCustomInput('');
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomSubmit();
    } else if (e.key === 'Escape') {
      setIsAddingCustom(false);
      setCustomInput('');
    }
  };

  const getAllCountdownOptions = () => {
    const baseOptions = ['5', '10', '15'];
    const customOptions = settings.customCountdownValues || [];
    
    // Combine base and custom options, convert to numbers for sorting
    const allNumericOptions = [...baseOptions, ...customOptions]
      .map(v => parseInt(v))
      .filter((v, i, arr) => arr.indexOf(v) === i) // Remove duplicates
      .sort((a, b) => a - b) // Sort in ascending order
      .map(v => String(v)); // Convert back to strings
    
    return ['off', ...allNumericOptions, 'custom'];
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-bg-black text-cream overflow-hidden">
      {timerOnlyMode ? (
        // Timer-only mode: Just the timer, click anywhere to exit
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer px-2 md:px-4"
          onClick={() => setTimerOnlyMode(false)}
          title="Click anywhere or press ESC to exit focus mode"
        >
          <div className="flex items-center select-none" style={{ gap: hours > 0 ? 'clamp(0.25rem, 1.5vw, 3rem)' : 'clamp(0.5rem, 2.5vw, 4rem)' }}>
            {hours > 0 && (
              <>
                <div className="flex flex-col items-center">
                  <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: 'clamp(3.5rem, 13vw, 24rem)', textShadow: '0 0 60px rgba(245, 241, 227, 0.4)' }}>
                    {String(hours).padStart(2, '0')}
                  </div>
                </div>
                <div className="font-jet font-bold leading-[0.9] text-cream" style={{ fontSize: 'clamp(3.5rem, 13vw, 24rem)' }}>
                  :
                </div>
              </>
            )}
            <div className="flex flex-col items-center">
              <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: hours > 0 ? 'clamp(3.5rem, 13vw, 24rem)' : 'clamp(4.5rem, 16vw, 30rem)', textShadow: '0 0 60px rgba(245, 241, 227, 0.4)' }}>
                {String(minutes).padStart(2, '0')}
              </div>
            </div>
            <div className="font-jet font-bold leading-[0.9] text-cream" style={{ fontSize: hours > 0 ? 'clamp(3.5rem, 13vw, 24rem)' : 'clamp(4.5rem, 16vw, 30rem)' }}>
              :
            </div>
            <div className="flex flex-col items-center">
              <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: hours > 0 ? 'clamp(3.5rem, 13vw, 24rem)' : 'clamp(4.5rem, 16vw, 30rem)', textShadow: '0 0 60px rgba(245, 241, 227, 0.4)' }}>
                {String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal mode with navigation and controls
        <>
      <nav className="flex flex-col md:flex-row justify-center md:justify-between items-center px-4 md:px-8 py-4 md:py-6 relative z-10 gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 bg-transparent border-none font-mono text-sm md:text-base cursor-pointer transition-colors duration-200 hover:opacity-80"
              style={{ color: displayTheme.primary, transition: 'color 1s ease-in-out' }}
            >
              <span className="text-base md:text-lg">◉</span> Theme: {displayTheme.name}
            </button>
            {showThemeMenu && (
              <div className="absolute top-full left-0 mt-2 bg-gray-900 rounded-lg shadow-lg p-2 z-50 min-w-[150px]">
                {(Object.keys(themes) as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      setShowThemeMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition-colors duration-200 font-mono text-sm"
                    style={{ color: themes[t].primary }}
                  >
                    {themes[t].name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-6">
          <label className="flex items-center gap-2 md:gap-3 cursor-pointer text-sm md:text-base text-cream">
            <span>Repeat</span>
            <input
              type="checkbox"
              checked={isRepeat}
              onChange={(e) => setIsRepeat(e.target.checked)}
              className="hidden"
            />
            <span className={`relative w-[50px] h-[26px] rounded-[26px] transition-colors duration-300`} style={{ backgroundColor: isRepeat ? displayTheme.primary : '#1f2937', transition: 'background-color 1s ease-in-out' }}>
              <span className={`absolute w-5 h-5 rounded-full bg-cream top-[3px] left-[3px] transition-transform duration-300 ${isRepeat ? 'translate-x-6' : ''}`}></span>
            </span>
          </label>
          
          {isPipSupported && (
            <button 
              onClick={togglePip}
              className="flex items-center gap-2 bg-transparent border-none text-cream font-mono text-sm md:text-base cursor-pointer transition-colors duration-200"
              style={{ transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = displayTheme.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = '#f5f1e3'}
            >
              <span className="text-base md:text-lg">▢</span> {isPipActive ? 'Close PiP' : 'Picture in Picture'}
            </button>
          )}
          
          <button 
            onClick={() => setTimerOnlyMode(true)}
            className="flex items-center gap-2 bg-transparent border-none text-cream font-mono text-sm md:text-base cursor-pointer transition-colors duration-200"
            style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = displayTheme.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = '#f5f1e3'}
          >
            <span className="text-base md:text-lg">◯</span> Focus
          </button>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 bg-transparent border-none text-cream font-mono text-sm md:text-base cursor-pointer transition-colors duration-200"
            style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = displayTheme.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = '#f5f1e3'}
          >
            <span className="text-base md:text-lg">⚙</span> Settings
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="flex items-center gap-2 bg-transparent border-none text-cream font-mono text-sm md:text-base cursor-pointer transition-colors duration-200"
            style={{ transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = displayTheme.primary}
            onMouseLeave={(e) => e.currentTarget.style.color = '#f5f1e3'}
          >
            <span className="text-lg md:text-xl">⛶</span> Fullscreen
          </button>
        </div>
      </nav>

      {/* Main Timer Container */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-8 lg:gap-16 px-2 md:px-4 lg:px-8 py-2 md:py-4 lg:py-8">
        {/* Timer Display */}
        {!isEditing ? (
          <div className="flex items-center gap-4 md:gap-12 lg:gap-20">
            <div 
              className="flex items-center select-none cursor-pointer"
              style={{ gap: hours > 0 ? 'clamp(0.25rem, 1.5vw, 4rem)' : 'clamp(0.5rem, 2.5vw, 5rem)' }}
              onClick={handleTimeClick}
              title={!isRunning ? "Click to edit time" : ""}
            >
            {hours > 0 && (
              <>
                <div className="flex flex-col items-center">
                  <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: hours > 0 ? 'clamp(3rem, 10vw, 20rem)' : 'clamp(5rem, 12vw, 20rem)', textShadow: '0 0 40px rgba(245, 241, 227, 0.3)' }}>
                    {String(hours).padStart(2, '0')}
                  </div>
                  <div className="font-mono text-xs md:text-sm lg:text-base xl:text-xl text-cream mt-0.5 md:mt-1 lg:mt-2 capitalize">
                    Hours
                  </div>
                </div>
                <div className="font-jet font-bold leading-[0.9] text-cream mb-4 md:mb-8 lg:mb-12" style={{ fontSize: 'clamp(3rem, 10vw, 20rem)' }}>
                  :
                </div>
              </>
            )}
            <div className="flex flex-col items-center">
              <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: hours > 0 ? 'clamp(3rem, 10vw, 20rem)' : 'clamp(4rem, 12vw, 24rem)', textShadow: '0 0 40px rgba(245, 241, 227, 0.3)' }}>
                {String(minutes).padStart(2, '0')}
              </div>
              <div className="font-mono text-xs md:text-sm lg:text-base xl:text-xl text-cream mt-0.5 md:mt-1 lg:mt-2 capitalize">
                Minutes
              </div>
            </div>
            
            <div className="font-jet font-bold leading-[0.9] text-cream mb-4 md:mb-8 lg:mb-12" style={{ fontSize: hours > 0 ? 'clamp(3rem, 10vw, 20rem)' : 'clamp(4rem, 12vw, 24rem)' }}>
              :
            </div>
            
            <div className="flex flex-col items-center">
              <div className="font-jet font-bold leading-[0.9] text-cream tracking-tighter" style={{ fontSize: hours > 0 ? 'clamp(3rem, 10vw, 20rem)' : 'clamp(4rem, 12vw, 24rem)', textShadow: '0 0 40px rgba(245, 241, 227, 0.3)' }}>
                {String(seconds).padStart(2, '0')}
              </div>
              <div className="font-mono text-xs md:text-sm lg:text-base xl:text-xl text-cream mt-0.5 md:mt-1 lg:mt-2 capitalize">
                Seconds
              </div>
            </div>
          </div>
          {/* Quick adjustment buttons */}
          {!isRunning && (
            <div className="flex flex-col gap-3 md:gap-4">
              <button
                onClick={handleQuickAdd}
                className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] lg:w-[56px] lg:h-[56px] rounded-full border-2 bg-transparent text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] font-bold cursor-pointer flex items-center justify-center transition-all duration-300 leading-none"
                style={{ 
                  borderColor: displayTheme.primary,
                  color: displayTheme.primary,
                  transition: 'color 0.3s, background-color 0.3s, border-color 1s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = displayTheme.primary;
                  e.currentTarget.style.color = '#0a0a0a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = displayTheme.primary;
                }}
                title="Add 5 minutes"
              >
                +
              </button>
              <button
                onClick={handleQuickSubtract}
                className="w-[40px] h-[40px] md:w-[48px] md:h-[48px] lg:w-[56px] lg:h-[56px] rounded-full border-2 bg-transparent text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] font-bold cursor-pointer flex items-center justify-center transition-all duration-300 leading-none"
                style={{ 
                  borderColor: displayTheme.primary,
                  color: displayTheme.primary,
                  transition: 'color 0.3s, background-color 0.3s, border-color 1s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = displayTheme.primary;
                  e.currentTarget.style.color = '#0a0a0a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = displayTheme.primary;
                }}
                title="Subtract 5 minutes"
              >
                −
              </button>
            </div>
          )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 order-1 md:order-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  onFocus={() => setFocusedField('hours')}
                  placeholder="HH"
                  min="0"
                  max="99"
                  className="w-[80px] md:w-[120px] bg-gray-800 text-cream text-center font-jet text-3xl md:text-5xl font-bold rounded-lg px-2 py-3 border-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ borderColor: focusedField === 'hours' ? displayTheme.primary : '#374151', transition: 'border-color 1s ease-in-out' }}
                />
                <div className="font-mono text-xs md:text-sm text-cream mt-1">Hours</div>
              </div>
              <div className="text-cream text-3xl md:text-5xl font-bold">:</div>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                  onFocus={() => setFocusedField('minutes')}
                  placeholder="MM"
                  min="0"
                  max="59"
                  className="w-[80px] md:w-[120px] bg-gray-800 text-cream text-center font-jet text-3xl md:text-5xl font-bold rounded-lg px-2 py-3 border-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ borderColor: focusedField === 'minutes' ? displayTheme.primary : '#374151', transition: 'border-color 1s ease-in-out' }}
                />
                <div className="font-mono text-xs md:text-sm text-cream mt-1">Minutes</div>
              </div>
              <div className="text-cream text-3xl md:text-5xl font-bold">:</div>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={editSeconds}
                  onChange={(e) => setEditSeconds(e.target.value)}
                  onFocus={() => setFocusedField('seconds')}
                  placeholder="SS"
                  min="0"
                  max="59"
                  className="w-[80px] md:w-[120px] bg-gray-800 text-cream text-center font-jet text-3xl md:text-5xl font-bold rounded-lg px-2 py-3 border-2 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ borderColor: focusedField === 'seconds' ? displayTheme.primary : '#374151', transition: 'border-color 1s ease-in-out' }}
                />
                <div className="font-mono text-xs md:text-sm text-cream mt-1">Seconds</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDecrement}
                className="w-[60px] h-[60px] rounded-full border-none text-[2.5rem] font-bold text-bg-black cursor-pointer flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 leading-none"
                style={{ 
                  backgroundColor: displayTheme.primary,
                  boxShadow: `0 4px 0 ${displayTheme.dark}`,
                  transition: 'background-color 1s ease-in-out, box-shadow 1s ease-in-out'
                }}
              >
                −
              </button>
              <button
                onClick={handleIncrement}
                className="w-[60px] h-[60px] rounded-full border-none text-[2.5rem] font-bold text-bg-black cursor-pointer flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0.5 leading-none"
                style={{ 
                  backgroundColor: displayTheme.primary,
                  boxShadow: `0 4px 0 ${displayTheme.dark}`,
                  transition: 'background-color 1s ease-in-out, box-shadow 1s ease-in-out'
                }}
              >
                +
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEditSubmit}
                className="px-6 py-2 rounded-lg font-mono font-bold text-bg-black"
                style={{ backgroundColor: displayTheme.primary, transition: 'background-color 1s ease-in-out' }}
              >
                Save
              </button>
              <button
                onClick={handleEditCancel}
                className="px-6 py-2 rounded-lg font-mono font-bold bg-gray-700 text-cream hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Controls - below timer */}
        {!isEditing && (
          <div className="flex flex-row gap-3 md:gap-4 lg:gap-6 items-center">
            <button 
              onClick={handleStart}
              className="border-none rounded-[50px] px-6 md:px-8 lg:px-10 py-2 md:py-3 lg:py-4 font-mono text-sm md:text-base lg:text-lg font-bold text-bg-black transition-all duration-200 relative"
              style={{ 
                backgroundColor: displayTheme.primary,
                boxShadow: `0 4px 0 ${displayTheme.dark}`,
                cursor: 'pointer',
                transition: 'background-color 1s ease-in-out, box-shadow 1s ease-in-out'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
            <button 
              onClick={handleReset}
              className="border-none rounded-[50px] px-6 md:px-8 lg:px-10 py-2 md:py-3 lg:py-4 font-mono text-sm md:text-base lg:text-lg font-bold text-bg-black transition-all duration-200 relative"
              style={{ 
                backgroundColor: displayTheme.primary,
                boxShadow: `0 4px 0 ${displayTheme.dark}`,
                cursor: 'pointer',
                transition: 'background-color 1s ease-in-out, box-shadow 1s ease-in-out'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Reset
            </button>
          </div>
        )}
      </div>
        </>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 md:mx-0 md:w-1/3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-mono font-bold text-cream">Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-cream text-2xl bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Countdown Sound Setting */}
              <div>
                <label className="block text-cream font-mono text-sm mb-2">
                  Allow Countdown Sound
                </label>
                <p className="text-gray-400 text-xs mb-3">
                  Beep every second when timer reaches the selected threshold
                </p>
                {!isAddingCustom ? (
                  <select
                    value={settings.countdownSound}
                    onChange={(e) => handleCountdownSoundChange(e.target.value)}
                    className="w-full bg-gray-800 text-cream px-4 py-3 rounded-lg border-2 focus:outline-none font-mono cursor-pointer"
                    style={{ 
                      borderColor: displayTheme.primary,
                      transition: 'border-color 1s ease-in-out'
                    }}
                  >
                    {getAllCountdownOptions().map((option) => (
                      <option key={option} value={option}>
                        {option === 'off' ? 'Off' : option === 'custom' ? 'Custom...' : `${option} seconds`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      onKeyDown={handleCustomKeyDown}
                      placeholder="Enter seconds"
                      min="1"
                      autoFocus
                      className="flex-1 bg-gray-800 text-cream px-4 py-3 rounded-lg border-2 focus:outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ 
                        borderColor: displayTheme.primary,
                        transition: 'border-color 1s ease-in-out'
                      }}
                    />
                    <button
                      onClick={handleCustomSubmit}
                      className="px-4 py-3 rounded-lg font-mono font-bold text-bg-black hover:opacity-80 transition-opacity"
                      style={{ 
                        backgroundColor: displayTheme.primary,
                        transition: 'background-color 1s ease-in-out'
                      }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomInput('');
                      }}
                      className="px-4 py-3 rounded-lg font-mono font-bold bg-gray-700 text-cream hover:bg-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* Future settings will be added here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
