/**
 * Continuous Passive Authentication (CPA) System
 *
 * Uses keystroke dynamics for continuous, non-intrusive user verification
 * throughout coding sessions to ensure academic integrity.
 *
 * @module ContinuousAuthentication
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { EventEmitter } from 'events';

/**
 * Biometric profile for a user
 */
export interface BiometricProfile {
  userId: string;
  enrollmentStatus: 'training' | 'active' | 'inactive';
  trainingSessionsCount: number;
  lastUpdated: Date;

  // Statistical distributions of typing features
  dwellTimeDistribution: FeatureDistribution;
  flightTimeDistribution: FeatureDistribution;
  digraphTimings: Record<string, FeatureDistribution>;
  trigraphTimings: Record<string, FeatureDistribution>;

  // Authentication thresholds
  similarityThreshold: number;
  anomalyThreshold: number;
}

/**
 * Feature distribution (mean, std, min, max)
 */
export interface FeatureDistribution {
  mean: number;
  std: number;
  min: number;
  max: number;
  samples: number;
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  sessionId: string;
  userId: string;
  timestamp: Date;
  similarityScore: number;
  riskScore: number;
  thresholdExceeded: boolean;
  actionTaken: 'none' | 'flagged' | 'challenge' | 'locked';
  challengeResult?: 'passed' | 'failed' | 'pending';
  details: string;
}

/**
 * Configuration for CPA system
 */
export interface CPAConfig {
  minEnrollmentSessions: number;
  minEventsPerWindow: number;
  authenticationIntervalSeconds: number;
  similarityThreshold: number;
  anomalyThreshold: number;
  riskScoreThreshold: number;
  enableAutomaticChallenge: boolean;
  enableAutomaticLock: boolean;
}

/**
 * Continuous Passive Authentication Service
 */
export class ContinuousAuthenticationService extends EventEmitter {
  private pool: Pool;
  private config: CPAConfig;
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();
  private profileCache: Map<string, BiometricProfile> = new Map();

  constructor(pool: Pool, config?: Partial<CPAConfig>) {
    super();
    this.pool = pool;
    this.config = {
      minEnrollmentSessions: config?.minEnrollmentSessions || 5,
      minEventsPerWindow: config?.minEventsPerWindow || 100,
      authenticationIntervalSeconds: config?.authenticationIntervalSeconds || 60,
      similarityThreshold: config?.similarityThreshold || 0.75,
      anomalyThreshold: config?.anomalyThreshold || 0.3,
      riskScoreThreshold: config?.riskScoreThreshold || 0.7,
      enableAutomaticChallenge: config?.enableAutomaticChallenge ?? true,
      enableAutomaticLock: config?.enableAutomaticLock ?? false
    };
  }

  /**
   * Enroll a user by building their biometric profile
   */
  public async enrollUser(userId: string, sessionIds: string[]): Promise<BiometricProfile> {
    console.log(`Enrolling user ${userId} with ${sessionIds.length} sessions`);

    // Fetch keystroke data from enrollment sessions
    const keystrokeData = await this.fetchKeystrokeData(userId, sessionIds);

    if (keystrokeData.length < this.config.minEventsPerWindow * sessionIds.length) {
      throw new Error('Insufficient data for enrollment');
    }

    // Calculate feature distributions
    const dwellTimes = this.calculateDwellTimes(keystrokeData);
    const flightTimes = this.calculateFlightTimes(keystrokeData);
    const digraphs = this.calculateDigraphTimings(keystrokeData);
    const trigraphs = this.calculateTrigraphTimings(keystrokeData);

    const profile: BiometricProfile = {
      userId,
      enrollmentStatus: sessionIds.length >= this.config.minEnrollmentSessions ? 'active' : 'training',
      trainingSessionsCount: sessionIds.length,
      lastUpdated: new Date(),
      dwellTimeDistribution: this.computeDistribution(dwellTimes),
      flightTimeDistribution: this.computeDistribution(flightTimes),
      digraphTimings: digraphs,
      trigraphTimings: trigraphs,
      similarityThreshold: this.config.similarityThreshold,
      anomalyThreshold: this.config.anomalyThreshold
    };

    // Store profile in database
    await this.storeProfile(profile);

    // Cache profile
    this.profileCache.set(userId, profile);

    console.log(`User ${userId} enrolled successfully (status: ${profile.enrollmentStatus})`);

    return profile;
  }

