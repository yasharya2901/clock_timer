// Sound manager for loading and caching audio files

export interface SoundOption {
  id: string;
  displayName: string;
  filePath?: string;
}

// Available sound options
export const SOUND_OPTIONS: SoundOption[] = [
  { id: 'default', displayName: 'Default' },
  { id: 'beep', displayName: 'Beep', filePath: '/sounds/beep.mp3' },
  { id: 'chirp', displayName: 'Chirp', filePath: '/sounds/chirp.mp3' },
  { id: 'digital', displayName: 'Digital', filePath: '/sounds/digital.mp3' },
  { id: 'e-chirp', displayName: 'E-Chirp', filePath: '/sounds/e-chirp.mp3' },
  { id: 'heartbeat', displayName: 'Heartbeat', filePath: '/sounds/heartbeat.mp3' },
  { id: 'long-pop', displayName: 'Long Pop', filePath: '/sounds/long pop.mp3' },
  { id: 'pop', displayName: 'Pop', filePath: '/sounds/pop.mp3' },
  { id: 'war', displayName: 'War', filePath: '/sounds/war.mp3' },
];

const CACHE_NAME = 'timer-sounds-v1';
const audioCache: Map<string, HTMLAudioElement> = new Map();
let isInitialized = false;

/**
 * Initialize sound manager by loading and caching all audio files
 */
export async function initializeSounds(): Promise<void> {
  if (isInitialized) return;

  try {
    // Get cache storage
    const cache = await caches.open(CACHE_NAME);

    // Load each sound file
    const loadPromises = SOUND_OPTIONS.map(async (sound) => {
      if (!sound.filePath) return; // Skip "default" which has no file

      try {
        // Check if file is in cache
        let response = await cache.match(sound.filePath);
        
        if (!response) {
          // Not in cache, fetch and cache it
          response = await fetch(sound.filePath);
          if (response.ok) {
            await cache.put(sound.filePath, response.clone());
          }
        }

        // Create Audio element from cached response
        if (response && response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'auto';
          audioCache.set(sound.id, audio);
        }
      } catch (error) {
        console.warn(`Failed to load sound: ${sound.displayName}`, error);
      }
    });

    await Promise.all(loadPromises);
    isInitialized = true;
    console.log('Sound manager initialized');
  } catch (error) {
    console.error('Failed to initialize sound manager:', error);
  }
}

/**
 * Get an audio element for playing
 * @param soundId - The ID of the sound to play
 * @returns Audio element or null if not found
 */
export function getSound(soundId: string): HTMLAudioElement | null {
  if (soundId === 'default' || !audioCache.has(soundId)) {
    return null; // Return null for default or missing sounds (will use fallback)
  }
  
  // Clone the audio element to allow multiple simultaneous plays
  const cachedAudio = audioCache.get(soundId);
  if (!cachedAudio) return null;
  
  const audio = cachedAudio.cloneNode(true) as HTMLAudioElement;
  return audio;
}

/**
 * Check if a sound ID is valid
 * @param soundId - The ID to check
 * @returns True if the sound exists
 */
export function isValidSound(soundId: string): boolean {
  return SOUND_OPTIONS.some(sound => sound.id === soundId);
}

/**
 * Get display name for a sound ID
 * @param soundId - The ID of the sound
 * @returns Display name or "Default"
 */
export function getSoundDisplayName(soundId: string): string {
  const sound = SOUND_OPTIONS.find(s => s.id === soundId);
  return sound?.displayName || 'Default';
}
