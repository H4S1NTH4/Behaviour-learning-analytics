/**
 * Common Validation Utilities
 */

import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import { SPECIAL_KEYS, IGNORED_KEYS } from '../constants/events';
import { KeystrokeEvent } from '../types/keystroke';

/**
 * Validate if a string is a valid UUID
 */
export const isValidUuid = (value: string): boolean => {
  return validateUuid(value);
};

/**
 * Generate a new UUID v4
 */
export const generateUuid = (): string => {
  return uuidv4();
};

/**
 * Validate if a timestamp is within a reasonable range
 */
export const isValidTimestamp = (timestamp: number): boolean => {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  const oneHourFuture = now + 60 * 60 * 1000;

  return timestamp >= oneYearAgo && timestamp <= oneHourFuture;
};

/**
 * Validate if a value is within a range [0, 1]
 */
export const isNormalizedValue = (value: number): boolean => {
  return value >= 0 && value <= 1;
};

/**
 * Validate if a key should be tracked
 */
export const isTrackableKey = (keyCode: string): boolean => {
  return !IGNORED_KEYS.includes(keyCode as any);
};

/**
 * Check if a key is a special key
 */
export const isSpecialKey = (keyCode: string): boolean => {
  return Object.values(SPECIAL_KEYS).includes(keyCode as any);
};

/**
 * Check if a key is a printable character
 */
export const isPrintableKey = (keyCode: string): boolean => {
  return keyCode.length === 1 || keyCode === SPECIAL_KEYS.SPACE;
};

/**
 * Validate keystroke event ordering
 */
export const isValidEventSequence = (events: KeystrokeEvent[]): boolean => {
  if (events.length === 0) return true;

  // Check if timestamps are in ascending order
  for (let i = 1; i < events.length; i++) {
    if (events[i].timestamp_ms < events[i - 1].timestamp_ms) {
      return false;
    }
  }

  return true;
};

/**
 * Validate if keydown and keyup events are properly paired
 */
export const validateKeystrokePairs = (events: KeystrokeEvent[]): {
  valid: boolean;
  unpaired: KeystrokeEvent[];
} => {
  const keydownMap = new Map<string, KeystrokeEvent>();
  const unpaired: KeystrokeEvent[] = [];

  for (const event of events) {
    const key = `${event.key_code}_${event.cursor_offset}`;

    if (event.event_type === 'keydown') {
      keydownMap.set(key, event);
    } else if (event.event_type === 'keyup') {
      if (keydownMap.has(key)) {
        keydownMap.delete(key);
      } else {
        unpaired.push(event);
      }
    }
  }

  // Add remaining keydown events without keyup
  unpaired.push(...Array.from(keydownMap.values()));

  return {
    valid: unpaired.length === 0,
    unpaired,
  };
};

/**
 * Sanitize user input string
 */
export const sanitizeString = (input: string, maxLength: number = 255): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate confidence score (0-1 range)
 */
export const isValidConfidence = (confidence: number): boolean => {
  return isNormalizedValue(confidence);
};

/**
 * Validate array has minimum length
 */
export const hasMinimumLength = <T>(array: T[], minLength: number): boolean => {
  return array.length >= minLength;
};

/**
 * Calculate if variance is within acceptable range
 */
export const isAcceptableVariance = (
  value: number,
  mean: number,
  stdDev: number,
  numStdDevs: number = 3
): boolean => {
  const lowerBound = mean - numStdDevs * stdDev;
  const upperBound = mean + numStdDevs * stdDev;
  return value >= lowerBound && value <= upperBound;
};

/**
 * Validate session duration
 */
export const isValidSessionDuration = (
  duration: number,
  minDuration: number = 1000,
  maxDuration: number = 7200000
): boolean => {
  return duration >= minDuration && duration <= maxDuration;
};

/**
 * Check if typing speed is realistic
 */
export const isRealisticTypingSpeed = (wpm: number): boolean => {
  return wpm >= 0 && wpm <= 300; // Maximum realistic typing speed
};

/**
 * Validate feature values are not NaN or Infinity
 */
export const areValidNumbers = (values: number[]): boolean => {
  return values.every(v => Number.isFinite(v));
};

/**
 * Check if data quality meets threshold
 */
export const meetsQualityThreshold = (
  qualityScore: number,
  threshold: number = 0.7
): boolean => {
  return isNormalizedValue(qualityScore) && qualityScore >= threshold;
};

/**
 * Validate object has required keys
 */
export const hasRequiredKeys = <T extends Record<string, any>>(
  obj: T,
  requiredKeys: string[]
): boolean => {
  return requiredKeys.every(key => key in obj && obj[key] !== undefined);
};

/**
 * Create validation result object
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const createValidationResult = (
  valid: boolean,
  errors: string[] = []
): ValidationResult => {
  return { valid, errors };
};

/**
 * Combine multiple validation results
 */
export const combineValidationResults = (
  results: ValidationResult[]
): ValidationResult => {
  const valid = results.every(r => r.valid);
  const errors = results.flatMap(r => r.errors);
  return { valid, errors };
};
