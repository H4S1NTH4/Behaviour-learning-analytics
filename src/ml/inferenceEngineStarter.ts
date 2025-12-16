/**
 * Inference Engine Starter
 *
 * Entry point for starting the real-time behavioral inference engine
 */

import { Pool } from 'pg';
import { BehavioralInferenceEngine } from './inferenceEngine.js';

// Load database config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'behavioral_analytics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

const pool = new Pool(dbConfig);

// Inference engine config
const inferenceConfig = {
  modelPath: process.env.MODEL_PATH || 'models/lstm_behavioral_model.keras',
  scalerPath: process.env.SCALER_PATH || 'models/feature_scaler.pkl',
  metadataPath: process.env.METADATA_PATH || 'models/model_metadata.json',
  pythonPath: process.env.PYTHON_PATH || 'python3',
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.6'),
  inferenceIntervalSeconds: parseInt(process.env.INFERENCE_INTERVAL_SECONDS || '30'),
  enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
  wsPort: parseInt(process.env.WEBSOCKET_PORT || '3001')
};

console.log('Starting Behavioral Inference Engine...');
console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`Model: ${inferenceConfig.modelPath}`);
console.log(`WebSocket: ${inferenceConfig.enableWebSocket ? `Enabled on port ${inferenceConfig.wsPort}` : 'Disabled'}`);

const engine = new BehavioralInferenceEngine(pool, inferenceConfig);

// Event handlers
engine.on('prediction', (prediction) => {
  console.log(`[PREDICTION] User: ${prediction.userId}, State: ${prediction.predictedState}, Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
});

engine.on('intervention_needed', ({ prediction, intervention }) => {
  console.log(`[INTERVENTION] ${intervention.priority.toUpperCase()}: ${intervention.message}`);
});

engine.on('authentication_alert', ({ sessionId, userId, riskScore }) => {
  console.log(`[AUTH ALERT] Session ${sessionId}, User ${userId}, Risk: ${(riskScore * 100).toFixed(1)}%`);
});

engine.on('error', (error) => {
  console.error('[ERROR]', error);
});

// Start engine
(async () => {
  try {
    await engine.start();
    console.log('✅ Inference Engine is running');
  } catch (error) {
    console.error('❌ Failed to start inference engine:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await engine.stop();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await engine.stop();
  await pool.end();
  process.exit(0);
});
