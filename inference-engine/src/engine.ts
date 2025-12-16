/**
 * Real-Time Behavioral State Inference Engine
 *
 * Provides real-time inference of student behavioral states using
 * the trained LSTM model. Includes WebSocket support for live updates.
 *
 * @module InferenceEngine
 * @version 1.0.0
 */

import { Pool } from 'pg';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { EventEmitter } from 'events';
import { BehavioralPrediction, InterventionRecommendation, FeatureVector } from './models/types.js';

/**
 * Configuration for inference engine
 */
export interface InferenceConfig {
  modelPath: string;
  scalerPath: string;
  metadataPath: string;
  pythonPath: string;
  confidenceThreshold: number;
  inferenceIntervalSeconds: number;
  enableWebSocket: boolean;
  wsPort?: number;
}

/**
 * Real-Time Inference Engine
 *
 * Continuously monitors student sessions and provides real-time
 * predictions of behavioral states using the LSTM model.
 */
export class BehavioralInferenceEngine extends EventEmitter {
  private pool: Pool;
  private config: InferenceConfig;
  private pythonProcess: ChildProcessWithoutNullStreams | null = null;
  private activeMonitoring: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor(pool: Pool, config: InferenceConfig) {
    super();
    this.pool = pool;
    this.config = config;
  }

  /**
   * Start the inference engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Inference engine already running');
      return;
    }

    console.log('Starting behavioral inference engine...');

    // Start Python inference process
    await this.startPythonInferenceProcess();

    this.isRunning = true;
    console.log('Inference engine started successfully');

    // Start monitoring active sessions
    this.startSessionMonitoring();
  }

  /**
   * Stop the inference engine
   */
  public async stop(): Promise<void> {
    console.log('Stopping inference engine...');

    // Stop all monitoring
    for (const timer of this.activeMonitoring.values()) {
      clearInterval(timer);
    }
    this.activeMonitoring.clear();

    // Close Python process
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }

