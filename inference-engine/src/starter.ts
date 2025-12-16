/**
 * Inference Engine Starter
 *
 * Entry point for starting the real-time behavioral inference engine
 */

import { Pool } from 'pg';
import { BehavioralInferenceEngine } from './engine.js';
import { databaseConfig, inferenceConfig, validateEnvironment, getEnvironmentInfo } from './config/environment.js';
import { WebSocketManager, createWebSocketManager } from './websocket.js';

// Validate environment
validateEnvironment();

// Display configuration
console.log('Starting Behavioral Inference Engine...');
console.log(getEnvironmentInfo());

// Create database pool
const pool = new Pool(databaseConfig);

// Create inference engine
const engine = new BehavioralInferenceEngine(pool, inferenceConfig);

// Create WebSocket manager if enabled
let wsManager: WebSocketManager | null = null;
if (inferenceConfig.enableWebSocket) {
  wsManager = createWebSocketManager(inferenceConfig.wsPort!);
}

// Event handlers
engine.on('prediction', (prediction) => {
  console.log(
    `[PREDICTION] User: ${prediction.userId}, State: ${prediction.predictedState}, ` +
    `Confidence: ${(prediction.confidence * 100).toFixed(1)}%`
  );

  // Broadcast via WebSocket
  if (wsManager) {
    wsManager.broadcastBehavioralState(prediction.sessionId, prediction);
  }
});

engine.on('intervention_needed', ({ prediction, intervention }) => {
  console.log(`[INTERVENTION] ${intervention.priority.toUpperCase()}: ${intervention.message}`);

  // Broadcast via WebSocket
  if (wsManager) {
    wsManager.broadcastIntervention(prediction.sessionId, intervention);
  }
});

engine.on('error', (error) => {
  console.error('[ERROR]', error);
});

// Start engine
(async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connection established');

    // Start engine
    await engine.start();
    console.log('Inference Engine is running');

    // Display statistics periodically
    setInterval(() => {
      const status = engine.getMonitoringStatus();
      const wsStats = wsManager?.getStats();

      console.log(`[STATUS] Active Sessions: ${status.activeSessions}, ` +
        `WebSocket Connections: ${wsStats?.totalConnections || 0}`);
    }, 60000); // Every minute

  } catch (error) {
    console.error('Failed to start inference engine:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await engine.stop();
  if (wsManager) {
    wsManager.close();
  }
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await engine.stop();
  if (wsManager) {
    wsManager.close();
  }
  await pool.end();
  process.exit(0);
});
