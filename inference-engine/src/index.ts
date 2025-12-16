/**
 * Inference Engine Main Entry Point
 */

// Start the inference engine
import './starter.js';

// Export public API
export { BehavioralInferenceEngine, createInferenceEngine } from './engine.js';
export type { InferenceConfig } from './engine.js';
export type { BehavioralPrediction, InterventionRecommendation, FeatureVector } from './models/types.js';
export { WebSocketManager, createWebSocketManager } from './websocket.js';
export { loadModelMetadata, validateModelConfig, getModelVersion } from './models/loader.js';
export type { ModelMetadata, ModelConfig } from './models/loader.js';
export { databaseConfig, inferenceConfig, loggingConfig, validateEnvironment, getEnvironmentInfo } from './config/environment.js';