    this.isRunning = false;
    console.log('Inference engine stopped');
  }

  /**
   * Start Python inference subprocess
   */
  private async startPythonInferenceProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pythonProcess = spawn(this.config.pythonPath, [
        'src/ml/inference_server.py',
        '--model', this.config.modelPath,
        '--scaler', this.config.scalerPath,
        '--metadata', this.config.metadataPath
      ]);

      this.pythonProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`[Python Inference] ${message}`);

        if (message.includes('ready')) {
          resolve();
        }
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Inference Error] ${data}`);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python inference process exited with code ${code}`);
        this.pythonProcess = null;
      });

      // Timeout if not ready in 30 seconds
      setTimeout(() => {
        if (!this.pythonProcess) {
          reject(new Error('Python inference process failed to start'));
        }
      }, 30000);
    });
  }

  /**
   * Start monitoring all active sessions
   */
  private async startSessionMonitoring(): Promise<void> {
    // Get all active sessions
    const query = `
      SELECT session_id, user_id
      FROM coding_sessions
      WHERE end_time IS NULL
        AND start_time >= NOW() - INTERVAL '24 hours'
    `;

    const result = await this.pool.query(query);

    for (const row of result.rows) {
      this.monitorSession(row.session_id, row.user_id);
    }

    // Check for new sessions every minute
    setInterval(() => {
      this.checkForNewSessions();
    }, 60000);
  }

  /**
   * Check for new active sessions
   */
  private async checkForNewSessions(): Promise<void> {
    const query = `
      SELECT session_id, user_id
      FROM coding_sessions
      WHERE end_time IS NULL
        AND start_time >= NOW() - INTERVAL '1 hour'
    `;

    const result = await this.pool.query(query);

    for (const row of result.rows) {
      if (!this.activeMonitoring.has(row.session_id)) {
        this.monitorSession(row.session_id, row.user_id);
      }
    }
  }

  /**
   * Monitor a specific session for behavioral state changes
   */
  private monitorSession(sessionId: string, userId: string): void {
    if (this.activeMonitoring.has(sessionId)) {
      return;
    }

    console.log(`Starting monitoring for session ${sessionId}`);

    const timer = setInterval(async () => {
      try {
        const prediction = await this.inferBehavioralState(sessionId, userId);

        if (prediction) {
          // Store prediction in database
          await this.storePrediction(prediction);

          // Emit event
          this.emit('prediction', prediction);

          // Check if intervention needed
          if (prediction.interventionRecommended) {
            const intervention = this.generateIntervention(prediction);
            this.emit('intervention_needed', { prediction, intervention });
          }
        }
      } catch (error) {
        console.error(`Error monitoring session ${sessionId}:`, error);
      }
    }, this.config.inferenceIntervalSeconds * 1000);

    this.activeMonitoring.set(sessionId, timer);
  }

  /**
   * Stop monitoring a session
   */
  public stopMonitoringSession(sessionId: string): void {
    const timer = this.activeMonitoring.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.activeMonitoring.delete(sessionId);
      console.log(`Stopped monitoring session ${sessionId}`);
    }
  }

  /**
   * Infer behavioral state for a session
   */
  public async inferBehavioralState(
    sessionId: string,
    userId: string
  ): Promise<BehavioralPrediction | null> {
    // Get recent feature windows (last 3 minutes = 6 windows of 30 seconds)
    const features = await this.getRecentFeatures(sessionId, 6);

    if (features.length < 6) {
      console.log(`Insufficient data for inference (${features.length} windows)`);
      return null;
    }

    // Call Python inference process
    const prediction = await this.callPythonInference(features);

    if (!prediction) {
      return null;
    }

    // Calculate derived metrics
    const cognitiveLoad = this.estimateCognitiveLoad(features);
    const frustration = this.estimateFrustration(features);
    const engagement = this.estimateEngagement(features);

    const result: BehavioralPrediction = {
      userId,
      sessionId,
      timestamp: new Date(),
      predictedState: prediction.predicted_state,
      confidence: prediction.confidence,
      probabilities: prediction.probabilities,
      cognitiveLoadEstimate: cognitiveLoad,
      frustrationScore: frustration,
      engagementScore: engagement,
      interventionRecommended: prediction.intervention_recommended,
      interventionType: prediction.intervention_recommended
        ? this.determineInterventionType(prediction.predicted_state)
        : undefined,
      featureVector: features[features.length - 1] // Latest window features
    };

    return result;
  }

  /**
   * Get recent feature windows from database
   */
  private async getRecentFeatures(sessionId: string, windowCount: number): Promise<FeatureVector[]> {
    const query = `
      SELECT
        avg_dwell_time_ms,
        std_dwell_time_ms,
        avg_flight_time_ms,
        std_flight_time_ms,
        avg_press_press_time_ms,
        typing_speed_wpm,
        backspace_frequency,
        delete_frequency,
        error_correction_rate,
        pause_count,
        avg_pause_duration_ms,
        burst_count,
        avg_burst_length,
        alphanumeric_ratio,
        special_char_ratio,
        whitespace_ratio,
        modifier_usage_ratio,
        arrow_key_usage,
        min_dwell_time_ms,
        max_dwell_time_ms,
        median_dwell_time_ms,
        max_pause_duration_ms,
        typing_speed_cpm,
        std_press_press_time_ms,
        min_flight_time_ms
      FROM keystroke_features
      WHERE session_id = $1
      ORDER BY time_window_start DESC
      LIMIT $2
    `;

    const result = await this.pool.query<FeatureVector>(query, [sessionId, windowCount]);
    return result.rows.reverse(); // Oldest to newest
  }

  /**
   * Call Python inference subprocess
   */
  private async callPythonInference(features: FeatureVector[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Python process not running'));
        return;
      }

      const requestId = Date.now().toString();
      const request = {
        id: requestId,
        features: features
      };

      // Send request
      this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');

      // Listen for response
      const onData = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          if (response.id === requestId) {
            this.pythonProcess!.stdout.off('data', onData);
            resolve(response.result);
          }
        } catch (error) {
          console.error('Error parsing Python response:', error);
        }
      };

      this.pythonProcess.stdout.on('data', onData);

      // Timeout after 5 seconds
      setTimeout(() => {
        this.pythonProcess!.stdout.off('data', onData);
        reject(new Error('Python inference timeout'));
      }, 5000);
    });
  }

  /**
   * Estimate cognitive load from features
   */
  private estimateCognitiveLoad(features: FeatureVector[]): number {
    const latestFeatures = features[features.length - 1];

    const errorWeight = latestFeatures.error_correction_rate * 0.3;
    const pauseWeight = Math.min(latestFeatures.pause_count / 10, 1) * 0.3;
    const speedWeight = (1 - Math.min(latestFeatures.typing_speed_wpm / 60, 1)) * 0.2;
    const backspaceWeight = latestFeatures.backspace_frequency * 0.2;

    return Math.min(errorWeight + pauseWeight + speedWeight + backspaceWeight, 1.0);
  }

  /**
   * Estimate frustration from features
   */
  private estimateFrustration(features: FeatureVector[]): number {
    const latestFeatures = features[features.length - 1];

    const deletionFrustration = (latestFeatures.backspace_frequency + latestFeatures.delete_frequency) * 0.4;
    const rhythmFrustration = Math.min(latestFeatures.std_dwell_time_ms / 200, 1) * 0.3;
    const burstFrustration = Math.min(latestFeatures.burst_count / 20, 1) * 0.3;

    return Math.min(deletionFrustration + rhythmFrustration + burstFrustration, 1.0);
  }

  /**
   * Estimate engagement from features
   */
  private estimateEngagement(features: FeatureVector[]): number {
    const latestFeatures = features[features.length - 1];

    const speedEngagement = Math.min(latestFeatures.typing_speed_wpm / 40, 1) * 0.4;
    const pauseEngagement = latestFeatures.pause_count > 2 && latestFeatures.pause_count < 8 ? 0.3 : 0;
    const contentEngagement = latestFeatures.alphanumeric_ratio * 0.3;

    return Math.min(speedEngagement + pauseEngagement + contentEngagement, 1.0);
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(prediction: BehavioralPrediction): Promise<void> {
    const query = `
      INSERT INTO behavioral_states (
        user_id,
        session_id,
        timestamp,
        state_classification,
        confidence_score,
        cognitive_load_estimate,
        frustration_score,
        engagement_score,
        intervention_triggered,
        intervention_type,
        feature_vector,
        model_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `;

    await this.pool.query(query, [
      prediction.userId,
      prediction.sessionId,
      prediction.timestamp,
      prediction.predictedState,
      prediction.confidence,
      prediction.cognitiveLoadEstimate,
      prediction.frustrationScore,
      prediction.engagementScore,
      prediction.interventionRecommended,
      prediction.interventionType || null,
      JSON.stringify(prediction.featureVector),
      '1.0'
    ]);
  }

  /**
   * Determine intervention type based on predicted state
   */
  private determineInterventionType(state: string): string {
    switch (state) {
      case 'unproductive_struggle':
        return 'hint_or_scaffold';
      case 'disengaged':
        return 'engagement_prompt';
      case 'productive_struggle':
        return 'encouragement';
      default:
        return 'none';
    }
  }

  /**
   * Generate intervention recommendation
   */
  private generateIntervention(prediction: BehavioralPrediction): InterventionRecommendation {
    switch (prediction.predictedState) {
      case 'unproductive_struggle':
        return {
          type: 'hint',
          priority: 'high',
          message: 'You seem stuck. Would you like a hint to help you progress?',
          data: { confidence: prediction.confidence }
        };

      case 'disengaged':
        return {
          type: 'break_suggestion',
          priority: 'medium',
          message: 'You\'ve been working for a while. Consider taking a short break!',
          data: { confidence: prediction.confidence }
        };

      case 'productive_struggle':
        return {
          type: 'scaffold',
          priority: 'low',
          message: 'You\'re making great progress! Keep working through this challenge.',
          data: { confidence: prediction.confidence }
        };

      default:
        return {
          type: 'resource',
          priority: 'low',
          message: 'You\'re doing well! Here are some additional resources if you need them.',
          data: { confidence: prediction.confidence }
        };
    }
  }

  /**
   * Get current monitoring status
   */
  public getMonitoringStatus(): {
    isRunning: boolean;
    activeSessions: number;
    monitoredSessionIds: string[];
  } {
    return {
      isRunning: this.isRunning,
      activeSessions: this.activeMonitoring.size,
      monitoredSessionIds: Array.from(this.activeMonitoring.keys())
    };
  }
}

/**
 * Factory function to create inference engine
 */
export function createInferenceEngine(pool: Pool, config: InferenceConfig): BehavioralInferenceEngine {
  return new BehavioralInferenceEngine(pool, config);
}

export default BehavioralInferenceEngine;
