/**
 * Application Configuration
 *
 * Centralized configuration for the dashboard application.
 *
 * @module config
 */

// Environment variables with defaults
const config = {
  // API Configuration
  api: {
    baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
    timeout: parseInt((import.meta as any).env?.VITE_API_TIMEOUT || '30000', 10),
  },

  // WebSocket Configuration
  websocket: {
    url: (import.meta as any).env?.VITE_WS_URL || 'http://localhost:3001',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  },

  // Dashboard Settings
  dashboard: {
    refreshInterval: parseInt((import.meta as any).env?.VITE_REFRESH_INTERVAL || '30000', 10),
    maxHistoryPoints: parseInt((import.meta as any).env?.VITE_MAX_HISTORY_POINTS || '100', 10),
    autoRefresh: (import.meta as any).env?.VITE_AUTO_REFRESH === 'true',
  },

  // Chart Settings
  charts: {
    defaultHeight: 300,
    animationDuration: 300,
    colors: {
      primary: '#2196F3',
      secondary: '#4CAF50',
      danger: '#F44336',
      warning: '#FFC107',
      info: '#00BCD4',
    },
  },

  // Application Settings
  app: {
    name: 'Behavioral Analytics Dashboard',
    version: '1.0.0',
    environment: (import.meta as any).env?.MODE || 'development',
  },
};

export default config;
