/**
 * User View Page
 *
 * Aggregated analytics for a user across all sessions,
 * showing learning patterns, progress, and struggle areas.
 *
 * @module UserView
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StruggleHotspots } from '../components/ChartComponents';
import { useDashboardData } from '../hooks/useDashboardData';

interface SessionSummary {
  sessionId: string;
  startTime: Date;
  duration: number;
  totalKeystrokes: number;
  avgTypingSpeed: number;
  dominantState: string;
}

interface ProgressMetrics {
  totalSessions: number;
  totalTime: number;
  avgSessionDuration: number;
  flowStatePercentage: number;
  improvementTrend: number;
}

/**
 * UserView Component
 */
export const UserView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const {
    struggleHotspots,
    loading,
    error,
  } = useDashboardData({ userId });

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [progressMetrics, setProgressMetrics] = useState<ProgressMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'patterns'>('overview');

  useEffect(() => {
    if (!userId) {
      navigate('/');
    } else {
      fetchUserSessions(userId);
      fetchProgressMetrics(userId);
    }
  }, [userId, navigate]);

  const fetchUserSessions = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/user/${userId}/sessions`);
      const data = await response.json();

      const formattedSessions: SessionSummary[] = (data.sessions || []).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
      }));

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
    }
  };

  const fetchProgressMetrics = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/user/${userId}/progress`);
      const data = await response.json();
      setProgressMetrics(data.progress);
    } catch (error) {
      console.error('Error fetching progress metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="user-view loading">
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-view error">
        <div className="error-message">
          <h2>Error Loading User Data</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-view">
      {/* Header */}
      <header className="user-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className="header-info">
            <h1>User Analytics</h1>
            <p className="user-id">User ID: {userId}</p>
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
            className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </button>
          <button
            className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            Learning Patterns
          </button>
        </nav>
      </header>

      {/* Content */}
      <div className="user-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Progress Summary */}
            <div className="card progress-card">
              <h2>Progress Summary</h2>
              {progressMetrics ? (
                <div className="progress-metrics">
                  <ProgressMetric
                    icon="📚"
                    label="Total Sessions"
                    value={progressMetrics.totalSessions.toString()}
                  />
                  <ProgressMetric
                    icon="⏱️"
                    label="Total Learning Time"
                    value={formatDuration(progressMetrics.totalTime)}
                  />
                  <ProgressMetric
                    icon="📊"
                    label="Avg Session Duration"
                    value={formatDuration(progressMetrics.avgSessionDuration)}
                  />
                  <ProgressMetric
                    icon="✨"
                    label="Flow State %"
                    value={`${progressMetrics.flowStatePercentage.toFixed(1)}%`}
                  />
                  <ProgressMetric
                    icon="📈"
                    label="Improvement Trend"
                    value={`${progressMetrics.improvementTrend > 0 ? '+' : ''}${progressMetrics.improvementTrend.toFixed(1)}%`}
                    status={progressMetrics.improvementTrend > 0 ? 'positive' : 'negative'}
                  />
                </div>
              ) : (
                <p className="no-data">No progress data available</p>
              )}
            </div>

            {/* Struggle Hotspots */}
            <div className="card">
              <h2>Struggle Areas</h2>
              {struggleHotspots && struggleHotspots.length > 0 ? (
                <StruggleHotspots data={struggleHotspots} height={300} />
              ) : (
                <p className="no-data">No struggle hotspots identified</p>
              )}
            </div>

            {/* Recent Sessions Preview */}
            <div className="card">
              <h2>Recent Sessions</h2>
              <RecentSessionsList sessions={sessions.slice(0, 5)} />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-view">
            <div className="card">
              <h2>All Sessions</h2>
              <SessionsTable sessions={sessions} onSelectSession={(id) => navigate(`/session/${id}`)} />
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="patterns-view">
            <div className="card">
              <h2>Learning Patterns Analysis</h2>
              <LearningPatterns userId={userId!} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Progress Metric Component
 */
interface ProgressMetricProps {
  icon: string;
  label: string;
  value: string;
  status?: 'positive' | 'negative' | 'neutral';
}

const ProgressMetric: React.FC<ProgressMetricProps> = ({
  icon,
  label,
  value,
  status = 'neutral',
}) => (
  <div className={`progress-metric status-${status}`}>
    <div className="metric-icon">{icon}</div>
    <div className="metric-info">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  </div>
);

/**
 * Recent Sessions List Component
 */
interface RecentSessionsListProps {
  sessions: SessionSummary[];
}

const RecentSessionsList: React.FC<RecentSessionsListProps> = ({ sessions }) => {
  const navigate = useNavigate();

  if (sessions.length === 0) {
    return <p className="no-data">No sessions available</p>;
  }

  return (
    <div className="recent-sessions-list">
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className="session-item"
          onClick={() => navigate(`/session/${session.sessionId}`)}
        >
          <div className="session-info">
            <span className="session-time">
              {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
            </span>
            <span className="session-duration">{formatDuration(session.duration)}</span>
          </div>
          <div className="session-metrics">
            <span>{session.totalKeystrokes} keystrokes</span>
            <span className={`state-badge state-${session.dominantState}`}>
              {formatStateName(session.dominantState)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Sessions Table Component
 */
interface SessionsTableProps {
  sessions: SessionSummary[];
  onSelectSession: (sessionId: string) => void;
}

const SessionsTable: React.FC<SessionsTableProps> = ({ sessions, onSelectSession }) => {
  if (sessions.length === 0) {
    return <p className="no-data">No sessions available</p>;
  }

  return (
    <div className="sessions-table">
      <table>
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Date</th>
            <th>Duration</th>
            <th>Keystrokes</th>
            <th>Avg Speed (WPM)</th>
            <th>Dominant State</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.sessionId}>
              <td className="session-id">{session.sessionId.substring(0, 8)}...</td>
              <td>{session.startTime.toLocaleDateString()}</td>
              <td>{formatDuration(session.duration)}</td>
              <td>{session.totalKeystrokes.toLocaleString()}</td>
              <td>{session.avgTypingSpeed.toFixed(1)}</td>
              <td>
                <span className={`state-badge state-${session.dominantState}`}>
                  {formatStateName(session.dominantState)}
                </span>
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={() => onSelectSession(session.sessionId)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Learning Patterns Component
 */
interface LearningPatternsProps {
  userId: string;
}

const LearningPatterns: React.FC<LearningPatternsProps> = ({ userId }) => {
  const [patterns, setPatterns] = useState<any>(null);

  useEffect(() => {
    fetchPatterns(userId);
  }, [userId]);

  const fetchPatterns = async (userId: string) => {
    try {
      const response = await fetch(`/api/v1/analytics/user/${userId}/patterns`);
      const data = await response.json();
      setPatterns(data.patterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
    }
  };

  if (!patterns) {
    return <p className="no-data">Loading patterns...</p>;
  }

  return (
    <div className="learning-patterns">
      <div className="pattern-item">
        <h3>Peak Performance Times</h3>
        <p>{patterns.peakTimes || 'Not enough data'}</p>
      </div>
      <div className="pattern-item">
        <h3>Average Session Length</h3>
        <p>{formatDuration(patterns.avgSessionLength || 0)}</p>
      </div>
      <div className="pattern-item">
        <h3>Most Common Struggle State</h3>
        <p>{formatStateName(patterns.commonStruggleState || 'none')}</p>
      </div>
      <div className="pattern-item">
        <h3>Recommended Break Interval</h3>
        <p>{patterns.breakInterval || 'Every 45 minutes'}</p>
      </div>
    </div>
  );
};

// Helper functions
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

function formatStateName(state: string): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default UserView;
