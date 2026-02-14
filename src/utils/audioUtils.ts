// Audio utilities for timer sounds
import { getSound } from './soundManager';

/**
 * Plays a synthesized sound using Web Audio API (fallback)
 * @param frequency - Frequency of the tone in Hz
 * @param duration - Duration of the beep in seconds
 * @param volume - Volume of the beep (0-1)
 */
function playSynthesizedSound(frequency: number, duration: number, volume: number): void {
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
    console.error('Error playing synthesized sound:', error);
  }
}

/**
 * Plays an audio file with specified volume
 * @param soundId - The ID of the sound to play
 * @param volume - Volume level (0-1)
 * @returns True if audio file played, false if fallback needed
 */
function playAudioFile(soundId: string, volume: number): boolean {
  try {
    const audio = getSound(soundId);
    if (!audio) return false;
    
    audio.volume = volume;
    audio.play().catch(error => {
      console.warn('Failed to play audio file:', error);
    });
    
    return true;
  } catch (error) {
    console.warn('Error playing audio file:', error);
    return false;
  }
}

/**
 * Plays an alarm sound when timer completes
 * Uses full volume for audio files or synthesized tone
 * @param soundId - The ID of the sound to play (defaults to synthesized)
 */
export function playAlarm(soundId: string = 'default'): void {
  // Try to play audio file at full volume
  if (soundId !== 'default' && playAudioFile(soundId, 1.0)) {
    return;
  }
  
  // Fallback to synthesized sound
  playSynthesizedSound(800, 0.3, 0.3);
}

/**
 * Plays a lighter countdown beep sound
 * Uses half volume for audio files or softer synthesized tone
 * @param soundId - The ID of the sound to play (defaults to synthesized)
 */
export function playCountdownBeep(soundId: string = 'default'): void {
  // Try to play audio file at half volume
  if (soundId !== 'default' && playAudioFile(soundId, 0.5)) {
    return;
  }
  
  // Fallback to synthesized sound
  playSynthesizedSound(600, 0.15, 0.15);
}
