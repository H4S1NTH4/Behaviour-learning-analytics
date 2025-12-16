/**
 * WebSocket Hook
 *
 * Custom React hook for managing WebSocket connections
 * and real-time data updates.
 *
 * @module useWebSocket
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getWebSocketClient,
  BehavioralStateMessage,
  InterventionMessage,
  SessionUpdateMessage,
} from '../services/websocket';

interface UseWebSocketOptions {
  sessionId?: string;
  userId?: string;
  autoConnect?: boolean;
  onBehavioralState?: (data: BehavioralStateMessage) => void;
  onIntervention?: (data: InterventionMessage) => void;
  onSessionUpdate?: (data: SessionUpdateMessage) => void;
}

/**
 * useWebSocket Hook
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    sessionId,
    userId,
    autoConnect = true,
    onBehavioralState,
    onIntervention,
    onSessionUpdate,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastBehavioralState, setLastBehavioralState] =
    useState<BehavioralStateMessage | null>(null);
  const [lastIntervention, setLastIntervention] = useState<InterventionMessage | null>(
    null
  );
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsClient = getWebSocketClient();

  /**
   * Handle behavioral state updates
   */
  const handleBehavioralState = useCallback(
    (data: BehavioralStateMessage) => {
      setLastBehavioralState(data);
      onBehavioralState?.(data);
    },
    [onBehavioralState]
  );

  /**
   * Handle intervention updates
   */
  const handleIntervention = useCallback(
    (data: InterventionMessage) => {
      setLastIntervention(data);
      onIntervention?.(data);
    },
    [onIntervention]
  );

  /**
   * Handle session updates
   */
  const handleSessionUpdate = useCallback(
    (data: SessionUpdateMessage) => {
      onSessionUpdate?.(data);
    },
    [onSessionUpdate]
  );

  /**
   * Handle connection changes
   */
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      setReconnectAttempts(0);
    }
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    wsClient.connect();
  }, [wsClient]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, [wsClient]);

  /**
   * Setup WebSocket connection and subscriptions
   */
  useEffect(() => {
    if (!autoConnect) return;

    // Connect to WebSocket
    connect();

    // Setup connection status listener
    wsClient.onConnectionChange(handleConnectionChange);

    // Setup event listeners
    wsClient.onBehavioralState(handleBehavioralState);
    wsClient.onIntervention(handleIntervention);
    wsClient.onSessionUpdate(handleSessionUpdate);

    // Subscribe to session or user
    if (sessionId) {
      wsClient.subscribeToSession(sessionId);
    }
    if (userId) {
      wsClient.subscribeToUser(userId);
    }

    // Cleanup
    return () => {
      if (sessionId) {
        wsClient.unsubscribeFromSession(sessionId);
      }
      if (userId) {
        wsClient.unsubscribeFromUser(userId);
      }
      wsClient.removeAllListeners();
      disconnect();
    };
  }, [
    autoConnect,
    sessionId,
    userId,
    handleBehavioralState,
    handleIntervention,
    handleSessionUpdate,
    handleConnectionChange,
    connect,
    disconnect,
  ]);

  return {
    isConnected,
    lastBehavioralState,
    lastIntervention,
    reconnectAttempts,
    connect,
    disconnect,
  };
}

export default useWebSocket;
