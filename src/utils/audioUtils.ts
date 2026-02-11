// Audio utilities for timer sounds

/**
 * Plays an alarm sound using Web Audio API
 * @param frequency - Frequency of the tone in Hz (default: 800)
 * @param duration - Duration of the beep in seconds (default: 0.3)
 * @param volume - Volume of the beep (0-1, default: 0.3)
 */
export function playAlarm(frequency: number = 800, duration: number = 0.3, volume: number = 0.3): void {
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
    console.error('Error playing alarm:', error);
  }
}
