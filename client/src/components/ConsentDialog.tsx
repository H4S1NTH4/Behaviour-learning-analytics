/**
 * Consent Dialog Component
 *
 * Modal dialog for collecting user consent for data collection
 */

import React from 'react';

export interface ConsentDialogProps {
  /**
   * Callback when user accepts consent
   */
  onAccept: () => void;

  /**
   * Callback when user declines consent
   */
  onDecline?: () => void;

  /**
   * Show the dialog
   */
  isOpen: boolean;

  /**
   * Custom title
   */
  title?: string;

  /**
   * Custom message
   */
  message?: string;
}

/**
 * Consent Dialog Component
 *
 * @example
 * ```tsx
 * const [showConsent, setShowConsent] = useState(!consentGranted);
 *
 * <ConsentDialog
 *   isOpen={showConsent}
 *   onAccept={() => {
 *     grantConsent();
 *     setShowConsent(false);
 *   }}
 *   onDecline={() => setShowConsent(false)}
 * />
 * ```
 */
export const ConsentDialog: React.FC<ConsentDialogProps> = ({
  onAccept,
  onDecline,
  isOpen,
  title = 'Data Collection Consent',
  message = 'This educational platform collects keystroke timing data for research purposes to improve learning outcomes. Your data will be anonymized and used only for educational research.'
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
        </div>

        <div style={styles.content}>
          <p style={styles.message}>{message}</p>

          <div style={styles.details}>
            <h3 style={styles.detailsTitle}>What we collect:</h3>
            <ul style={styles.list}>
              <li>Keystroke timing and patterns</li>
              <li>Cursor position during typing</li>
              <li>Session duration and activity</li>
            </ul>

            <h3 style={styles.detailsTitle}>How we use it:</h3>
            <ul style={styles.list}>
              <li>Analyze coding behavior patterns</li>
              <li>Improve personalized learning recommendations</li>
              <li>Research educational outcomes</li>
            </ul>

            <h3 style={styles.detailsTitle}>Your rights:</h3>
            <ul style={styles.list}>
              <li>Data is anonymized and encrypted</li>
              <li>You can revoke consent at any time</li>
              <li>Data is used only for educational research</li>
            </ul>
          </div>
        </div>

        <div style={styles.footer}>
          {onDecline && (
            <button onClick={onDecline} style={styles.declineButton}>
              Decline
            </button>
          )}
          <button onClick={onAccept} style={styles.acceptButton}>
            I Consent
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline styles for the component
 * In production, consider using CSS modules or styled-components
 */
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  header: {
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827'
  },
  content: {
    padding: '24px'
  },
  message: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    marginBottom: '24px'
  },
  details: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  detailsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
    marginTop: '16px',
    marginBottom: '8px'
  },
  list: {
    marginLeft: '20px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#4b5563'
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  acceptButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  declineButton: {
    padding: '10px 20px',
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default ConsentDialog;
