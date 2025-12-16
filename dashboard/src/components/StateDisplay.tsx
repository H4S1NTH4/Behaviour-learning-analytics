/**
 * Behavioral State Display Component
 *
 * Visualizes the current behavioral state with confidence metrics
 * and historical trends.
 *
 * @module StateDisplay
 */

import React from 'react';

export interface BehavioralState {
  timestamp: Date;
  state: string;
  confidence: number;
  cognitiveLoad: number;
  frustration: number;
  engagement: number;
}

interface StateDisplayProps {
  currentState: BehavioralState | null;
  isLive?: boolean;
}

const STATE_COLORS: Record<string, string> = {
  flow: '#4CAF50',
  productive_struggle: '#FFC107',
  unproductive_struggle: '#FF5722',
  disengaged: '#9E9E9E',
};

const STATE_DESCRIPTIONS: Record<string, string> = {
  flow: 'Student is in an optimal learning state with high engagement and appropriate challenge level.',
  productive_struggle: 'Student is challenged but actively problem-solving. This is a healthy learning state.',
  unproductive_struggle: 'Student is frustrated and may need intervention or guidance.',
  disengaged: 'Student shows low engagement. Consider intervention to re-engage.',
};

/**
 * Format state name for display
 */
function formatStateName(state: string): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get state icon based on state type
 */
function getStateIcon(state: string): string {
  const icons: Record<string, string> = {
    flow: '✓',
    productive_struggle: '⚡',
    unproductive_struggle: '⚠',
    disengaged: '●',
  };
  return icons[state] || '?';
}

/**
 * StateDisplay Component
 */
export const StateDisplay: React.FC<StateDisplayProps> = ({ currentState, isLive = false }) => {
  if (!currentState) {
    return (
      <div className="state-display-empty">
        <div className="empty-icon">📊</div>
        <p>Waiting for behavioral data...</p>
        {isLive && <div className="pulse-indicator">Listening for updates</div>}
      </div>
    );
  }

  const stateColor = STATE_COLORS[currentState.state] || '#757575';
  const confidencePercent = (currentState.confidence * 100).toFixed(1);

  return (
    <div className="state-display">
      {/* Main State Badge */}
      <div className="state-badge-container">
        <div
          className="state-badge"
          style={{
            backgroundColor: stateColor,
            boxShadow: `0 4px 12px ${stateColor}40`,
          }}
        >
          <span className="state-icon">{getStateIcon(currentState.state)}</span>
          <span className="state-name">{formatStateName(currentState.state)}</span>
        </div>
        {isLive && <div className="live-indicator">LIVE</div>}
      </div>

      {/* State Description */}
      <div className="state-description">
        <p>{STATE_DESCRIPTIONS[currentState.state] || 'Behavioral state detected.'}</p>
      </div>

      {/* Confidence Indicator */}
      <div className="confidence-section">
        <div className="confidence-header">
          <span className="confidence-label">Prediction Confidence</span>
          <span className="confidence-value">{confidencePercent}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: stateColor,
            }}
          />
        </div>
      </div>

      {/* Behavioral Metrics */}
      <div className="behavioral-metrics">
        <MetricBar
          label="Cognitive Load"
          value={currentState.cognitiveLoad}
          color="#2196F3"
          icon="🧠"
        />
        <MetricBar
          label="Frustration"
          value={currentState.frustration}
          color="#F44336"
          icon="😤"
        />
        <MetricBar
          label="Engagement"
          value={currentState.engagement}
          color="#4CAF50"
          icon="⚡"
        />
      </div>

      {/* Timestamp */}
      <div className="state-timestamp">
        Last updated: {currentState.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

/**
 * Metric Bar Component
 */
interface MetricBarProps {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, color, icon }) => {
  const percentage = (value * 100).toFixed(0);

  return (
    <div className="metric-bar">
      <div className="metric-header">
        {icon && <span className="metric-icon">{icon}</span>}
        <span className="metric-label">{label}</span>
        <span className="metric-value">{percentage}%</span>
      </div>
      <div className="metric-progress">
        <div
          className="metric-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default StateDisplay;
