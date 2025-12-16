/**
 * React Hook for managing user consent for data collection
 */

import { useState, useEffect, useCallback } from 'react';
import type { ConsentStatus } from '../types';

export interface UseConsentManagerOptions {
  userId: string;
  onConsentChange?: (granted: boolean) => void;
}

export interface UseConsentManagerReturn {
  consentGranted: boolean;
  consentTimestamp: string | null;
  grantConsent: () => void;
  revokeConsent: () => void;
  checkConsent: () => boolean;
}

/**
 * React Hook for managing consent state
 *
 * @example
 * ```tsx
 * const { consentGranted, grantConsent, revokeConsent } = useConsentManager({
 *   userId: 'user123',
 *   onConsentChange: (granted) => {
 *     console.log('Consent changed:', granted);
 *   }
 * });
 *
 * if (!consentGranted) {
 *   return <ConsentDialog onAccept={grantConsent} />;
 * }
 * ```
 */
export function useConsentManager(
  options: UseConsentManagerOptions
): UseConsentManagerReturn {
  const { userId, onConsentChange } = options;
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [consentTimestamp, setConsentTimestamp] = useState<string | null>(null);

  const consentKey = `keystroke_capture_consent_${userId}`;
  const timestampKey = `${consentKey}_timestamp`;

  /**
   * Check consent status from localStorage
   */
  const checkConsent = useCallback((): boolean => {
    const consent = localStorage.getItem(consentKey) === 'granted';
    const timestamp = localStorage.getItem(timestampKey);

    setConsentGranted(consent);
    setConsentTimestamp(timestamp);

    return consent;
  }, [consentKey, timestampKey]);

  /**
   * Grant consent and store in localStorage
   */
  const grantConsent = useCallback(() => {
    const timestamp = new Date().toISOString();

    localStorage.setItem(consentKey, 'granted');
    localStorage.setItem(timestampKey, timestamp);

    setConsentGranted(true);
    setConsentTimestamp(timestamp);

    if (onConsentChange) {
      onConsentChange(true);
    }
  }, [consentKey, timestampKey, onConsentChange]);

  /**
   * Revoke consent and remove from localStorage
   */
  const revokeConsent = useCallback(() => {
    localStorage.removeItem(consentKey);
    localStorage.removeItem(timestampKey);

    setConsentGranted(false);
    setConsentTimestamp(null);

    if (onConsentChange) {
      onConsentChange(false);
    }
  }, [consentKey, timestampKey, onConsentChange]);

  /**
   * Check consent status on mount
   */
  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  /**
   * Listen for storage events (consent changes in other tabs)
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === consentKey) {
        checkConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [consentKey, checkConsent]);

  return {
    consentGranted,
    consentTimestamp,
    grantConsent,
    revokeConsent,
    checkConsent
  };
}

/**
 * Get consent status for a user without React
 */
export function getConsentStatus(userId: string): ConsentStatus {
  const consentKey = `keystroke_capture_consent_${userId}`;
  const timestampKey = `${consentKey}_timestamp`;

  const granted = localStorage.getItem(consentKey) === 'granted';
  const timestamp = localStorage.getItem(timestampKey) || undefined;

  return { granted, timestamp };
}

/**
 * Store consent for a user without React
 */
export function setConsentStatus(userId: string, granted: boolean): void {
  const consentKey = `keystroke_capture_consent_${userId}`;
  const timestampKey = `${consentKey}_timestamp`;

  if (granted) {
    localStorage.setItem(consentKey, 'granted');
    localStorage.setItem(timestampKey, new Date().toISOString());
  } else {
    localStorage.removeItem(consentKey);
    localStorage.removeItem(timestampKey);
  }
}
