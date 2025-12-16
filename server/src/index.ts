/**
 * Barrel Exports for Behavioral Analytics Server
 *
 * Main entry point for programmatic access to server components
 */

// Server
export { createApp, startServer } from './server.js';

// Configuration
export {
  getEnvironment,
  loadEnvironment,
  isDevelopment,
  isProduction,
  isTest
} from './config/environment.js';

export {
  createPool,
  getPool,
  testConnection,
  query,
  transaction,
  closePool,
  getPoolStats,
  runMigrations,
  setupGracefulShutdown
} from './config/database.js';

// Services
export {
  KeystrokeIngestionService,
  validateKeystrokeBatch as validateKeystrokeBatchService,
  rateLimitMiddleware,
  createIngestionHandler,
  setupKeystrokeRoutes,
  startIngestionServer,
  loadDatabaseConfig
} from './services/keystrokeIngestion.js';

export {
  FeatureExtractionService,
  runFeatureExtractionJob
} from './services/featureExtraction.js';

export {
  ContinuousAuthenticationService
} from './services/continuousAuth.js';

// API Routes
export { createKeystrokeRoutes } from './api/keystroke/routes.js';
export { createAnalyticsRoutes } from './api/analytics/routes.js';
export { createHealthRoutes } from './api/health/routes.js';

// Middleware
export {
  validateKeystrokeBatch,
  validateSessionHeader,
  validateUUIDParam,
  validateBody,
  validateQuery,
  KeystrokeEventSchema,
  BatchPayloadSchema
} from './middleware/validation.js';

export {
  createCorsMiddleware,
  corsMiddleware,
  developmentCors,
  productionCors
} from './middleware/cors.js';

export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ApiError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError
} from './middleware/errorHandler.js';

// Types
export type { Environment } from './config/environment.js';
export type { DatabaseConfig } from './config/database.js';
export type { CorsOptions } from './middleware/cors.js';

// Re-export service types
export type {
  KeystrokeEvent,
  KeystrokeFeatures,
  ExtractionConfig
} from './services/featureExtraction.js';

export type {
  BiometricProfile,
  FeatureDistribution,
  AuthenticationResult,
  CPAConfig
} from './services/continuousAuth.js';
