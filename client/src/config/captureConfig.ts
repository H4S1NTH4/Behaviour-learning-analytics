/**
 * Default Capture Configuration
 *
 * Centralized configuration for keystroke capture module
 */

import type { CaptureConfig } from '../keystroke-capture/types';
import { getEnvironmentConfig } from './environment';

/**
 * Default configuration values
 */
export const DEFAULT_CAPTURE_CONFIG: Partial<CaptureConfig> = {
  batchSizeLimit: 100,
  batchTimeLimit: 5000, // 5 seconds
  enableConsent: true,
  debug: false
};

/**
 * Create capture configuration with environment variables and defaults
 */
export function createCaptureConfig(
  userId: string,
  overrides?: Partial<CaptureConfig>
): CaptureConfig {
  const env = getEnvironmentConfig();

  return {
    apiEndpoint: env.API_ENDPOINT,
    userId,
    batchSizeLimit: DEFAULT_CAPTURE_CONFIG.batchSizeLimit!,
    batchTimeLimit: DEFAULT_CAPTURE_CONFIG.batchTimeLimit!,
    enableConsent: DEFAULT_CAPTURE_CONFIG.enableConsent!,
    debug: env.DEBUG,
    ...overrides
  };
}

/**
 * Validate capture configuration
 */
export function validateCaptureConfig(config: CaptureConfig): boolean {
  if (!config.apiEndpoint) {
    console.error('API endpoint is required');
    return false;
  }

  if (!config.userId) {
    console.error('User ID is required');
    return false;
  }

  if (config.batchSizeLimit <= 0) {
    console.error('Batch size limit must be greater than 0');
    return false;
  }

  if (config.batchTimeLimit <= 0) {
    console.error('Batch time limit must be greater than 0');
    return false;
  }

  return true;
}

/**
 * Configuration presets for different environments
 */
export const CONFIG_PRESETS = {
  development: {
    batchSizeLimit: 50,
    batchTimeLimit: 3000,
    debug: true
  },
  production: {
    batchSizeLimit: 100,
    batchTimeLimit: 5000,
    debug: false
  },
  testing: {
    batchSizeLimit: 10,
    batchTimeLimit: 1000,
    debug: true
  }
} as const;

/**
 * Get preset configuration by environment
 */
export function getPresetConfig(
  preset: keyof typeof CONFIG_PRESETS
): Partial<CaptureConfig> {
  return CONFIG_PRESETS[preset];
}
