/**
 * Capture Status Component
 *
 * Displays the current status of keystroke capture
 */

import React, { useEffect, useState } from 'react';
import type { SessionInfo } from '../keystroke-capture/types';

export interface CaptureStatusProps {
  /**
   * Function to get session info
   */
  getSessionInfo: () => SessionInfo | null;

  /**
   * Update interval in milliseconds
   */
  updateInterval?: number;

  /**
   * Show detailed stats
   */
  showDetails?: boolean;

  /**
   * Position on screen
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Capture Status Indicator Component
 *
 * @example
 * ```tsx
 * const { getSessionInfo } = useKeystrokeCapture(config);
 *
 * <CaptureStatus
 *   getSessionInfo={getSessionInfo}
 *   showDetails={true}
 *   position="top-right"
 * />
 * ```
 */
export const CaptureStatus: React.FC<CaptureStatusProps> = ({
  getSessionInfo,
  updateInterval = 1000,
  showDetails = false,
  position = 'top-right'
}) => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    // Initial update
    setSessionInfo(getSessionInfo());

    // Set up interval for updates
    const interval = setInterval(() => {
      setSessionInfo(getSessionInfo());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [getSessionInfo, updateInterval]);

  if (!sessionInfo) {
    return null;
  }

  const statusColor = sessionInfo.isCapturing && sessionInfo.consentGranted
    ? '#10b981' // green
    : '#ef4444'; // red

  const statusText = sessionInfo.isCapturing && sessionInfo.consentGranted
    ? 'Recording'
    : 'Not Recording';

  const positionStyles = getPositionStyles(position);

  return (
    <div style={{ ...styles.container, ...positionStyles }}>
      <div style={styles.header}>
        <div style={{ ...styles.indicator, backgroundColor: statusColor }} />
        <span style={styles.statusText}>{statusText}</span>
      </div>

      {showDetails && (
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Session:</span>
            <span style={styles.detailValue}>
              {sessionInfo.sessionId.substring(0, 8)}...
            </span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Buffer:</span>
            <span style={styles.detailValue}>
              {sessionInfo.bufferSize} events
            </span>
          </div>

          {sessionInfo.failedBatches > 0 && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Failed:</span>
              <span style={{ ...styles.detailValue, color: '#ef4444' }}>
                {sessionInfo.failedBatches} batches
              </span>
            </div>
          )}

          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Consent:</span>
            <span style={styles.detailValue}>
              {sessionInfo.consentGranted ? 'Granted' : 'Not granted'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get position styles based on position prop
 */
function getPositionStyles(position: string): React.CSSProperties {
  const base = {
    position: 'fixed' as const,
    zIndex: 9998
  };

  switch (position) {
    case 'top-right':
      return { ...base, top: '16px', right: '16px' };
    case 'top-left':
      return { ...base, top: '16px', left: '16px' };
    case 'bottom-right':
      return { ...base, bottom: '16px', right: '16px' };
    case 'bottom-left':
      return { ...base, bottom: '16px', left: '16px' };
    default:
      return { ...base, top: '16px', right: '16px' };
  }
}

/**
 * Component styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    minWidth: '200px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  statusText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827'
  },
  details: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '12px'
  },
  detailLabel: {
    color: '#6b7280',
    fontWeight: 500
  },
  detailValue: {
    color: '#111827',
    fontWeight: 400
  }
};

export default CaptureStatus;
