/**
 * Environment Configuration
 *
 * Handles client-side environment variables
 */

export interface EnvironmentConfig {
  API_ENDPOINT: string;
  DEBUG: boolean;
  ENVIRONMENT: 'development' | 'production' | 'testing';
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // In a real application, these would come from environment variables
  // For Vite: import.meta.env.VITE_API_ENDPOINT
  // For Create React App: process.env.REACT_APP_API_ENDPOINT
  // For Next.js: process.env.NEXT_PUBLIC_API_ENDPOINT

  const config: EnvironmentConfig = {
    API_ENDPOINT: getEnvVar('API_ENDPOINT', 'http://localhost:3000/api/keystroke'),
    DEBUG: getEnvVar('DEBUG', 'false') === 'true',
    ENVIRONMENT: (getEnvVar('ENVIRONMENT', 'development') as any) || 'development'
  };

  return config;
}

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, defaultValue: string): string {
  // Try different environment variable patterns

  // Vite pattern
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteKey = `VITE_${key}`;
    const viteValue = (import.meta as any).env[viteKey];
    if (viteValue !== undefined) {
      return viteValue;
    }
  }

  // Create React App pattern
  if (typeof process !== 'undefined' && process.env) {
    const craKey = `REACT_APP_${key}`;
    const craValue = process.env[craKey];
    if (craValue !== undefined) {
      return craValue;
    }
  }

  // Next.js pattern
  if (typeof process !== 'undefined' && process.env) {
    const nextKey = `NEXT_PUBLIC_${key}`;
    const nextValue = process.env[nextKey];
    if (nextValue !== undefined) {
      return nextValue;
    }
  }

  // Plain key
  if (typeof process !== 'undefined' && process.env) {
    const plainValue = process.env[key];
    if (plainValue !== undefined) {
      return plainValue;
    }
  }

  return defaultValue;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  const config = getEnvironmentConfig();
  return config.ENVIRONMENT === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  const config = getEnvironmentConfig();
  return config.ENVIRONMENT === 'production';
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  const config = getEnvironmentConfig();
  return config.DEBUG || isDevelopment();
}

/**
 * Get API endpoint
 */
export function getApiEndpoint(): string {
  const config = getEnvironmentConfig();
  return config.API_ENDPOINT;
}
