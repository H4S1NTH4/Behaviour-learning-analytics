/**
 * Keystroke Dynamics Data Capture Module
 *
 * High-fidelity client-side event logger for behavioral learning analytics.
 * Designed for integration with Monaco Editor in educational IDEs.
 *
 * @module KeystrokeCapture
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Core event data structure matching the SRS specification
 */
export interface KeystrokeEvent {
  session_id: string;
  user_id: string;
  event_type: 'keyDown' | 'keyUp';
  timestamp_ms: number;
  key_code: string;
  key_value: string;
  cursor_offset: number;
  modifier_state: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

/**
 * Configuration options for the capture module
 */
export interface CaptureConfig {
  apiEndpoint: string;
  batchSizeLimit: number;
  batchTimeLimit: number; // milliseconds
  enableConsent: boolean;
  userId: string;
  assignmentId?: string;
  debug?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<CaptureConfig> = {
  batchSizeLimit: 100,
  batchTimeLimit: 5000, // 5 seconds
  enableConsent: true,
  debug: false
};

/**
 * Main KeystrokeCapture class
 *
 * Responsibilities:
 * - Attach event listeners to Monaco Editor instance
 * - Buffer events in-memory with size and time-based triggers
 * - Transmit batched data asynchronously to server
 * - Handle transmission failures with retry logic
 * - Provide consent management interface
 */
export class KeystrokeCapture {
  private config: CaptureConfig;
  private sessionId: string;
  private buffer: KeystrokeEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private editor: any; // Monaco IStandaloneCodeEditor type
  private isCapturing: boolean = false;
  private consentGranted: boolean = false;
  private failedBatches: KeystrokeEvent[][] = [];

  constructor(config: CaptureConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = uuidv4();
    this.log('KeystrokeCapture initialized', { sessionId: this.sessionId });
  }

  /**
   * Initialize capture on a Monaco Editor instance
   * Should be called in the editor's onMount callback
   */
  public initialize(editor: any): void {
    if (!editor) {
      throw new Error('Monaco Editor instance is required');
    }

    this.editor = editor;

    // Check consent status
    if (this.config.enableConsent) {
      this.consentGranted = this.checkConsent();
      if (!this.consentGranted) {
        this.showConsentDialog();
        return;
      }
    } else {
      this.consentGranted = true;
    }

    this.startCapture();
  }

  /**
   * Begin capturing keystroke events
   */
  private startCapture(): void {
    if (!this.consentGranted) {
      this.log('Capture not started: consent not granted');
      return;
    }

    if (this.isCapturing) {
      this.log('Capture already active');
      return;
    }

    this.log('Starting keystroke capture');

    // Register Monaco Editor event listeners
    this.editor.onKeyDown((e: any) => this.handleKeyEvent(e, 'keyDown'));
    this.editor.onKeyUp((e: any) => this.handleKeyEvent(e, 'keyUp'));

    // Start batch timer
    this.resetBatchTimer();

    // Register beforeunload handler for session end
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    this.isCapturing = true;
  }

  /**
   * Stop capturing and flush remaining data
   */
  public stopCapture(): void {
    this.log('Stopping keystroke capture');

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush remaining events
    if (this.buffer.length > 0) {
      this.flushBuffer();
    }

    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.isCapturing = false;
  }

  /**
   * Handle keydown and keyup events from Monaco Editor
   */
  private handleKeyEvent(e: any, eventType: 'keyDown' | 'keyUp'): void {
    const event: KeystrokeEvent = {
      session_id: this.sessionId,
      user_id: this.config.userId,
      event_type: eventType,
      timestamp_ms: performance.now(),
      key_code: e.code || '',
      key_value: e.key || '',
      cursor_offset: this.getCursorOffset(),
      modifier_state: {
        shift: e.shiftKey || false,
        ctrl: e.ctrlKey || false,
        alt: e.altKey || false,
        meta: e.metaKey || false
      }
    };

    this.bufferEvent(event);
  }

  /**
   * Add event to buffer and check flush conditions
   */
  private bufferEvent(event: KeystrokeEvent): void {
    this.buffer.push(event);

    this.log('Event buffered', {
      eventType: event.event_type,
      keyCode: event.key_code,
      bufferSize: this.buffer.length
    });

    // Check if size limit reached
    if (this.buffer.length >= this.config.batchSizeLimit) {
      this.log('Size limit reached, flushing buffer');
      this.flushBuffer();
    }
  }

  /**
   * Calculate cursor offset (zero-indexed character position)
   */
  private getCursorOffset(): number {
    if (!this.editor) return 0;

    const position = this.editor.getPosition();
    if (!position) return 0;

    const model = this.editor.getModel();
    if (!model) return 0;

    return model.getOffsetAt(position);
  }

