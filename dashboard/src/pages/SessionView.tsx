/**
 * Session View Page
 *
 * Real-time view of a single learning session with detailed
 * behavioral analytics and intervention history.
 *
 * @module SessionView
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StateDisplay from '../components/StateDisplay';
import MetricsCard from '../components/MetricsCard';
import InterventionLog from '../components/InterventionLog';
import {
  BehavioralTimeline,
  StateDistribution,
  TypingSpeedChart,
} from '../components/ChartComponents';
import { useDashboardData } from '../hooks/useDashboardData';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * SessionView Component
 */
export const SessionView: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    currentState,
    behavioralHistory,
    sessionMetrics,
    loading,
    error,
  } = useDashboardData({ sessionId });

  const { isConnected } = useWebSocket({ sessionId });

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'interventions'>(
    'overview'
  );

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
    }
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="session-view loading">
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-view error">
        <div className="error-message">
          <h2>Error Loading Session</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-view">
      {/* Header */}
      <header className="session-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className="header-info">
            <h1>Session {sessionId}</h1>
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              {isConnected ? 'Live Updates' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`tab ${activeTab === 'interventions' ? 'active' : ''}`}
            onClick={() => setActiveTab('interventions')}
          >
            Interventions
          </button>
        </nav>
      </header>

      {/* Content */}
      <div className="session-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Current State */}
            <div className="card state-card">
              <h2>Current Behavioral State</h2>
              <StateDisplay currentState={currentState} isLive={isConnected} />
            </div>

            {/* Session Metrics */}
            <div className="card">
              <MetricsCard metrics={sessionMetrics} />
            </div>

            {/* State Distribution */}
            <div className="card">
              <h2>State Distribution</h2>
              <StateDistribution
                data={calculateStateDistribution(behavioralHistory)}
              />
            </div>

            {/* Quick Timeline */}
            <div className="card timeline-preview">
              <h2>Recent Activity</h2>
              <BehavioralTimeline data={behavioralHistory.slice(-20)} height={250} />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-view">
            {/* Full Timeline */}
            <div className="card">
              <h2>Behavioral State Timeline</h2>
              <BehavioralTimeline data={behavioralHistory} height={400} />
            </div>

            {/* Typing Speed Over Time */}
            <div className="card">
              <h2>Typing Speed Trend</h2>
              <TypingSpeedChart
                data={behavioralHistory.map((item: any) => ({
                  timestamp: item.timestamp,
                  typingSpeed: item.typingSpeed || 0,
                }))}
                height={300}
              />
            </div>

            {/* State History Table */}
            <div className="card">
              <h2>State History</h2>
              <StateHistoryTable data={behavioralHistory} />
            </div>
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="interventions-view">
            <div className="card">
              <h2>Intervention History</h2>
              <InterventionLog sessionId={sessionId} showFilters={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * State History Table Component
 */
interface StateHistoryTableProps {
  data: any[];
}

const StateHistoryTable: React.FC<StateHistoryTableProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="no-data">No state history available</p>;
  }

  return (
    <div className="state-history-table">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>State</th>
            <th>Confidence</th>
            <th>Cognitive Load</th>
            <th>Frustration</th>
            <th>Engagement</th>
          </tr>
        </thead>
        <tbody>
          {data.slice().reverse().slice(0, 50).map((item, index) => (
            <tr key={index}>
              <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
              <td>
                <span className={`state-badge state-${item.state}`}>
                  {formatStateName(item.state)}
                </span>
              </td>
              <td>{(item.confidence * 100).toFixed(1)}%</td>
              <td>{(item.cognitiveLoad * 100).toFixed(1)}%</td>
              <td>{(item.frustration * 100).toFixed(1)}%</td>
              <td>{(item.engagement * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper functions
function calculateStateDistribution(history: any[]): Array<{ name: string; value: number }> {
  const counts: Record<string, number> = {};

  history.forEach((state) => {
    counts[state.state] = (counts[state.state] || 0) + 1;
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
}

function formatStateName(state: string): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default SessionView;
