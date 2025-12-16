/**
 * Environment Configuration and Validation
 *
 * Loads and validates environment variables using Zod
 * Ensures all required configuration is present before server starts
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number).pipe(z.number().int().positive()),
  DB_NAME: z.string().default('behavioral_analytics'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string(),
  DB_POOL_SIZE: z.string().default('20').transform(Number).pipe(z.number().int().positive()),

  // Server configuration
  API_PORT: z.string().default('3000').transform(Number).pipe(z.number().int().positive()),

  // Security
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),

  // Features
  ENABLE_CONSENT: z.string().default('true').transform(val => val === 'true'),
  DEBUG_MODE: z.string().default('false').transform(val => val === 'true'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number).pipe(z.number().int().positive()),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number).pipe(z.number().int().positive()),
});

/**
 * Parsed and validated environment variables
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 */
export function loadEnvironment(): Environment {
  try {
    const env = envSchema.parse(process.env);

    // Log configuration in development mode
    if (env.NODE_ENV === 'development') {
      console.log('Environment configuration loaded:');
      console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
      console.log(`  - API_PORT: ${env.API_PORT}`);
      console.log(`  - DB_HOST: ${env.DB_HOST}`);
      console.log(`  - DB_PORT: ${env.DB_PORT}`);
      console.log(`  - DB_NAME: ${env.DB_NAME}`);
      console.log(`  - DB_USER: ${env.DB_USER}`);
      console.log(`  - DB_POOL_SIZE: ${env.DB_POOL_SIZE}`);
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.issues.forEach(issue => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

/**
 * Global environment instance
 */
let environmentInstance: Environment | null = null;

/**
 * Get environment configuration (singleton)
 */
export function getEnvironment(): Environment {
  if (!environmentInstance) {
    environmentInstance = loadEnvironment();
  }
  return environmentInstance;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvironment().NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvironment().NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest(): boolean {
  return getEnvironment().NODE_ENV === 'test';
}

export default getEnvironment;
