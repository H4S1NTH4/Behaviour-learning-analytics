/**
 * Metrics Card Component
 *
 * Displays session-level keystroke and behavioral metrics
 * in an organized card layout.
 *
 * @module MetricsCard
 */

import React from 'react';

export interface SessionMetrics {
  totalKeystrokes: number;
  typingSpeedWPM: number;
  errorCorrectionRate: number;
  pauseCount: number;
  averageDwellTime: number;
  sessionDuration: number;
  activeTime?: number;
  idleTime?: number;
}

interface MetricsCardProps {
  metrics: SessionMetrics | null;
  title?: string;
  loading?: boolean;
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get status color based on metric value
 */
function getMetricStatus(metricName: string, value: number): 'low' | 'medium' | 'high' | 'neutral' {
  switch (metricName) {
    case 'typingSpeed':
      if (value < 20) return 'low';
      if (value < 40) return 'medium';
      return 'high';
    case 'errorRate':
      if (value < 0.05) return 'high'; // Low error rate is good
      if (value < 0.15) return 'medium';
      return 'low';
    case 'pauseCount':
      return 'neutral';
    default:
      return 'neutral';
  }
}

/**
 * MetricsCard Component
 */
export const MetricsCard: React.FC<MetricsCardProps> = ({
  metrics,
  title = 'Session Metrics',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="metrics-card">
        <h2>{title}</h2>
        <div className="metrics-loading">
          <div className="spinner" />
          <p>Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="metrics-card">
        <h2>{title}</h2>
        <div className="metrics-empty">
          <p>No metrics available</p>
          <small>Metrics will appear once the session begins</small>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-card">
      <h2>{title}</h2>
      <div className="metrics-grid">
        {/* Primary Metrics */}
        <MetricItem
          icon="⌨️"
          label="Total Keystrokes"
          value={formatNumber(metrics.totalKeystrokes)}
          status="neutral"
        />
        <MetricItem
          icon="⚡"
          label="Typing Speed"
          value={`${metrics.typingSpeedWPM.toFixed(1)} WPM`}
          status={getMetricStatus('typingSpeed', metrics.typingSpeedWPM)}
          tooltip="Words per minute"
        />
        <MetricItem
          icon="✏️"
          label="Error Rate"
          value={`${(metrics.errorCorrectionRate * 100).toFixed(1)}%`}
          status={getMetricStatus('errorRate', metrics.errorCorrectionRate)}
          tooltip="Percentage of keystrokes that are corrections"
        />
        <MetricItem
          icon="⏸️"
          label="Pause Events"
          value={formatNumber(metrics.pauseCount)}
          status="neutral"
          tooltip="Number of typing pauses"
        />
        <MetricItem
          icon="⏱️"
          label="Avg Dwell Time"
          value={`${metrics.averageDwellTime.toFixed(0)} ms`}
          status="neutral"
          tooltip="Average time keys are held down"
        />
        <MetricItem
          icon="🕐"
          label="Session Duration"
          value={formatDuration(metrics.sessionDuration)}
          status="neutral"
        />

        {/* Optional Metrics */}
        {metrics.activeTime !== undefined && (
          <MetricItem
            icon="✓"
            label="Active Time"
            value={formatDuration(metrics.activeTime)}
            status="high"
          />
        )}
        {metrics.idleTime !== undefined && (
          <MetricItem
            icon="○"
            label="Idle Time"
            value={formatDuration(metrics.idleTime)}
            status="neutral"
          />
        )}
      </div>

      {/* Summary Footer */}
      {metrics.activeTime !== undefined && metrics.sessionDuration > 0 && (
        <div className="metrics-footer">
          <div className="activity-ratio">
            Active:{' '}
            {((metrics.activeTime / metrics.sessionDuration) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Metric Item Component
 */
interface MetricItemProps {
  icon: string;
  label: string;
  value: string | number;
  status?: 'low' | 'medium' | 'high' | 'neutral';
  tooltip?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({
  icon,
  label,
  value,
  status = 'neutral',
  tooltip,
}) => {
  return (
    <div className={`metric-item status-${status}`} title={tooltip}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
      </div>
    </div>
  );
};

export default MetricsCard;
