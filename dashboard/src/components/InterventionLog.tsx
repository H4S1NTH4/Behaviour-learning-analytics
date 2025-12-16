/**
 * Intervention Log Component
 *
 * Displays a chronological list of AI-recommended interventions
 * with filtering and export capabilities.
 *
 * @module InterventionLog
 */

import React, { useState, useEffect } from 'react';

export interface Intervention {
  id: string;
  timestamp: Date;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  reason?: string;
  actionTaken?: boolean;
  feedback?: string;
}

interface InterventionLogProps {
  sessionId?: string;
  maxItems?: number;
  showFilters?: boolean;
}

/**
 * Get icon for intervention type
 */
function getInterventionIcon(type: string): string {
  const icons: Record<string, string> = {
    hint: '💡',
    resource: '📚',
    break: '☕',
    encouragement: '✨',
    clarification: '❓',
    pacing: '⏱️',
    strategy: '🎯',
    attention: '⚠️',
  };
  return icons[type] || '📢';
}

/**
 * Get color for priority level
 */
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: '#4CAF50',
    medium: '#FFC107',
    high: '#FF9800',
    critical: '#F44336',
  };
  return colors[priority] || '#757575';
}

/**
 * InterventionLog Component
 */
export const InterventionLog: React.FC<InterventionLogProps> = ({
  sessionId,
  maxItems = 50,
  showFilters = true,
}) => {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (sessionId) {
      fetchInterventions(sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchInterventions = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/analytics/interventions/${sessionId}`);
      const data = await response.json();

      const formattedInterventions: Intervention[] = (data.interventions || []).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));

      setInterventions(formattedInterventions);
    } catch (error) {
      console.error('Error fetching interventions:', error);
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter interventions
  const filteredInterventions = interventions
    .filter((i) => filterType === 'all' || i.type === filterType)
    .filter((i) => filterPriority === 'all' || i.priority === filterPriority)
    .slice(0, maxItems);

  // Get unique types and priorities for filters
  const uniqueTypes = Array.from(new Set(interventions.map((i) => i.type)));
  const uniquePriorities = Array.from(new Set(interventions.map((i) => i.priority)));

  if (loading) {
    return (
      <div className="intervention-log">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading interventions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="intervention-log">
      {/* Filters */}
      {showFilters && interventions.length > 0 && (
        <div className="intervention-filters">
          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="priority-filter">Priority:</label>
            <select
              id="priority-filter"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {uniquePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Interventions List */}
      <div className="interventions-list">
        {filteredInterventions.length > 0 ? (
          filteredInterventions.map((intervention) => (
            <InterventionItem
              key={intervention.id}
              intervention={intervention}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <p>No interventions yet</p>
            <small>
              {interventions.length > 0
                ? 'Try adjusting filters'
                : 'Interventions will appear here when recommendations are made'}
            </small>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {interventions.length > 0 && (
        <div className="intervention-summary">
          <span>Total: {interventions.length}</span>
          {filteredInterventions.length !== interventions.length && (
            <span>Showing: {filteredInterventions.length}</span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Individual Intervention Item Component
 */
interface InterventionItemProps {
  intervention: Intervention;
}

const InterventionItem: React.FC<InterventionItemProps> = ({ intervention }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`intervention-item priority-${intervention.priority} ${
        expanded ? 'expanded' : ''
      }`}
      style={{
        borderLeftColor: getPriorityColor(intervention.priority),
      }}
    >
      <div className="intervention-header" onClick={() => setExpanded(!expanded)}>
        <span className="intervention-icon">
          {getInterventionIcon(intervention.type)}
        </span>
        <div className="intervention-main">
          <div className="intervention-type-time">
            <span className="intervention-type">{intervention.type}</span>
            <span className="intervention-time">
              {intervention.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <div className="intervention-message">{intervention.message}</div>
        </div>
        <span className={`priority-badge priority-${intervention.priority}`}>
          {intervention.priority}
        </span>
      </div>

      {expanded && (
        <div className="intervention-details">
          {intervention.reason && (
            <div className="detail-section">
              <strong>Reason:</strong>
              <p>{intervention.reason}</p>
            </div>
          )}
          {intervention.actionTaken !== undefined && (
            <div className="detail-section">
              <strong>Action Taken:</strong>
              <span className={intervention.actionTaken ? 'status-yes' : 'status-no'}>
                {intervention.actionTaken ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          {intervention.feedback && (
            <div className="detail-section">
              <strong>Feedback:</strong>
              <p>{intervention.feedback}</p>
            </div>
          )}
          <div className="detail-section">
            <small className="timestamp-full">
              {intervention.timestamp.toLocaleString()}
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionLog;
