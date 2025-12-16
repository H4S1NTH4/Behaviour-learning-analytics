/**
 * Analytics and Behavioral State Types
 */

export type BehavioralStateType =
  | 'focused'
  | 'distracted'
  | 'frustrated'
  | 'engaged'
  | 'fatigued'
  | 'confused'
  | 'normal';

export interface BehavioralState {
  state: BehavioralStateType;
  confidence: number; // 0-1
  cognitive_load: number; // 0-1
  frustration: number; // 0-1
  engagement: number; // 0-1
  timestamp: number;
}

export interface SessionMetrics {
  session_id: string;
  user_id: string;
  assignment_id: string;

  // Time metrics
  session_duration: number; // milliseconds
  active_typing_time: number;
  idle_time: number;

  // Productivity metrics
  total_keystrokes: number;
  productive_keystrokes: number;
  deleted_keystrokes: number;
  words_typed: number;

  // Behavioral metrics
  average_typing_speed: number; // WPM
  typing_speed_variance: number;
  error_rate: number;
  correction_rate: number;
  pause_frequency: number;

  // State tracking
  behavioral_states: BehavioralState[];
  dominant_state: BehavioralStateType;
  state_transitions: number;

  // Quality metrics
  consistency_score: number; // 0-1
  rhythm_stability: number; // 0-1
  focus_score: number; // 0-1

  // Timestamps
  start_time: number;
  end_time: number;
  last_updated: number;
}

export interface InterventionRecommendation {
  type: 'break' | 'hint' | 'encouragement' | 'clarification' | 'none';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  reason: string;
  trigger_state: BehavioralStateType;
  confidence: number;
  suggested_actions: string[];
  timestamp: number;
}

export interface CognitiveLoadIndicators {
  typing_irregularity: number; // 0-1
  error_spike: boolean;
  pause_pattern_anomaly: boolean;
  backspace_frequency: number;
  hesitation_count: number;
}

export interface EngagementMetrics {
  sustained_typing_periods: number;
  response_latency: number; // milliseconds
  task_switching_frequency: number;
  interaction_consistency: number; // 0-1
}

export interface FrustrationIndicators {
  rapid_deletion_events: number;
  repeated_error_patterns: number;
  aggressive_typing_detected: boolean;
  prolonged_pauses: number;
  task_abandonment_risk: number; // 0-1
}
