/**
 * API Client Service
 *
 * Centralized API client for all HTTP requests to the
 * behavioral analytics backend.
 *
 * @module api
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        response.statusText,
        errorData.message || 'An error occurred'
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${(error as Error).message}`);
  }
}

/**
 * Session API
 */
export const sessionAPI = {
  /**
   * Get session details by ID
   */
  getSession: async (sessionId: string) => {
    return fetchAPI<any>(`/analytics/session/${sessionId}`);
  },

  /**
   * Get behavioral history for a session
   */
  getBehavioralHistory: async (sessionId: string) => {
    return fetchAPI<any>(`/analytics/session/${sessionId}/behavioral-history`);
  },

  /**
   * Get session metrics
   */
  getSessionMetrics: async (sessionId: string) => {
    return fetchAPI<any>(`/analytics/session/${sessionId}/metrics`);
  },

  /**
   * Get interventions for a session
   */
  getInterventions: async (sessionId: string) => {
    return fetchAPI<any>(`/analytics/interventions/${sessionId}`);
  },
};

/**
 * User API
 */
export const userAPI = {
  /**
   * Get user summary analytics
   */
  getUserSummary: async (userId: string) => {
    return fetchAPI<any>(`/analytics/user/${userId}/summary`);
  },

  /**
   * Get all sessions for a user
   */
  getUserSessions: async (userId: string) => {
    return fetchAPI<any>(`/analytics/user/${userId}/sessions`);
  },

  /**
   * Get user progress metrics
   */
  getUserProgress: async (userId: string) => {
    return fetchAPI<any>(`/analytics/user/${userId}/progress`);
  },

  /**
   * Get learning patterns for a user
   */
  getUserPatterns: async (userId: string) => {
    return fetchAPI<any>(`/analytics/user/${userId}/patterns`);
  },

  /**
   * Get struggle hotspots for a user
   */
  getStruggleHotspots: async (userId: string) => {
    return fetchAPI<any>(`/analytics/user/${userId}/struggle-hotspots`);
  },
};

/**
 * Analytics API
 */
export const analyticsAPI = {
  /**
   * Get real-time analytics status
   */
  getStatus: async () => {
    return fetchAPI<any>('/analytics/status');
  },

  /**
   * Get aggregate statistics
   */
  getAggregateStats: async (startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    return fetchAPI<any>(`/analytics/aggregate?${params.toString()}`);
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  /**
   * Check API health
   */
  check: async () => {
    return fetchAPI<any>('/health');
  },
};

/**
 * Export all APIs
 */
export default {
  session: sessionAPI,
  user: userAPI,
  analytics: analyticsAPI,
  health: healthAPI,
};
