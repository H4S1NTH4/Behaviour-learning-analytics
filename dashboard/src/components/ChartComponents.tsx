/**
 * Reusable Chart Components
 *
 * Pre-configured chart components for behavioral analytics visualization
 * using Recharts library.
 *
 * @module ChartComponents
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Color schemes
export const STATE_COLORS = {
  flow: '#4CAF50',
  productive_struggle: '#FFC107',
  unproductive_struggle: '#FF5722',
  disengaged: '#9E9E9E',
};

export const METRIC_COLORS = {
  cognitiveLoad: '#2196F3',
  frustration: '#F44336',
  engagement: '#4CAF50',
  confidence: '#9C27B0',
};

// Types
interface TimeSeriesDataPoint {
  timestamp: Date | number;
  [key: string]: any;
}

interface DistributionDataPoint {
  name: string;
  value: number;
}

/**
 * Behavioral Timeline Chart
 * Shows cognitive load, frustration, and engagement over time
 */
interface BehavioralTimelineProps {
  data: TimeSeriesDataPoint[];
  height?: number;
}

export const BehavioralTimeline: React.FC<BehavioralTimelineProps> = ({
  data,
  height = 300,
}) => {
  if (data.length === 0) {
    return <div className="chart-empty">No timeline data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
          stroke="#757575"
        />
        <YAxis domain={[0, 1]} stroke="#757575" />
        <Tooltip
          labelFormatter={(ts) => new Date(ts).toLocaleString()}
          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="cognitiveLoad"
          stackId="1"
          stroke={METRIC_COLORS.cognitiveLoad}
          fill={METRIC_COLORS.cognitiveLoad}
          fillOpacity={0.6}
          name="Cognitive Load"
        />
        <Area
          type="monotone"
          dataKey="frustration"
          stackId="2"
          stroke={METRIC_COLORS.frustration}
          fill={METRIC_COLORS.frustration}
          fillOpacity={0.6}
          name="Frustration"
        />
        <Area
          type="monotone"
          dataKey="engagement"
          stackId="3"
          stroke={METRIC_COLORS.engagement}
          fill={METRIC_COLORS.engagement}
          fillOpacity={0.6}
          name="Engagement"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * State Distribution Pie Chart
 * Shows the distribution of behavioral states
 */
interface StateDistributionProps {
  data: DistributionDataPoint[];
  height?: number;
}

export const StateDistribution: React.FC<StateDistributionProps> = ({
  data,
  height = 300,
}) => {
  if (data.length === 0) {
    return <div className="chart-empty">No distribution data available</div>;
  }

  const renderLabel = (entry: DistributionDataPoint) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATE_COLORS[entry.name as keyof typeof STATE_COLORS] || '#757575'}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Typing Speed Line Chart
 * Shows typing speed over time
 */
interface TypingSpeedChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
}

export const TypingSpeedChart: React.FC<TypingSpeedChartProps> = ({
  data,
  height = 300,
}) => {
  if (data.length === 0) {
    return <div className="chart-empty">No typing speed data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
          stroke="#757575"
        />
        <YAxis
          label={{ value: 'WPM', angle: -90, position: 'insideLeft' }}
          stroke="#757575"
        />
        <Tooltip
          labelFormatter={(ts) => new Date(ts).toLocaleString()}
          formatter={(value: number) => `${value.toFixed(1)} WPM`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="typingSpeed"
          stroke="#2196F3"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Typing Speed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Struggle Hotspots Bar Chart
 * Shows areas where students struggled most
 */
interface StruggleHotspotsProps {
  data: Array<{
    assignmentSection: string;
    struggleCount: number;
    averageDuration: number;
  }>;
  height?: number;
}

export const StruggleHotspots: React.FC<StruggleHotspotsProps> = ({
  data,
  height = 300,
}) => {
  if (data.length === 0) {
    return <div className="chart-empty">No struggle hotspot data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="assignmentSection" stroke="#757575" />
        <YAxis stroke="#757575" />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}
        />
        <Legend />
        <Bar
          dataKey="struggleCount"
          fill="#FF5722"
          name="Struggle Events"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="averageDuration"
          fill="#FFC107"
          name="Avg Duration (min)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Error Rate Trend Chart
 * Shows error correction rate over time
 */
interface ErrorRateTrendProps {
  data: TimeSeriesDataPoint[];
  height?: number;
}

export const ErrorRateTrend: React.FC<ErrorRateTrendProps> = ({ data, height = 300 }) => {
  if (data.length === 0) {
    return <div className="chart-empty">No error rate data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
          stroke="#757575"
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          stroke="#757575"
        />
        <Tooltip
          labelFormatter={(ts) => new Date(ts).toLocaleString()}
          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="errorRate"
          stroke="#F44336"
          fill="#F44336"
          fillOpacity={0.6}
          name="Error Rate"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * Confidence Trend Line Chart
 * Shows prediction confidence over time
 */
interface ConfidenceTrendProps {
  data: TimeSeriesDataPoint[];
  height?: number;
}

export const ConfidenceTrend: React.FC<ConfidenceTrendProps> = ({
  data,
  height = 300,
}) => {
  if (data.length === 0) {
    return <div className="chart-empty">No confidence data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
          stroke="#757575"
        />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          stroke="#757575"
        />
        <Tooltip
          labelFormatter={(ts) => new Date(ts).toLocaleString()}
          formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="confidence"
          stroke={METRIC_COLORS.confidence}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name="Prediction Confidence"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default {
  BehavioralTimeline,
  StateDistribution,
  TypingSpeedChart,
  StruggleHotspots,
  ErrorRateTrend,
  ConfidenceTrend,
};
