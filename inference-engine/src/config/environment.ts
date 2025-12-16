/**
 * Environment Configuration
 */

import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Database configuration
 */
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'behavioral_analytics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

/**
 * Inference engine configuration
 */
export const inferenceConfig = {
  modelPath: process.env.MODEL_PATH || 'models/lstm_behavioral_model.keras',
  scalerPath: process.env.SCALER_PATH || 'models/feature_scaler.pkl',
  metadataPath: process.env.METADATA_PATH || 'models/model_metadata.json',
  pythonPath: process.env.PYTHON_PATH || 'python3',
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.6'),
  inferenceIntervalSeconds: parseInt(process.env.INFERENCE_INTERVAL_SECONDS || '30', 10),
  enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
  wsPort: parseInt(process.env.WEBSOCKET_PORT || '3001', 10)
};

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. Set these in .env file for production.');
  }
}

/**
 * Get environment info for logging
 */
export function getEnvironmentInfo(): string {
  return `
Environment Configuration:
  Database: ${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}
  Model: ${inferenceConfig.modelPath}
  Scaler: ${inferenceConfig.scalerPath}
  Metadata: ${inferenceConfig.metadataPath}
  Python: ${inferenceConfig.pythonPath}
  Confidence Threshold: ${inferenceConfig.confidenceThreshold}
  Inference Interval: ${inferenceConfig.inferenceIntervalSeconds}s
  WebSocket: ${inferenceConfig.enableWebSocket ? `Enabled on port ${inferenceConfig.wsPort}` : 'Disabled'}
  Log Level: ${loggingConfig.level}
  `.trim();
}
