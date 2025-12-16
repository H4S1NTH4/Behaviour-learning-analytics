/**
 * Keystroke Event Types and Interfaces
 */

export interface KeystrokeEvent {
  session_id: string;
  user_id: string;
  event_type: 'keydown' | 'keyup';
  timestamp_ms: number;
  key_code: string;
  key_value: string;
  cursor_offset: number;
  modifier_state: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

export interface KeystrokeFeatures {
  // Timing features
  hold_time: number;
  flight_time: number;
  dwell_time: number;

  // Statistical features
  avg_hold_time: number;
  std_hold_time: number;
  avg_flight_time: number;
  std_flight_time: number;

  // Rhythm features
  typing_speed: number; // characters per minute
  pause_count: number;
  avg_pause_duration: number;

  // Error features
  backspace_count: number;
  correction_rate: number;

  // Pressure features (if available)
  key_pressure?: number;

  // Sequence features
  bigram_frequency: Record<string, number>;
  trigram_frequency: Record<string, number>;

  // Session context
  session_duration: number;
  total_keystrokes: number;
  timestamp: number;
}

export interface CaptureConfig {
  apiEndpoint: string;
  batchSizeLimit: number;
  batchTimeLimit: number; // milliseconds
  enableConsent: boolean;
  userId: string;
  assignmentId: string;
  debug: boolean;
}

export interface BatchPayload {
  session_id: string;
  user_id: string;
  assignment_id: string;
  events: KeystrokeEvent[];
  metadata: {
    batch_number: number;
    batch_size: number;
    start_timestamp: number;
    end_timestamp: number;
    user_agent: string;
    screen_resolution: string;
    timezone: string;
  };
}

export interface KeystrokePair {
  keydown: KeystrokeEvent;
  keyup?: KeystrokeEvent;
}

export interface KeystrokeSequence {
  events: KeystrokeEvent[];
  features: Partial<KeystrokeFeatures>;
  window_start: number;
  window_end: number;
}
