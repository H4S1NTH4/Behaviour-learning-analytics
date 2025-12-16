/**
 * Behavioral State Constants
 */

export const BEHAVIORAL_STATES = {
  FOCUSED: 'focused',
  DISTRACTED: 'distracted',
  FRUSTRATED: 'frustrated',
  ENGAGED: 'engaged',
  FATIGUED: 'fatigued',
  CONFUSED: 'confused',
  NORMAL: 'normal',
} as const;

export const STATE_DESCRIPTIONS = {
  [BEHAVIORAL_STATES.FOCUSED]: 'User is highly concentrated and productive',
  [BEHAVIORAL_STATES.DISTRACTED]: 'User attention is divided or wandering',
  [BEHAVIORAL_STATES.FRUSTRATED]: 'User is experiencing difficulty or irritation',
  [BEHAVIORAL_STATES.ENGAGED]: 'User is actively and positively involved',
  [BEHAVIORAL_STATES.FATIGUED]: 'User is showing signs of tiredness or mental exhaustion',
  [BEHAVIORAL_STATES.CONFUSED]: 'User is uncertain or struggling to understand',
  [BEHAVIORAL_STATES.NORMAL]: 'User is in a baseline, neutral state',
} as const;

export const STATE_PRIORITY = {
  [BEHAVIORAL_STATES.FRUSTRATED]: 5,
  [BEHAVIORAL_STATES.CONFUSED]: 4,
  [BEHAVIORAL_STATES.FATIGUED]: 3,
  [BEHAVIORAL_STATES.DISTRACTED]: 2,
  [BEHAVIORAL_STATES.FOCUSED]: 1,
  [BEHAVIORAL_STATES.ENGAGED]: 1,
  [BEHAVIORAL_STATES.NORMAL]: 0,
} as const;

export const INTERVENTION_THRESHOLDS = {
  COGNITIVE_LOAD: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
  },
  FRUSTRATION: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
  },
  ENGAGEMENT: {
    LOW: 0.3,
    MEDIUM: 0.6,
    HIGH: 0.8,
  },
  CONFIDENCE: {
    MIN_THRESHOLD: 0.7,
    RELIABLE_THRESHOLD: 0.85,
  },
} as const;

export const STATE_TRANSITION_RULES = {
  // Allowed transitions from each state
  [BEHAVIORAL_STATES.NORMAL]: [
    BEHAVIORAL_STATES.FOCUSED,
    BEHAVIORAL_STATES.DISTRACTED,
    BEHAVIORAL_STATES.ENGAGED,
  ],
  [BEHAVIORAL_STATES.FOCUSED]: [
    BEHAVIORAL_STATES.NORMAL,
    BEHAVIORAL_STATES.FATIGUED,
    BEHAVIORAL_STATES.DISTRACTED,
  ],
  [BEHAVIORAL_STATES.DISTRACTED]: [
    BEHAVIORAL_STATES.NORMAL,
    BEHAVIORAL_STATES.FOCUSED,
    BEHAVIORAL_STATES.CONFUSED,
  ],
  [BEHAVIORAL_STATES.FRUSTRATED]: [
    BEHAVIORAL_STATES.CONFUSED,
    BEHAVIORAL_STATES.NORMAL,
    BEHAVIORAL_STATES.FATIGUED,
  ],
  [BEHAVIORAL_STATES.ENGAGED]: [
    BEHAVIORAL_STATES.FOCUSED,
    BEHAVIORAL_STATES.NORMAL,
    BEHAVIORAL_STATES.FATIGUED,
  ],
  [BEHAVIORAL_STATES.FATIGUED]: [
    BEHAVIORAL_STATES.DISTRACTED,
    BEHAVIORAL_STATES.CONFUSED,
    BEHAVIORAL_STATES.NORMAL,
  ],
  [BEHAVIORAL_STATES.CONFUSED]: [
    BEHAVIORAL_STATES.FRUSTRATED,
    BEHAVIORAL_STATES.FOCUSED,
    BEHAVIORAL_STATES.NORMAL,
  ],
} as const;

export const METRIC_THRESHOLDS = {
  TYPING_SPEED: {
    VERY_SLOW: 20, // WPM
    SLOW: 40,
    NORMAL_MIN: 40,
    NORMAL_MAX: 80,
    FAST: 80,
    VERY_FAST: 120,
  },
  ERROR_RATE: {
    LOW: 0.05, // 5%
    MODERATE: 0.15, // 15%
    HIGH: 0.3, // 30%
  },
  PAUSE_DURATION: {
    SHORT: 500, // milliseconds
    MEDIUM: 2000,
    LONG: 5000,
    VERY_LONG: 10000,
  },
  CORRECTION_RATE: {
    LOW: 0.1, // 10%
    MODERATE: 0.25, // 25%
    HIGH: 0.5, // 50%
  },
} as const;

export const FEATURE_WEIGHTS = {
  // Weights for calculating composite scores
  COGNITIVE_LOAD: {
    typing_irregularity: 0.3,
    error_rate: 0.25,
    pause_frequency: 0.2,
    correction_rate: 0.15,
    backspace_frequency: 0.1,
  },
  FRUSTRATION: {
    rapid_deletions: 0.35,
    repeated_errors: 0.3,
    aggressive_typing: 0.2,
    prolonged_pauses: 0.15,
  },
  ENGAGEMENT: {
    sustained_typing: 0.3,
    response_latency: 0.25,
    consistency: 0.25,
    task_completion: 0.2,
  },
} as const;

export const SESSION_THRESHOLDS = {
  MIN_SESSION_DURATION: 30000, // 30 seconds
  IDLE_TIMEOUT: 300000, // 5 minutes
  MAX_SESSION_DURATION: 7200000, // 2 hours
  MIN_KEYSTROKES_FOR_ANALYSIS: 50,
  MIN_KEYSTROKES_FOR_RELIABLE_PREDICTION: 200,
} as const;

export const BEHAVIORAL_INDICATORS = {
  FOCUS: {
    consistent_rhythm: true,
    low_error_rate: true,
    sustained_typing: true,
    minimal_pauses: true,
  },
  DISTRACTION: {
    irregular_rhythm: true,
    frequent_pauses: true,
    variable_speed: true,
  },
  FRUSTRATION: {
    rapid_deletions: true,
    repeated_errors: true,
    aggressive_keystrokes: true,
    error_clustering: true,
  },
  FATIGUE: {
    slowing_speed: true,
    increasing_errors: true,
    longer_pauses: true,
    declining_consistency: true,
  },
  CONFUSION: {
    hesitation_patterns: true,
    frequent_corrections: true,
    irregular_pauses: true,
    variable_pressure: true,
  },
} as const;
