/**
 * Model-related type definitions
 */

/**
 * Behavioral state prediction result
 */
export interface BehavioralPrediction {
  userId: string;
  sessionId: string;
  timestamp: Date;
  predictedState: 'flow' | 'productive_struggle' | 'unproductive_struggle' | 'disengaged';
  confidence: number;
  probabilities: {
    flow: number;
    productive_struggle: number;
    unproductive_struggle: number;
    disengaged: number;
  };
  cognitiveLoadEstimate: number;
  frustrationScore: number;
  engagementScore: number;
  interventionRecommended: boolean;
  interventionType?: string;
  featureVector: Record<string, number>;
}

/**
 * Intervention recommendation
 */
export interface InterventionRecommendation {
  type: 'hint' | 'scaffold' | 'break_suggestion' | 'resource' | 'instructor_alert';
  priority: 'low' | 'medium' | 'high';
  message: string;
  data?: any;
}

/**
 * Python inference response
 */
export interface PythonInferenceResponse {
  id: string;
  result: {
    predicted_state: 'flow' | 'productive_struggle' | 'unproductive_struggle' | 'disengaged';
    confidence: number;
    probabilities: {
      flow: number;
      productive_struggle: number;
      unproductive_struggle: number;
      disengaged: number;
    };
    intervention_recommended: boolean;
  };
}

/**
 * Feature vector from database
 */
export interface FeatureVector extends Record<string, number> {
  avg_dwell_time_ms: number;
  std_dwell_time_ms: number;
  avg_flight_time_ms: number;
  std_flight_time_ms: number;
  avg_press_press_time_ms: number;
  typing_speed_wpm: number;
  backspace_frequency: number;
  delete_frequency: number;
  error_correction_rate: number;
  pause_count: number;
  avg_pause_duration_ms: number;
  burst_count: number;
  avg_burst_length: number;
  alphanumeric_ratio: number;
  special_char_ratio: number;
  whitespace_ratio: number;
  modifier_usage_ratio: number;
  arrow_key_usage: number;
  min_dwell_time_ms: number;
  max_dwell_time_ms: number;
  median_dwell_time_ms: number;
  max_pause_duration_ms: number;
  typing_speed_cpm: number;
  std_press_press_time_ms: number;
  min_flight_time_ms: number;
}
