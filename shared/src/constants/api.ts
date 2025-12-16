/**
 * API Constants and Configuration
 */

export const API_ENDPOINTS = {
  // Keystroke logging endpoints
  KEYSTROKE_LOG: '/api/v1/keystroke/log',
  KEYSTROKE_BATCH: '/api/v1/keystroke/batch',
  KEYSTROKE_HEALTH: '/api/v1/keystroke/health',
  KEYSTROKE_SESSION: '/api/v1/keystroke/session',

  // Analytics endpoints
  ANALYTICS_SESSION: '/api/v1/analytics/session',
  ANALYTICS_METRICS: '/api/v1/analytics/metrics',
  ANALYTICS_BEHAVIOR: '/api/v1/analytics/behavior',
  ANALYTICS_INTERVENTION: '/api/v1/analytics/intervention',
  ANALYTICS_EXPORT: '/api/v1/analytics/export',

  // Inference endpoints
  INFERENCE_PREDICT: '/api/v1/inference/predict',
  INFERENCE_BATCH: '/api/v1/inference/batch',
  INFERENCE_MODEL_INFO: '/api/v1/inference/model/info',
  INFERENCE_MODEL_METRICS: '/api/v1/inference/model/metrics',
  INFERENCE_HEALTH: '/api/v1/inference/health',

  // Authentication endpoints
  AUTH_ENROLL: '/api/v1/auth/enroll',
  AUTH_VERIFY: '/api/v1/auth/verify',
  AUTH_PROFILE: '/api/v1/auth/profile',
  AUTH_UPDATE: '/api/v1/auth/update',

  // User management
  USER_CREATE: '/api/v1/user/create',
  USER_GET: '/api/v1/user/:userId',
  USER_UPDATE: '/api/v1/user/:userId',
  USER_DELETE: '/api/v1/user/:userId',
  USER_SESSIONS: '/api/v1/user/:userId/sessions',

  // Dashboard endpoints
  DASHBOARD_OVERVIEW: '/api/v1/dashboard/overview',
  DASHBOARD_REALTIME: '/api/v1/dashboard/realtime',
  DASHBOARD_HISTORICAL: '/api/v1/dashboard/historical',
  DASHBOARD_ALERTS: '/api/v1/dashboard/alerts',
} as const;

export const PORTS = {
  SERVER_API: 3000,
  INFERENCE_ENGINE: 3001,
  DASHBOARD: 3002,
  DATABASE: 5432,
  REDIS: 6379,
} as const;

export const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE: 50,
  MAX_BATCH_SIZE: 200,
  MIN_BATCH_SIZE: 10,
  DEFAULT_BATCH_TIMEOUT: 5000, // milliseconds
  MAX_BATCH_TIMEOUT: 30000,
  MIN_BATCH_TIMEOUT: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  BACKOFF_MULTIPLIER: 2,
} as const;

export const API_TIMEOUTS = {
  DEFAULT_REQUEST_TIMEOUT: 10000, // milliseconds
  INFERENCE_TIMEOUT: 5000,
  BATCH_TIMEOUT: 15000,
  HEALTH_CHECK_TIMEOUT: 3000,
  DATABASE_QUERY_TIMEOUT: 30000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const RATE_LIMITS = {
  KEYSTROKE_LOG: {
    window_ms: 60000, // 1 minute
    max_requests: 1000,
  },
  INFERENCE: {
    window_ms: 60000,
    max_requests: 100,
  },
  ANALYTICS: {
    window_ms: 60000,
    max_requests: 200,
  },
  AUTH: {
    window_ms: 60000,
    max_requests: 50,
  },
} as const;

export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-User-ID'],
  MAX_AGE: 86400, // 24 hours
} as const;
