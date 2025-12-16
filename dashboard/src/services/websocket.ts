/**
 * WebSocket Service
 *
 * Real-time communication service for receiving live
 * behavioral state updates and interventions.
 *
 * @module websocket
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001';

/**
 * WebSocket event types
 */
export enum WSEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  BEHAVIORAL_STATE = 'behavioral_state',
  INTERVENTION = 'intervention',
  SESSION_UPDATE = 'session_update',
  METRICS_UPDATE = 'metrics_update',
}

/**
 * WebSocket message types
 */
export interface BehavioralStateMessage {
  sessionId: string;
  userId: string;
  timestamp: string;
  predictedState: string;
  confidence: number;
  cognitiveLoadEstimate: number;
  frustrationScore: number;
  engagementScore: number;
}

export interface InterventionMessage {
  sessionId: string;
  timestamp: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  reason?: string;
}

export interface SessionUpdateMessage {
  sessionId: string;
  status: string;
  metrics?: any;
}

/**
 * WebSocket Client Manager
 */
export class WebSocketClient {
  private socket: Socket | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to session updates
   */
  subscribeToSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe_session', sessionId);
    }
  }

  /**
   * Unsubscribe from session updates
   */
  unsubscribeFromSession(sessionId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe_session', sessionId);
    }
  }

  /**
   * Subscribe to user updates
   */
  subscribeToUser(userId: string): void {
    if (this.socket) {
      this.socket.emit('subscribe_user', userId);
    }
  }

  /**
   * Unsubscribe from user updates
   */
  unsubscribeFromUser(userId: string): void {
    if (this.socket) {
      this.socket.emit('unsubscribe_user', userId);
    }
  }

  /**
   * Listen for behavioral state updates
   */
  onBehavioralState(callback: (data: BehavioralStateMessage) => void): void {
    if (this.socket) {
      this.socket.on(WSEvent.BEHAVIORAL_STATE, callback);
    }
  }

  /**
   * Listen for intervention recommendations
   */
  onIntervention(callback: (data: InterventionMessage) => void): void {
    if (this.socket) {
      this.socket.on(WSEvent.INTERVENTION, callback);
    }
  }

  /**
   * Listen for session updates
   */
  onSessionUpdate(callback: (data: SessionUpdateMessage) => void): void {
    if (this.socket) {
      this.socket.on(WSEvent.SESSION_UPDATE, callback);
    }
  }

  /**
   * Listen for metrics updates
   */
  onMetricsUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(WSEvent.METRICS_UPDATE, callback);
    }
  }

  /**
   * Listen for connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): void {
    if (this.socket) {
      this.socket.on(WSEvent.CONNECT, () => callback(true));
      this.socket.on(WSEvent.DISCONNECT, () => callback(false));
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Remove specific event listener
   */
  removeListener(event: WSEvent, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on(WSEvent.CONNECT, () => {
      console.log('WebSocket connected');
    });

    this.socket.on(WSEvent.DISCONNECT, (reason: string) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on(WSEvent.ERROR, (error: Error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('WebSocket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
    });
  }
}

/**
 * Singleton instance
 */
let wsClientInstance: WebSocketClient | null = null;

/**
 * Get WebSocket client instance
 */
export function getWebSocketClient(): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}

/**
 * Export default instance
 */
export default getWebSocketClient();
