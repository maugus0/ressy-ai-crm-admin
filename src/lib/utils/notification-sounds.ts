/**
 * Notification Sounds Utility
 * Plays different sounds for different event types using Web Audio API
 */

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context
 * AudioContext must be created after user interaction due to browser policies
 */
const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    return audioContext;
  } catch (error) {
    console.warn("Web Audio API not supported:", error);
    return null;
  }
};

/**
 * Play a tone with given frequency and type
 */
const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
): void => {
  const context = getAudioContext();
  if (!context) return;

  // Resume context if suspended (browser autoplay policy)
  if (context.state === "suspended") {
    context.resume();
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);

  // Fade in
  gainNode.gain.setValueAtTime(0, context.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);

  // Fade out
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration);
};

/**
 * Play a sequence of tones
 */
const playSequence = (
  notes: Array<{ frequency: number; duration: number; delay: number }>,
  type: OscillatorType = "sine",
  volume: number = 0.3
): void => {
  notes.forEach(({ frequency, duration, delay }) => {
    setTimeout(() => {
      playTone(frequency, duration, type, volume);
    }, delay * 1000);
  });
};

// ============================================================================
// Sound Effects for Different Event Types
// ============================================================================

/**
 * Order notification sound - Longer ringing chime (ascending pattern with repeats)
 * Clear, attention-grabbing pattern for new orders
 */
export const playOrderSound = (): void => {
  playSequence(
    [
      // First ring
      { frequency: 523.25, duration: 0.25, delay: 0 }, // C5
      { frequency: 659.25, duration: 0.25, delay: 0.2 }, // E5
      { frequency: 783.99, duration: 0.35, delay: 0.4 }, // G5
      // Second ring (repeat pattern)
      { frequency: 523.25, duration: 0.25, delay: 0.9 }, // C5
      { frequency: 659.25, duration: 0.25, delay: 1.1 }, // E5
      { frequency: 783.99, duration: 0.35, delay: 1.3 }, // G5
      // Final sustain
      { frequency: 1046.5, duration: 0.5, delay: 1.7 }, // C6 (octave higher)
    ],
    "sine",
    0.7
  );
};

/**
 * Reservation notification sound - Extended bell tone with echo
 * Professional, clear tone for bookings that rings twice
 */
export const playReservationSound = (): void => {
  playSequence(
    [
      // First bell
      { frequency: 440, duration: 0.3, delay: 0 }, // A4
      { frequency: 554.37, duration: 0.4, delay: 0.25 }, // C#5
      { frequency: 659.25, duration: 0.35, delay: 0.6 }, // E5
      // Second bell (repeat)
      { frequency: 440, duration: 0.3, delay: 1.1 }, // A4
      { frequency: 554.37, duration: 0.4, delay: 1.35 }, // C#5
      { frequency: 659.25, duration: 0.5, delay: 1.7 }, // E5 (longer sustain)
    ],
    "triangle",
    0.7
  );
};

/**
 * Escalation notification sound - Urgent alert with triple ring
 * Highly attention-grabbing alarm pattern for urgent issues
 */
export const playEscalationSound = (): void => {
  playSequence(
    [
      // First alarm burst
      { frequency: 880, duration: 0.2, delay: 0 }, // A5
      { frequency: 880, duration: 0.2, delay: 0.25 }, // A5
      { frequency: 698.46, duration: 0.2, delay: 0.5 }, // F5
      // Second alarm burst
      { frequency: 880, duration: 0.2, delay: 0.85 }, // A5
      { frequency: 880, duration: 0.2, delay: 1.1 }, // A5
      { frequency: 698.46, duration: 0.2, delay: 1.35 }, // F5
      // Third alarm burst (final)
      { frequency: 880, duration: 0.2, delay: 1.7 }, // A5
      { frequency: 880, duration: 0.2, delay: 1.95 }, // A5
      { frequency: 523.25, duration: 0.5, delay: 2.2 }, // C5 (resolution)
    ],
    "square",
    0.6
  );
};

/**
 * Generic notification sound - Simple ping
 */
export const playGenericSound = (): void => {
  playTone(587.33, 0.2, "sine", 0.6); // D5
};

// ============================================================================
// Sound Preferences
// ============================================================================

const SOUND_ENABLED_KEY = "notification_sounds_enabled";

/**
 * Check if notification sounds are enabled
 */
export const areSoundsEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    // Default to enabled if not set
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
};

/**
 * Enable or disable notification sounds
 * When disabled, stops all active sound loops
 */
export const setSoundsEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
    // Stop all active sound loops when sounds are disabled
    if (!enabled) {
      stopAllLoopingSounds();
    }
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Toggle notification sounds on/off
 */
export const toggleSounds = (): boolean => {
  const newState = !areSoundsEnabled();
  setSoundsEnabled(newState);
  return newState;
};

// ============================================================================
// Main Notification Sound Function
// ============================================================================

export type NotificationEventType = "order" | "reservation" | "escalation" | "generic";

/**
 * Play the appropriate sound for an event type
 * Respects user's sound preferences
 */
export const playNotificationSound = (eventType: NotificationEventType): void => {
  if (!areSoundsEnabled()) return;

  switch (eventType) {
    case "order":
      playOrderSound();
      break;
    case "reservation":
      playReservationSound();
      break;
    case "escalation":
      playEscalationSound();
      break;
    default:
      playGenericSound();
      break;
  }
};

// ============================================================================
// Looping Sound for Persistent Notifications
// ============================================================================

const activeSoundLoops = new Map<string, number>();

/**
 * Get the sound player function for an event type
 */
const getSoundPlayer = (eventType: NotificationEventType): (() => void) => {
  switch (eventType) {
    case "order":
      return playOrderSound;
    case "reservation":
      return playReservationSound;
    case "escalation":
      return playEscalationSound;
    default:
      return playGenericSound;
  }
};

/**
 * Get the loop interval (ms) for an event type
 */
const getSoundInterval = (eventType: NotificationEventType): number => {
  switch (eventType) {
    case "escalation":
      return 3000;
    case "order":
      return 2500;
    case "reservation":
      return 2500;
    default:
      return 2000;
  }
};

/**
 * Start looping a notification sound until stopped
 * Used for persistent toasts that require user attention
 */
export const startLoopingSound = (id: string, eventType: NotificationEventType): void => {
  if (!areSoundsEnabled()) return;
  if (activeSoundLoops.has(id)) return;

  const soundPlayer = getSoundPlayer(eventType);
  const interval = getSoundInterval(eventType);

  // Play immediately
  soundPlayer();

  // Set up loop
  const intervalId = window.setInterval(() => {
    if (!areSoundsEnabled()) {
      clearInterval(intervalId);
      activeSoundLoops.delete(id);
      return;
    }
    soundPlayer();
  }, interval);

  activeSoundLoops.set(id, intervalId);
};

/**
 * Stop a specific looping sound by ID
 */
export const stopLoopingSound = (id: string): void => {
  const intervalId = activeSoundLoops.get(id);
  if (intervalId !== undefined) {
    clearInterval(intervalId);
    activeSoundLoops.delete(id);
  }
};

/**
 * Stop all active looping sounds
 * Called on cleanup/unmount
 */
export const stopAllLoopingSounds = (): void => {
  activeSoundLoops.forEach((intervalId) => clearInterval(intervalId));
  activeSoundLoops.clear();
};

/**
 * Initialize audio context on first user interaction
 * Call this on any user interaction to enable sounds
 */
export const initializeAudio = (): void => {
  getAudioContext();
};
