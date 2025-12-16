/**
 * Dashboard Data Hook
 *
 * Custom React hook for fetching and managing dashboard data
 * including behavioral states, metrics, and user analytics.
 *
 * @module useDashboardData
 */

import { useState, useEffect } from 'react';
import { sessionAPI, userAPI } from '../services/api';

interface DashboardDataOptions {
  sessionId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface BehavioralState {
  timestamp: Date;
  state: string;
  confidence: number;
  cognitiveLoad: number;
  frustration: number;
  engagement: number;
}

interface SessionMetrics {
  totalKeystrokes: number;
  typingSpeedWPM: number;
  errorCorrectionRate: number;
  pauseCount: number;
  averageDwellTime: number;
  sessionDuration: number;
  activeTime?: number;
  idleTime?: number;
}

interface StruggleHotspot {
  assignmentSection: string;
  struggleCount: number;
  averageDuration: number;
}

/**
 * useDashboardData Hook
 */
export function useDashboardData(options: DashboardDataOptions) {
  const {
    sessionId,
    userId,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [currentState, setCurrentState] = useState<BehavioralState | null>(null);
  const [behavioralHistory, setBehavioralHistory] = useState<BehavioralState[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [struggleHotspots, setStruggleHotspots] = useState<StruggleHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch session data
   */
  const fetchSessionData = async (sessionId: string) => {
    try {
      const data = await sessionAPI.getSession(sessionId);

      // Parse and set data
      if (data.metrics) {
        setSessionMetrics(data.metrics);
      }

      if (data.behavioralHistory && Array.isArray(data.behavioralHistory)) {
        const history: BehavioralState[] = data.behavioralHistory.map((item: any) => ({
          timestamp: new Date(item.timestamp),
          state: item.state || item.predictedState,
          confidence: item.confidence || 0,
          cognitiveLoad: item.cognitiveLoad || item.cognitiveLoadEstimate || 0,
          frustration: item.frustration || item.frustrationScore || 0,
          engagement: item.engagement || item.engagementScore || 0,
        }));

        setBehavioralHistory(history);

        // Set current state to the most recent
        if (history.length > 0) {
          setCurrentState(history[history.length - 1]);
        }
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session data';
      setError(errorMessage);
      console.error('Error fetching session data:', err);
    }
  };

  /**
   * Fetch user data
   */
  const fetchUserData = async (userId: string) => {
    try {
      const summaryData = await userAPI.getUserSummary(userId);

      if (summaryData.struggleHotspots) {
        setStruggleHotspots(summaryData.struggleHotspots);
      }

      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('Error fetching user data:', err);
    }
  };

  /**
   * Refresh data
   */
  const refresh = async () => {
    setLoading(true);
    try {
      if (sessionId) {
        await fetchSessionData(sessionId);
      }
      if (userId) {
        await fetchUserData(userId);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    refresh();
  }, [sessionId, userId]);

  /**
   * Auto-refresh data
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, sessionId, userId]);

  return {
    currentState,
    behavioralHistory,
    sessionMetrics,
    struggleHotspots,
    loading,
    error,
    refresh,
  };
}

export default useDashboardData;