  /**
   * Reset the time-based batch timer
   */
  private resetBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      if (this.buffer.length > 0) {
        this.log('Time limit reached, flushing buffer');
        this.flushBuffer();
      }
      this.resetBatchTimer();
    }, this.config.batchTimeLimit);
  }

  /**
   * Flush buffer to server
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) {
      this.log('Buffer empty, nothing to flush');
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];

    this.log('Flushing batch', { count: batch.length });

    try {
      await this.transmitBatch(batch);
      this.log('Batch transmitted successfully');

      // Retry any previously failed batches
      if (this.failedBatches.length > 0) {
        await this.retryFailedBatches();
      }
    } catch (error) {
      this.log('Batch transmission failed', { error });
      this.failedBatches.push(batch);
    }
  }

  /**
   * Transmit batch to server via async HTTP POST
   */
  private async transmitBatch(batch: KeystrokeEvent[]): Promise<void> {
    const payload = {
      session_id: this.sessionId,
      user_id: this.config.userId,
      assignment_id: this.config.assignmentId,
      events: batch,
      metadata: {
        batch_size: batch.length,
        client_timestamp: Date.now(),
        browser: this.getBrowserInfo()
      }
    };

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
  }

  /**
   * Retry transmission of previously failed batches
   */
  private async retryFailedBatches(): Promise<void> {
    this.log('Retrying failed batches', { count: this.failedBatches.length });

    const retryQueue = [...this.failedBatches];
    this.failedBatches = [];

    for (const batch of retryQueue) {
      try {
        await this.transmitBatch(batch);
        this.log('Failed batch successfully retried', { size: batch.length });
      } catch (error) {
        this.log('Retry failed', { error });
        this.failedBatches.push(batch); // Re-add to failed queue
      }
    }
  }

  /**
   * Handle browser close/refresh - use sendBeacon for guaranteed transmission
   */
  private handleBeforeUnload = (): void => {
    this.log('beforeunload triggered, sending final batch');

    if (this.buffer.length === 0 && this.failedBatches.length === 0) {
      return;
    }

    const allEvents = [
      ...this.buffer,
      ...this.failedBatches.flat()
    ];

    const payload = JSON.stringify({
      session_id: this.sessionId,
      user_id: this.config.userId,
      assignment_id: this.config.assignmentId,
      events: allEvents,
      metadata: {
        batch_size: allEvents.length,
        client_timestamp: Date.now(),
        session_end: true
      }
    });

    // sendBeacon is reliable for page unload scenarios
    navigator.sendBeacon(this.config.apiEndpoint, payload);
  }

  /**
   * Check if user has granted consent
   */
  private checkConsent(): boolean {
    const consentKey = `keystroke_capture_consent_${this.config.userId}`;
    return localStorage.getItem(consentKey) === 'granted';
  }

  /**
   * Show consent dialog to user
   */
  private showConsentDialog(): void {
    // This is a basic implementation - should be replaced with proper UI
    const consent = confirm(
      'This educational platform collects keystroke timing data for research purposes to improve learning outcomes. ' +
      'Your data will be anonymized and used only for educational research. ' +
      'Do you consent to this data collection?'
    );

    if (consent) {
      this.grantConsent();
    }
  }

  /**
   * Record consent and start capture
   */
  private grantConsent(): void {
    const consentKey = `keystroke_capture_consent_${this.config.userId}`;
    localStorage.setItem(consentKey, 'granted');
    localStorage.setItem(`${consentKey}_timestamp`, new Date().toISOString());

    this.consentGranted = true;
    this.startCapture();
  }

  /**
   * Revoke consent and stop capture
   */
  public revokeConsent(): void {
    const consentKey = `keystroke_capture_consent_${this.config.userId}`;
    localStorage.removeItem(consentKey);
    localStorage.removeItem(`${consentKey}_timestamp`);

    this.consentGranted = false;
    this.stopCapture();
  }

  /**
   * Get browser metadata
   */
  private getBrowserInfo(): object {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`
    };
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[KeystrokeCapture] ${message}`, data || '');
    }
  }

  /**
   * Get current session information
   */
  public getSessionInfo(): object {
    return {
      sessionId: this.sessionId,
      userId: this.config.userId,
      isCapturing: this.isCapturing,
      consentGranted: this.consentGranted,
      bufferSize: this.buffer.length,
      failedBatches: this.failedBatches.length
    };
  }
}

/**
 * Factory function for easy initialization
 */
export function createKeystrokeCapture(config: CaptureConfig): KeystrokeCapture {
  return new KeystrokeCapture(config);
}

/**
 * React Hook for Monaco Editor integration
 */
export function useKeystrokeCapture(config: CaptureConfig) {
  let captureInstance: KeystrokeCapture | null = null;

  const handleEditorMount = (editor: any) => {
    captureInstance = createKeystrokeCapture(config);
    captureInstance.initialize(editor);
  };

  const stopCapture = () => {
    if (captureInstance) {
      captureInstance.stopCapture();
    }
  };

  return {
    handleEditorMount,
    stopCapture
  };
}