  /**
   * Authenticate current typing behavior against user profile
   */
  public async authenticate(sessionId: string, userId: string): Promise<AuthenticationResult> {
    // Get user profile
    let profile = this.profileCache.get(userId);
    if (!profile) {
      profile = await this.loadProfile(userId);
      if (!profile) {
        throw new Error(`No biometric profile found for user ${userId}`);
      }
      this.profileCache.set(userId, profile);
    }

    if (profile.enrollmentStatus !== 'active') {
      return {
        sessionId,
        userId,
        timestamp: new Date(),
        similarityScore: 1.0,
        riskScore: 0.0,
        thresholdExceeded: false,
        actionTaken: 'none',
        details: 'User still in training phase'
      };
    }

    // Get recent keystroke data from current session
    const recentData = await this.fetchRecentKeystrokeData(sessionId, 120); // Last 2 minutes

    if (recentData.length < this.config.minEventsPerWindow) {
      return {
        sessionId,
        userId,
        timestamp: new Date(),
        similarityScore: 1.0,
        riskScore: 0.0,
        thresholdExceeded: false,
        actionTaken: 'none',
        details: 'Insufficient recent data for authentication'
      };
    }

    // Calculate current features
    const currentDwellTimes = this.calculateDwellTimes(recentData);
    const currentFlightTimes = this.calculateFlightTimes(recentData);
    const currentDigraphs = this.calculateDigraphTimings(recentData);

    // Compute similarity scores
    const dwellSimilarity = this.computeSimilarity(
      this.computeDistribution(currentDwellTimes),
      profile.dwellTimeDistribution
    );

    const flightSimilarity = this.computeSimilarity(
      this.computeDistribution(currentFlightTimes),
      profile.flightTimeDistribution
    );

    const digraphSimilarity = this.computeDigraphSimilarity(
      currentDigraphs,
      profile.digraphTimings
    );

    // Weighted average similarity
    const overallSimilarity = (
      dwellSimilarity * 0.4 +
      flightSimilarity * 0.4 +
      digraphSimilarity * 0.2
    );

    // Calculate risk score (inverse of similarity)
    const riskScore = 1 - overallSimilarity;

    // Determine if threshold exceeded
    const thresholdExceeded = riskScore > this.config.riskScoreThreshold;

    // Decide action
    let actionTaken: 'none' | 'flagged' | 'challenge' | 'locked' = 'none';

    if (thresholdExceeded) {
      actionTaken = 'flagged';

      if (this.config.enableAutomaticChallenge && riskScore > 0.8) {
        actionTaken = 'challenge';
        // Trigger challenge (e.g., re-enter password, answer security question)
        this.emit('challenge_required', { sessionId, userId, riskScore });
      }

      if (this.config.enableAutomaticLock && riskScore > 0.9) {
        actionTaken = 'locked';
        // Lock session immediately
        this.emit('session_locked', { sessionId, userId, riskScore });
      }

      // Emit alert for instructor review
      this.emit('authentication_alert', { sessionId, userId, riskScore });
    }

    const result: AuthenticationResult = {
      sessionId,
      userId,
      timestamp: new Date(),
      similarityScore: overallSimilarity,
      riskScore,
      thresholdExceeded,
      actionTaken,
      details: `Dwell: ${dwellSimilarity.toFixed(3)}, Flight: ${flightSimilarity.toFixed(3)}, Digraph: ${digraphSimilarity.toFixed(3)}`
    };

    // Store authentication event
    await this.storeAuthenticationEvent(result);

    return result;
  }

  /**
   * Start continuous monitoring of a session
   */
  public startMonitoring(sessionId: string, userId: string): void {
    if (this.activeMonitoring.has(sessionId)) {
      return;
    }

    console.log(`Starting CPA monitoring for session ${sessionId}`);

    const timer = setInterval(async () => {
      try {
        const result = await this.authenticate(sessionId, userId);

        if (result.thresholdExceeded) {
          console.warn(`Authentication anomaly detected for session ${sessionId}:`, result);
        }
      } catch (error) {
        console.error(`Error during CPA for session ${sessionId}:`, error);
      }
    }, this.config.authenticationIntervalSeconds * 1000);

    this.activeMonitoring.set(sessionId, timer);
  }

