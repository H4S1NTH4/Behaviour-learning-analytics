/**
 * Local types for the keystroke capture module
 */

/**
 * Core event data structure matching the SRS specification
 */
export interface KeystrokeEvent {
  session_id: string;
  user_id: string;
  event_type: 'keyDown' | 'keyUp';
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

/**
 * Configuration options for the capture module
 */
export interface CaptureConfig {
  apiEndpoint: string;
  batchSizeLimit: number;
  batchTimeLimit: number; // milliseconds
  enableConsent: boolean;
  userId: string;
  assignmentId?: string;
  debug?: boolean;
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  userId: string;
  isCapturing: boolean;
  consentGranted: boolean;
  bufferSize: number;
  failedBatches: number;
}

/**
 * Batch payload structure
 */
export interface BatchPayload {
  session_id: string;
  user_id: string;
  assignment_id?: string;
  events: KeystrokeEvent[];
  metadata: {
    batch_size: number;
    client_timestamp: number;
    browser?: object;
    session_end?: boolean;
  };
}

/**
 * Consent status
 */
export interface ConsentStatus {
  granted: boolean;
  timestamp?: string;
}

/**
 * Browser information
 */
export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
}
