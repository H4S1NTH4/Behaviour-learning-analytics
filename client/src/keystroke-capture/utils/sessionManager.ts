/**
 * Session Manager Utility
 *
 * Manages session state and persistence
 */

import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  sessionId: string;
  userId: string;
  assignmentId?: string;
  startTime: number;
  lastActivity: number;
  metadata?: Record<string, any>;
}

export interface SessionManagerOptions {
  userId: string;
  assignmentId?: string;
  sessionTimeout?: number; // milliseconds
  persistSession?: boolean;
  onSessionStart?: (session: SessionData) => void;
  onSessionEnd?: (session: SessionData) => void;
  debug?: boolean;
}

export class SessionManager {
  private session: SessionData | null = null;
  private options: SessionManagerOptions;
  private activityTimer: NodeJS.Timeout | null = null;
  private storageKey: string;

  constructor(options: SessionManagerOptions) {
    this.options = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes default
      persistSession: true,
      ...options
    };
    this.storageKey = `keystroke_session_${options.userId}`;

    // Try to restore previous session
    if (this.options.persistSession) {
      this.restoreSession();
    }

    // Start new session if none exists
    if (!this.session) {
      this.startSession();
    }
  }

  /**
   * Start a new session
   */
  public startSession(): SessionData {
    const sessionData: SessionData = {
      sessionId: uuidv4(),
      userId: this.options.userId,
      assignmentId: this.options.assignmentId,
      startTime: Date.now(),
      lastActivity: Date.now()
    };

    this.session = sessionData;

    this.log('Session started', { sessionId: sessionData.sessionId });

    if (this.options.persistSession) {
      this.saveSession();
    }

    if (this.options.onSessionStart) {
      this.options.onSessionStart(sessionData);
    }

    this.startActivityTimer();

    return sessionData;
  }

  /**
   * End the current session
   */
  public endSession(): void {
    if (!this.session) {
      return;
    }

    this.log('Session ended', { sessionId: this.session.sessionId });

    if (this.options.onSessionEnd) {
      this.options.onSessionEnd(this.session);
    }

    this.stopActivityTimer();

    if (this.options.persistSession) {
      this.clearSession();
    }

    this.session = null;
  }

  /**
   * Update last activity time
   */
  public updateActivity(): void {
    if (this.session) {
      this.session.lastActivity = Date.now();

      if (this.options.persistSession) {
        this.saveSession();
      }

      this.resetActivityTimer();
    }
  }

  /**
   * Get current session
   */
  public getSession(): SessionData | null {
    return this.session;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string | null {
    return this.session?.sessionId || null;
  }

  /**
   * Check if session is active
   */
  public isActive(): boolean {
    if (!this.session) {
      return false;
    }

    const timeSinceActivity = Date.now() - this.session.lastActivity;
    return timeSinceActivity < (this.options.sessionTimeout || 30 * 60 * 1000);
  }

  /**
   * Get session duration in milliseconds
   */
  public getSessionDuration(): number {
    if (!this.session) {
      return 0;
    }

    return Date.now() - this.session.startTime;
  }

  /**
   * Update session metadata
   */
  public updateMetadata(metadata: Record<string, any>): void {
    if (this.session) {
      this.session.metadata = {
        ...this.session.metadata,
        ...metadata
      };

      if (this.options.persistSession) {
        this.saveSession();
      }
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.session) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.session));
      } catch (error) {
        this.log('Failed to save session', { error });
      }
    }
  }

  /**
   * Restore session from localStorage
   */
  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const session: SessionData = JSON.parse(stored);

        // Check if session is still valid
        const timeSinceActivity = Date.now() - session.lastActivity;
        if (timeSinceActivity < (this.options.sessionTimeout || 30 * 60 * 1000)) {
          this.session = session;
          this.log('Session restored', { sessionId: session.sessionId });
          this.startActivityTimer();
        } else {
          this.log('Session expired, clearing');
          this.clearSession();
        }
      }
    } catch (error) {
      this.log('Failed to restore session', { error });
      this.clearSession();
    }
  }

  /**
   * Clear session from localStorage
   */
  private clearSession(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      this.log('Failed to clear session', { error });
    }
  }

  /**
   * Start activity timeout timer
   */
  private startActivityTimer(): void {
    if (this.options.sessionTimeout && this.options.sessionTimeout > 0) {
      this.resetActivityTimer();
    }
  }

  /**
   * Reset activity timeout timer
   */
  private resetActivityTimer(): void {
    this.stopActivityTimer();

    if (this.options.sessionTimeout && this.options.sessionTimeout > 0) {
      this.activityTimer = setTimeout(() => {
        this.log('Session timed out due to inactivity');
        this.endSession();
      }, this.options.sessionTimeout);
    }
  }

  /**
   * Stop activity timeout timer
   */
  private stopActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[SessionManager] ${message}`, data || '');
    }
  }
}

/**
 * Create a session manager instance
 */
export function createSessionManager(options: SessionManagerOptions): SessionManager {
  return new SessionManager(options);
}
