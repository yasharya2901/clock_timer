// Audio utilities for timer sounds

/**
 * Plays a sound using Web Audio API
 * @param frequency - Frequency of the tone in Hz
 * @param duration - Duration of the beep in seconds
 * @param volume - Volume of the beep (0-1)
 */
function playSound(frequency: number, duration: number, volume: number): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Plays an alarm sound when timer completes
 * Uses a prominent tone to signal completion
 */
export function playAlarm(): void {
  playSound(800, 0.3, 0.3);
}

/**
 * Plays a lighter countdown beep sound
 * Uses a softer tone to distinguish from final alarm
 */
export function playCountdownBeep(): void {
  playSound(600, 0.15, 0.15);
}