  /**
   * Stop monitoring a session
   */
  public stopMonitoring(sessionId: string): void {
    const timer = this.activeMonitoring.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.activeMonitoring.delete(sessionId);
      console.log(`Stopped CPA monitoring for session ${sessionId}`);
    }
  }

  /**
   * Update user profile with new session data (incremental learning)
   */
  public async updateProfile(userId: string, newSessionId: string): Promise<void> {
    const profile = this.profileCache.get(userId) || await this.loadProfile(userId);

    if (!profile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    // Fetch new session data
    const newData = await this.fetchKeystrokeData(userId, [newSessionId]);

    // Recalculate distributions with exponential moving average
    const alpha = 0.1; // Weight for new data

    const newDwellTimes = this.calculateDwellTimes(newData);
    const newDwellDist = this.computeDistribution(newDwellTimes);

    profile.dwellTimeDistribution = this.mergeDistributions(
      profile.dwellTimeDistribution,
      newDwellDist,
      alpha
    );

    // Similar for flight times, digraphs, trigraphs...

    profile.trainingSessionsCount++;
    profile.lastUpdated = new Date();

    if (profile.enrollmentStatus === 'training' && profile.trainingSessionsCount >= this.config.minEnrollmentSessions) {
      profile.enrollmentStatus = 'active';
    }

    await this.storeProfile(profile);
    this.profileCache.set(userId, profile);

    console.log(`Updated profile for user ${userId}`);
  }

  // Database operations

  private async fetchKeystrokeData(userId: string, sessionIds: string[]): Promise<any[]> {
    const query = `
      SELECT
        timestamp_ms,
        event_type,
        key_code,
        key_value
      FROM keystroke_events
      WHERE user_id = $1
        AND session_id = ANY($2)
        AND event_type IN ('keyDown', 'keyUp')
      ORDER BY timestamp_ms ASC
    `;

    const result = await this.pool.query(query, [userId, sessionIds]);
    return result.rows;
  }

  private async fetchRecentKeystrokeData(sessionId: string, seconds: number): Promise<any[]> {
    const query = `
      SELECT
        timestamp_ms,
        event_type,
        key_code,
        key_value
      FROM keystroke_events
      WHERE session_id = $1
        AND server_timestamp >= NOW() - INTERVAL '${seconds} seconds'
        AND event_type IN ('keyDown', 'keyUp')
      ORDER BY timestamp_ms ASC
    `;

    const result = await this.pool.query(query, [sessionId]);
    return result.rows;
  }

  private async storeProfile(profile: BiometricProfile): Promise<void> {
    const query = `
      INSERT INTO biometric_profiles (
        user_id,
        enrollment_status,
        training_sessions_count,
        last_updated,
        dwell_time_distribution,
        flight_time_distribution,
        digraph_timings,
        trigraph_timings,
        similarity_threshold,
        anomaly_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        enrollment_status = EXCLUDED.enrollment_status,
        training_sessions_count = EXCLUDED.training_sessions_count,
        last_updated = EXCLUDED.last_updated,
        dwell_time_distribution = EXCLUDED.dwell_time_distribution,
        flight_time_distribution = EXCLUDED.flight_time_distribution,
        digraph_timings = EXCLUDED.digraph_timings,
        trigraph_timings = EXCLUDED.trigraph_timings
    `;

    await this.pool.query(query, [
      profile.userId,
      profile.enrollmentStatus,
      profile.trainingSessionsCount,
      profile.lastUpdated,
      JSON.stringify(profile.dwellTimeDistribution),
      JSON.stringify(profile.flightTimeDistribution),
      JSON.stringify(profile.digraphTimings),
      JSON.stringify(profile.trigraphTimings),
      profile.similarityThreshold,
      profile.anomalyThreshold
    ]);
  }

  private async loadProfile(userId: string): Promise<BiometricProfile | undefined> {
    const query = `
      SELECT * FROM biometric_profiles WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return undefined;
    }

    const row = result.rows[0];

    return {
      userId: row.user_id,
      enrollmentStatus: row.enrollment_status,
      trainingSessionsCount: row.training_sessions_count,
      lastUpdated: row.last_updated,
      dwellTimeDistribution: JSON.parse(row.dwell_time_distribution),
      flightTimeDistribution: JSON.parse(row.flight_time_distribution),
      digraphTimings: JSON.parse(row.digraph_timings),
      trigraphTimings: JSON.parse(row.trigraph_timings),
      similarityThreshold: row.similarity_threshold,
      anomalyThreshold: row.anomaly_threshold
    };
  }

  private async storeAuthenticationEvent(result: AuthenticationResult): Promise<void> {
    const query = `
      INSERT INTO authentication_events (
        session_id,
        user_id,
        timestamp,
        similarity_score,
        risk_score,
        threshold_exceeded,
        action_taken
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await this.pool.query(query, [
      result.sessionId,
      result.userId,
      result.timestamp,
      result.similarityScore,
      result.riskScore,
      result.thresholdExceeded,
      result.actionTaken
    ]);
  }

  // Feature calculation methods

  private calculateDwellTimes(events: any[]): number[] {
    const dwellTimes: number[] = [];
    const keyDownMap = new Map<string, number>();

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        keyDownMap.set(event.key_code, event.timestamp_ms);
      } else if (event.event_type === 'keyUp' && keyDownMap.has(event.key_code)) {
        const downTime = keyDownMap.get(event.key_code)!;
        dwellTimes.push(event.timestamp_ms - downTime);
        keyDownMap.delete(event.key_code);
      }
    }

    return dwellTimes;
  }

  private calculateFlightTimes(events: any[]): number[] {
    const flightTimes: number[] = [];
    let lastReleaseTime: number | null = null;

    for (const event of events) {
      if (event.event_type === 'keyUp') {
        lastReleaseTime = event.timestamp_ms;
      } else if (event.event_type === 'keyDown' && lastReleaseTime !== null) {
        flightTimes.push(event.timestamp_ms - lastReleaseTime);
      }
    }

    return flightTimes;
  }

  private calculateDigraphTimings(events: any[]): Record<string, FeatureDistribution> {
    const digraphTimings: Record<string, number[]> = {};
    let lastKeyDown: { key: string; time: number } | null = null;

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        if (lastKeyDown) {
          const digraph = `${lastKeyDown.key}-${event.key_code}`;
          const timing = event.timestamp_ms - lastKeyDown.time;

          if (!digraphTimings[digraph]) {
            digraphTimings[digraph] = [];
          }
          digraphTimings[digraph].push(timing);
        }

        lastKeyDown = { key: event.key_code, time: event.timestamp_ms };
      }
    }

    // Convert to distributions
    const distributions: Record<string, FeatureDistribution> = {};
    for (const [digraph, timings] of Object.entries(digraphTimings)) {
      if (timings.length >= 3) {
        distributions[digraph] = this.computeDistribution(timings);
      }
    }

    return distributions;
  }

  private calculateTrigraphTimings(events: any[]): Record<string, FeatureDistribution> {
    // Similar to digraphs but for 3-key sequences
    return {};
  }

  // Statistical methods

  private computeDistribution(values: number[]): FeatureDistribution {
    if (values.length === 0) {
      return { mean: 0, std: 0, min: 0, max: 0, samples: 0 };
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: Math.min(...values),
      max: Math.max(...values),
      samples: values.length
    };
  }

  private computeSimilarity(dist1: FeatureDistribution, dist2: FeatureDistribution): number {
    // Use Bhattacharyya coefficient for similarity
    if (dist1.samples === 0 || dist2.samples === 0) {
      return 0;
    }

    // Simplified: use mean and std difference
    const meanDiff = Math.abs(dist1.mean - dist2.mean);
    const stdDiff = Math.abs(dist1.std - dist2.std);

    // Normalize differences
    const meanSimilarity = 1 - Math.min(meanDiff / Math.max(dist1.mean, dist2.mean, 1), 1);
    const stdSimilarity = 1 - Math.min(stdDiff / Math.max(dist1.std, dist2.std, 1), 1);

    return (meanSimilarity + stdSimilarity) / 2;
  }

  private computeDigraphSimilarity(
    current: Record<string, FeatureDistribution>,
    profile: Record<string, FeatureDistribution>
  ): number {
    const commonDigraphs = Object.keys(current).filter(d => d in profile);

    if (commonDigraphs.length === 0) {
      return 0.5; // Neutral if no common digraphs
    }

    const similarities = commonDigraphs.map(digraph =>
      this.computeSimilarity(current[digraph], profile[digraph])
    );

    return similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
  }

  private mergeDistributions(
    old: FeatureDistribution,
    newDist: FeatureDistribution,
    alpha: number
  ): FeatureDistribution {
    return {
      mean: old.mean * (1 - alpha) + newDist.mean * alpha,
      std: old.std * (1 - alpha) + newDist.std * alpha,
      min: Math.min(old.min, newDist.min),
      max: Math.max(old.max, newDist.max),
      samples: old.samples + newDist.samples
    };
  }
}

export default ContinuousAuthenticationService;
