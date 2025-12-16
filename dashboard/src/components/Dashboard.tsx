/**
 * Learning Analytics Dashboard
 *
 * Real-time visualization of student behavioral states,
 * keystroke dynamics, and learning progress.
 *
 * @module Dashboard
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import '../styles/Dashboard.css';

// Type definitions
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
}

interface StruggleHotspot {
  assignmentSection: string;
  struggleCount: number;
  averageDuration: number;
}

/**
 * Main Dashboard Component
 */
export const Dashboard: React.FC<{ userId: string; sessionId?: string }> = ({ userId, sessionId }) => {
  // State management
  const [behavioralHistory, setBehavioralHistory] = useState<BehavioralState[]>([]);
  const [currentState, setCurrentState] = useState<BehavioralState | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics | null>(null);
  const [struggleHotspots, setStruggleHotspots] = useState<StruggleHotspot[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const ws = io('http://localhost:3001');

    ws.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);

      // Subscribe to session updates
      if (sessionId) {
        ws.emit('subscribe_session', sessionId);
      }
    });

    ws.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for behavioral state updates
    ws.on('behavioral_state', (data: any) => {
      const newState: BehavioralState = {
        timestamp: new Date(data.timestamp),
        state: data.predictedState,
        confidence: data.confidence,
        cognitiveLoad: data.cognitiveLoadEstimate,
        frustration: data.frustrationScore,
        engagement: data.engagementScore
      };

      setCurrentState(newState);
      setBehavioralHistory(prev => [...prev.slice(-29), newState]); // Keep last 30 states
    });

    // Listen for intervention recommendations
    ws.on('intervention', (data: any) => {
      showInterventionNotification(data);
    });

    setSocket(ws);

    return () => {
      ws.disconnect();
    };
  }, [sessionId]);

  // Fetch historical data
  useEffect(() => {
    if (sessionId) {
      fetchSessionData(sessionId);
    } else {
      fetchUserSummary(userId);
    }
  }, [userId, sessionId]);

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/session/${sessionId}`);
      const data = await response.json();

      setSessionMetrics(data.metrics);
      setBehavioralHistory(data.behavioralHistory || []);
    } catch (error) {
      console.error('Error fetching session data:', error);
    }
  };

  const fetchUserSummary = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/user/${userId}/summary`);
      const data = await response.json();

      setStruggleHotspots(data.struggleHotspots || []);
    } catch (error) {
      console.error('Error fetching user summary:', error);
    }
  };

  const showInterventionNotification = (intervention: any) => {
    // Implementation depends on notification library (e.g., react-toastify)
    console.log('Intervention recommended:', intervention);
  };

  // Color schemes
  const STATE_COLORS = {
    flow: '#4CAF50',
    productive_struggle: '#FFC107',
    unproductive_struggle: '#FF5722',
    disengaged: '#9E9E9E'
  };

  const METRIC_COLORS = {
    cognitiveLoad: '#2196F3',
    frustration: '#F44336',
    engagement: '#4CAF50'
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Behavioral Learning Analytics</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Current State Card */}
        <div className="card current-state-card">
          <h2>Current State</h2>
          {currentState ? (
            <div className="state-display">
              <div
                className="state-badge"
                style={{ backgroundColor: STATE_COLORS[currentState.state as keyof typeof STATE_COLORS] }}
              >
                {formatStateName(currentState.state)}
              </div>
              <div className="confidence-bar">
                <div className="confidence-label">Confidence: {(currentState.confidence * 100).toFixed(1)}%</div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${currentState.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="no-data">Waiting for data...</p>
          )}
        </div>

        {/* Session Metrics Card */}
        <div className="card metrics-card">
          <h2>Session Metrics</h2>
          {sessionMetrics ? (
            <div className="metrics-grid">
              <MetricItem label="Keystrokes" value={sessionMetrics.totalKeystrokes} />
              <MetricItem label="Typing Speed" value={`${sessionMetrics.typingSpeedWPM.toFixed(1)} WPM`} />
              <MetricItem label="Error Rate" value={`${(sessionMetrics.errorCorrectionRate * 100).toFixed(1)}%`} />
              <MetricItem label="Pauses" value={sessionMetrics.pauseCount} />
              <MetricItem label="Dwell Time" value={`${sessionMetrics.averageDwellTime.toFixed(0)} ms`} />
              <MetricItem label="Duration" value={formatDuration(sessionMetrics.sessionDuration)} />
            </div>
          ) : (
            <p className="no-data">No metrics available</p>
          )}
        </div>

        {/* Behavioral State Timeline */}
        <div className="card timeline-card">
          <h2>Behavioral State Timeline</h2>
          {behavioralHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={behavioralHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis domain={[0, 1]} />
                <Tooltip
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  formatter={(value: number) => (value * 100).toFixed(1) + '%'}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cognitiveLoad"
                  stackId="1"
                  stroke={METRIC_COLORS.cognitiveLoad}
                  fill={METRIC_COLORS.cognitiveLoad}
                  name="Cognitive Load"
                />
                <Area
                  type="monotone"
                  dataKey="frustration"
                  stackId="2"
                  stroke={METRIC_COLORS.frustration}
                  fill={METRIC_COLORS.frustration}
                  name="Frustration"
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stackId="3"
                  stroke={METRIC_COLORS.engagement}
                  fill={METRIC_COLORS.engagement}
                  name="Engagement"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No timeline data</p>
          )}
        </div>

        {/* State Distribution */}
        <div className="card distribution-card">
          <h2>State Distribution</h2>
          {behavioralHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={calculateStateDistribution(behavioralHistory)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {calculateStateDistribution(behavioralHistory).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATE_COLORS[entry.name as keyof typeof STATE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No distribution data</p>
          )}
        </div>

        {/* Struggle Hotspots */}
        {struggleHotspots.length > 0 && (
          <div className="card hotspots-card">
            <h2>Struggle Hotspots</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={struggleHotspots}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assignmentSection" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="struggleCount" fill="#FF5722" name="Struggle Count" />
                <Bar dataKey="averageDuration" fill="#FFC107" name="Avg Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Interventions Log */}
        <div className="card interventions-card">
          <h2>Recent Interventions</h2>
          <InterventionLog sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Item Component
 */
const MetricItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="metric-item">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
  </div>
);

/**
 * Intervention Log Component
 */
const InterventionLog: React.FC<{ sessionId?: string }> = ({ sessionId }) => {
  const [interventions, setInterventions] = useState<any[]>([]);

  useEffect(() => {
    if (sessionId) {
      fetchInterventions(sessionId);
    }
  }, [sessionId]);

  const fetchInterventions = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/interventions/${sessionId}`);
      const data = await response.json();
      setInterventions(data.interventions || []);
    } catch (error) {
      console.error('Error fetching interventions:', error);
    }
  };

  return (
    <div className="interventions-list">
      {interventions.length > 0 ? (
        interventions.map((intervention, index) => (
          <div key={index} className={`intervention-item priority-${intervention.priority}`}>
            <div className="intervention-time">
              {new Date(intervention.timestamp).toLocaleTimeString()}
            </div>
            <div className="intervention-type">{intervention.type}</div>
            <div className="intervention-message">{intervention.message}</div>
          </div>
        ))
      ) : (
        <p className="no-data">No interventions</p>
      )}
    </div>
  );
};

// Helper functions

function formatStateName(state: string): string {
  return state.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function calculateStateDistribution(history: BehavioralState[]): Array<{ name: string; value: number }> {
  const counts: Record<string, number> = {};

  history.forEach(state => {
    counts[state.state] = (counts[state.state] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value
  }));
}

function renderPieLabel(entry: any): string {
  return `${formatStateName(entry.name)}: ${entry.value}`;
}

export default Dashboard;
