/**
 * Example Application
 *
 * Demonstrates usage of the behavioral analytics client package
 */

import React, { useState } from 'react';
import { MonacoEditor } from './components/MonacoEditor';
import { ConsentDialog } from './components/ConsentDialog';
import { CaptureStatus } from './components/CaptureStatus';
import { useConsentManager } from './keystroke-capture/hooks/useConsentManager';
import { useKeystrokeCapture } from './keystroke-capture/hooks/useKeystrokeCapture';
import { createCaptureConfig } from './config/captureConfig';

/**
 * Main App Component
 */
export const App: React.FC = () => {
  // User ID (in a real app, this would come from authentication)
  const userId = 'demo-user-123';

  // Consent management
  const { consentGranted, grantConsent } = useConsentManager({
    userId,
    onConsentChange: (granted) => {
      console.log('Consent changed:', granted);
    }
  });

  // Editor content state
  const [code, setCode] = useState(`// Welcome to the Behavioral Analytics Demo
// Start typing to see keystroke capture in action

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`);

  // Capture configuration
  const captureConfig = createCaptureConfig(userId, {
    assignmentId: 'demo-assignment-001',
    debug: true
  });

  // Keystroke capture hook
  const { getSessionInfo } = useKeystrokeCapture(captureConfig);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Behavioral Analytics Demo</h1>
        <p style={styles.subtitle}>
          Monaco Editor with Keystroke Capture Integration
        </p>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Info Panel */}
        <div style={styles.infoPanel}>
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>Session Information</h3>
            <div style={styles.infoContent}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>User ID:</span>
                <code style={styles.infoValue}>{userId}</code>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Consent:</span>
                <span style={styles.infoValue}>
                  {consentGranted ? '✓ Granted' : '✗ Not Granted'}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>About This Demo</h3>
            <p style={styles.infoText}>
              This application demonstrates keystroke capture for behavioral
              analytics in educational settings. All typing events are captured
              and sent to the server for analysis.
            </p>
            <p style={styles.infoText}>
              Open the browser console to see debug logs.
            </p>
          </div>
        </div>

        {/* Editor */}
        <div style={styles.editorContainer}>
          <MonacoEditor
            defaultValue={code}
            language="javascript"
            theme="vs-dark"
            height="600px"
            captureConfig={captureConfig}
            onChange={(value) => setCode(value || '')}
          />
        </div>
      </main>

      {/* Consent Dialog */}
      <ConsentDialog
        isOpen={!consentGranted}
        onAccept={grantConsent}
      />

      {/* Capture Status Indicator */}
      {consentGranted && (
        <CaptureStatus
          getSessionInfo={getSessionInfo}
          showDetails={true}
          position="top-right"
        />
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Behavioral Analytics System - Educational Research Platform
        </p>
      </footer>
    </div>
  );
};

/**
 * Component styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    padding: '24px',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 700
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '16px',
    color: '#d1d5db'
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px'
  },
  infoPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px'
  },
  infoTitle: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827'
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500
  },
  infoValue: {
    fontSize: '14px',
    color: '#111827'
  },
  infoText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#4b5563',
    margin: '0 0 12px'
  },
  editorContainer: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  footer: {
    backgroundColor: '#1f2937',
    color: '#d1d5db',
    padding: '16px',
    textAlign: 'center'
  },
  footerText: {
    margin: 0,
    fontSize: '14px'
  }
};

export default App;
