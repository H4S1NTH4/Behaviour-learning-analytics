/**
 * Inference Engine Types
 */

import { BehavioralStateType } from './analytics';
import { KeystrokeFeatures } from './keystroke';

export interface BehavioralPrediction {
  session_id: string;
  user_id: string;
  predicted_state: BehavioralStateType;
  confidence: number; // 0-1

  // Probability distribution over all states
  state_probabilities: Record<BehavioralStateType, number>;

  // Contributing factors
  primary_indicators: string[];
  feature_importance: Record<string, number>;

  // Contextual information
  features_used: Partial<KeystrokeFeatures>;
  model_version: string;
  inference_time_ms: number;
  timestamp: number;
}

export interface InferenceConfig {
  model_path: string;
  model_type: 'lstm' | 'transformer' | 'random_forest' | 'ensemble';

  // Model parameters
  sequence_length: number;
  feature_window_size: number; // milliseconds
  prediction_threshold: number; // minimum confidence

  // Performance settings
  batch_inference: boolean;
  max_batch_size: number;
  inference_timeout_ms: number;

  // Feature engineering
  normalize_features: boolean;
  feature_selection: string[];
  use_temporal_context: boolean;

  // Caching
  enable_caching: boolean;
  cache_ttl_ms: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];

  // Per-class metrics
  class_metrics: Record<BehavioralStateType, {
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;

  // Performance metrics
  avg_inference_time_ms: number;
  throughput: number; // predictions per second

  model_version: string;
  evaluation_timestamp: number;
}

export interface InferenceRequest {
  session_id: string;
  user_id: string;
  features: Partial<KeystrokeFeatures>;
  sequence_data?: any[]; // Raw sequence for temporal models
  context?: Record<string, any>;
}

export interface InferenceResponse {
  success: boolean;
  prediction?: BehavioralPrediction;
  error?: string;
  processing_time_ms: number;
  timestamp: number;
}

export interface ModelUpdateEvent {
  model_version: string;
  update_type: 'retrain' | 'fine_tune' | 'replace';
  trigger: 'scheduled' | 'performance_degradation' | 'manual';
  metrics_before?: Partial<ModelMetrics>;
  metrics_after?: Partial<ModelMetrics>;
  timestamp: number;
}
