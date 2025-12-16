/**
 * Event Type Constants
 */

export const EVENT_TYPES = {
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',
} as const;

export const SPECIAL_KEYS = {
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  ENTER: 'Enter',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  SPACE: 'Space',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  SHIFT: 'Shift',
  CONTROL: 'Control',
  ALT: 'Alt',
  META: 'Meta',
  CAPS_LOCK: 'CapsLock',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export const MODIFIER_KEYS = {
  SHIFT: 'shift',
  CONTROL: 'ctrl',
  ALT: 'alt',
  META: 'meta',
} as const;

export const FUNCTIONAL_KEYS = [
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
  'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
] as const;

export const NAVIGATION_KEYS = [
  SPECIAL_KEYS.ARROW_UP,
  SPECIAL_KEYS.ARROW_DOWN,
  SPECIAL_KEYS.ARROW_LEFT,
  SPECIAL_KEYS.ARROW_RIGHT,
  SPECIAL_KEYS.HOME,
  SPECIAL_KEYS.END,
  SPECIAL_KEYS.PAGE_UP,
  SPECIAL_KEYS.PAGE_DOWN,
] as const;

export const EDITING_KEYS = [
  SPECIAL_KEYS.BACKSPACE,
  SPECIAL_KEYS.DELETE,
  SPECIAL_KEYS.ENTER,
  SPECIAL_KEYS.TAB,
] as const;

export const IGNORED_KEYS = [
  SPECIAL_KEYS.SHIFT,
  SPECIAL_KEYS.CONTROL,
  SPECIAL_KEYS.ALT,
  SPECIAL_KEYS.META,
  SPECIAL_KEYS.CAPS_LOCK,
  SPECIAL_KEYS.ESCAPE,
  ...FUNCTIONAL_KEYS,
] as const;

export const SESSION_EVENTS = {
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  SESSION_PAUSE: 'session_pause',
  SESSION_RESUME: 'session_resume',
  SESSION_IDLE: 'session_idle',
  SESSION_ACTIVE: 'session_active',
} as const;

export const ANALYTICS_EVENTS = {
  BEHAVIOR_CHANGE: 'behavior_change',
  INTERVENTION_TRIGGERED: 'intervention_triggered',
  INTERVENTION_DISMISSED: 'intervention_dismissed',
  INTERVENTION_ACCEPTED: 'intervention_accepted',
  THRESHOLD_EXCEEDED: 'threshold_exceeded',
  ANOMALY_DETECTED: 'anomaly_detected',
} as const;

export const SYSTEM_EVENTS = {
  MODEL_LOADED: 'model_loaded',
  MODEL_UPDATED: 'model_updated',
  MODEL_ERROR: 'model_error',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
  DATABASE_CONNECTED: 'database_connected',
  DATABASE_ERROR: 'database_error',
  API_ERROR: 'api_error',
  HEALTH_CHECK: 'health_check',
} as const;

export const AUTH_EVENTS = {
  ENROLLMENT_STARTED: 'enrollment_started',
  ENROLLMENT_COMPLETED: 'enrollment_completed',
  ENROLLMENT_FAILED: 'enrollment_failed',
  AUTH_ATTEMPT: 'auth_attempt',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_EXPIRED: 'profile_expired',
} as const;

export const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  DATABASE_ERROR: 'database_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  INFERENCE_ERROR: 'inference_error',
  CONFIGURATION_ERROR: 'configuration_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;
