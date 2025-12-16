/**
 * React Hook for Monaco Editor integration with Keystroke Capture
 */

import { useEffect, useRef, useCallback } from 'react';
import { KeystrokeCapture, createKeystrokeCapture } from '../KeystrokeCapture';
import type { CaptureConfig, SessionInfo } from '../types';

export interface UseKeystrokeCaptureOptions extends CaptureConfig {
  autoStart?: boolean;
}

export interface UseKeystrokeCaptureReturn {
  handleEditorMount: (editor: any) => void;
  startCapture: () => void;
  stopCapture: () => void;
  getSessionInfo: () => SessionInfo | null;
  isInitialized: boolean;
}

/**
 * React Hook for integrating keystroke capture with Monaco Editor
 *
 * @example
 * ```tsx
 * const { handleEditorMount, stopCapture } = useKeystrokeCapture({
 *   apiEndpoint: 'http://localhost:3000/api/keystroke',
 *   userId: 'user123',
 *   batchSizeLimit: 100,
 *   batchTimeLimit: 5000,
 *   enableConsent: true,
 *   debug: true
 * });
 *
 * return (
 *   <Editor
 *     onMount={handleEditorMount}
 *     // ... other props
 *   />
 * );
 * ```
 */
export function useKeystrokeCapture(
  options: UseKeystrokeCaptureOptions
): UseKeystrokeCaptureReturn {
  const captureInstanceRef = useRef<KeystrokeCapture | null>(null);
  const editorRef = useRef<any>(null);
  const { autoStart = true, ...config } = options;

  /**
   * Handle Monaco Editor mount event
   */
  const handleEditorMount = useCallback((editor: any) => {
    if (!editor) {
      console.error('[useKeystrokeCapture] Invalid editor instance');
      return;
    }

    editorRef.current = editor;

    // Create capture instance if not already created
    if (!captureInstanceRef.current) {
      captureInstanceRef.current = createKeystrokeCapture(config);
    }

    // Initialize capture with editor
    if (autoStart) {
      captureInstanceRef.current.initialize(editor);
    }
  }, [config, autoStart]);

  /**
   * Manually start capture
   */
  const startCapture = useCallback(() => {
    if (!captureInstanceRef.current) {
      console.error('[useKeystrokeCapture] Capture instance not initialized');
      return;
    }

    if (!editorRef.current) {
      console.error('[useKeystrokeCapture] Editor not mounted');
      return;
    }

    captureInstanceRef.current.initialize(editorRef.current);
  }, []);

  /**
   * Stop capture and flush remaining data
   */
  const stopCapture = useCallback(() => {
    if (captureInstanceRef.current) {
      captureInstanceRef.current.stopCapture();
    }
  }, []);

  /**
   * Get current session information
   */
  const getSessionInfo = useCallback((): SessionInfo | null => {
    if (captureInstanceRef.current) {
      return captureInstanceRef.current.getSessionInfo();
    }
    return null;
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (captureInstanceRef.current) {
        captureInstanceRef.current.stopCapture();
      }
    };
  }, []);

  return {
    handleEditorMount,
    startCapture,
    stopCapture,
    getSessionInfo,
    isInitialized: captureInstanceRef.current !== null
  };
}
