/**
 * Behavioral Analytics Client Package
 *
 * Public API exports for library usage
 */

// Core capture classes
export { KeystrokeCapture, createKeystrokeCapture } from './keystroke-capture/KeystrokeCapture';

// React hooks
export { useKeystrokeCapture } from './keystroke-capture/hooks/useKeystrokeCapture';
export { useConsentManager, getConsentStatus, setConsentStatus } from './keystroke-capture/hooks/useConsentManager';

// React components
export { MonacoEditor } from './components/MonacoEditor';
export { ConsentDialog } from './components/ConsentDialog';
export { CaptureStatus } from './components/CaptureStatus';

// Utilities
export { BatchManager, createBatchManager } from './keystroke-capture/utils/batchManager';
export { SessionManager, createSessionManager } from './keystroke-capture/utils/sessionManager';

// Configuration
export {
  createCaptureConfig,
  validateCaptureConfig,
  getPresetConfig,
  DEFAULT_CAPTURE_CONFIG,
  CONFIG_PRESETS
} from './config/captureConfig';

export {
  getEnvironmentConfig,
  isDevelopment,
  isProduction,
  isDebugEnabled,
  getApiEndpoint
} from './config/environment';

// Types
export type {
  KeystrokeEvent,
  CaptureConfig,
  SessionInfo,
  BatchPayload,
  ConsentStatus,
  BrowserInfo
} from './keystroke-capture/types';

export type { UseKeystrokeCaptureOptions, UseKeystrokeCaptureReturn } from './keystroke-capture/hooks/useKeystrokeCapture';
export type { UseConsentManagerOptions, UseConsentManagerReturn } from './keystroke-capture/hooks/useConsentManager';
export type { MonacoEditorProps } from './components/MonacoEditor';
export type { ConsentDialogProps } from './components/ConsentDialog';
export type { CaptureStatusProps } from './components/CaptureStatus';
export type { BatchManagerOptions } from './keystroke-capture/utils/batchManager';
export type { SessionManagerOptions, SessionData } from './keystroke-capture/utils/sessionManager';
export type { EnvironmentConfig } from './config/environment';
