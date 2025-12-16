/**
 * Authentication and Biometric Profile Types
 */

import { KeystrokeFeatures } from './keystroke';

export interface BiometricProfile {
  user_id: string;
  profile_id: string;

  // Statistical profile
  baseline_features: KeystrokeFeatures;
  feature_ranges: Record<keyof KeystrokeFeatures, {
    min: number;
    max: number;
    mean: number;
    std_dev: number;
  }>;

  // Behavioral patterns
  common_bigrams: string[];
  common_trigrams: string[];
  typing_rhythm_signature: number[];

  // Authentication thresholds
  similarity_threshold: number; // 0-1, minimum similarity for authentication
  anomaly_threshold: number; // maximum deviation allowed

  // Profile metadata
  sample_size: number; // number of sessions used to build profile
  confidence_level: number; // 0-1
  last_updated: number;
  created_at: number;

  // Adaptation parameters
  is_adaptive: boolean;
  update_frequency: number; // days
  min_samples_for_update: number;
}

export interface AuthenticationResult {
  user_id: string;
  authenticated: boolean;
  confidence: number; // 0-1

  // Matching details
  similarity_score: number; // 0-1
  anomaly_score: number; // 0-1
  matched_features: string[];
  mismatched_features: string[];

  // Decision factors
  decision_reason: string;
  risk_level: 'low' | 'medium' | 'high';

  // Recommendations
  require_additional_verification: boolean;
  suggested_actions: string[];

  // Metadata
  session_id: string;
  timestamp: number;
  authentication_method: 'keystroke_dynamics' | 'hybrid';
}

export interface BiometricEnrollment {
  user_id: string;
  enrollment_id: string;

  // Training data
  training_sessions: string[]; // session_ids
  total_keystrokes: number;
  enrollment_duration: number; // milliseconds

  // Quality metrics
  data_quality_score: number; // 0-1
  consistency_score: number; // 0-1
  sufficient_data: boolean;

  // Status
  status: 'in_progress' | 'completed' | 'failed' | 'insufficient_data';
  completion_percentage: number; // 0-100

  // Timestamps
  started_at: number;
  completed_at?: number;
  expires_at?: number;
}

export interface AuthenticationAttempt {
  attempt_id: string;
  user_id: string;
  session_id: string;

  // Attempt details
  result: AuthenticationResult;
  features_submitted: Partial<KeystrokeFeatures>;

  // Context
  ip_address?: string;
  user_agent?: string;
  location?: string;

  // Timing
  timestamp: number;
  processing_time_ms: number;
}

export interface BiometricUpdate {
  profile_id: string;
  user_id: string;
  update_type: 'incremental' | 'full_retrain' | 'drift_correction';

  // Update details
  sessions_added: string[];
  features_updated: string[];

  // Quality metrics
  profile_quality_before: number;
  profile_quality_after: number;
  improvement_score: number; // -1 to 1

  timestamp: number;
}
