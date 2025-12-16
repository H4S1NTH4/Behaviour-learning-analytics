/**
 * Feature Extraction Pipeline for Behavioral Analytics
 *
 * Transforms raw keystroke events into meaningful features for:
 * - Machine learning model training
 * - Behavioral profiling
 * - Real-time state inference
 * - Authentication systems
 *
 * @module FeatureExtraction
 * @version 1.0.0
 */

import { Pool } from 'pg';

/**
 * Raw keystroke event from database
 */
export interface KeystrokeEvent {
  event_id: string;
  session_id: string;
  user_id: string;
  timestamp_ms: number;
  server_timestamp: Date;
  event_type: 'keyDown' | 'keyUp';
  key_code: string;
  key_value: string;
  cursor_offset: number;
  shift_pressed: boolean;
  ctrl_pressed: boolean;
  alt_pressed: boolean;
  meta_pressed: boolean;
}

/**
 * Extracted feature set for a time window
 */
export interface KeystrokeFeatures {
  user_id: string;
  session_id: string;
  time_window_start: Date;
  time_window_end: Date;

  // Static Features (Timing)
  avg_dwell_time_ms: number;
  std_dwell_time_ms: number;
  min_dwell_time_ms: number;
  max_dwell_time_ms: number;
  median_dwell_time_ms: number;

  avg_flight_time_ms: number;
  std_flight_time_ms: number;
  min_flight_time_ms: number;
  max_flight_time_ms: number;

  avg_press_press_time_ms: number;
  std_press_press_time_ms: number;

  avg_release_release_time_ms: number;
  std_release_release_time_ms: number;

  // Dynamic Features (Behavioral)
  typing_speed_wpm: number;
  typing_speed_cpm: number;
  backspace_frequency: number;
  delete_frequency: number;
  error_correction_rate: number;
  arrow_key_usage: number;

  // Pause & Burst Detection
  pause_count: number;
  avg_pause_duration_ms: number;
  max_pause_duration_ms: number;
  burst_count: number;
  avg_burst_length: number;

  // Key Usage Patterns
  total_keystrokes: number;
  alphanumeric_ratio: number;
  special_char_ratio: number;
  whitespace_ratio: number;
  modifier_usage_ratio: number;

  // N-gram Features (Common digraphs/trigraphs)
  common_digraphs: Record<string, number>;
  common_trigraphs: Record<string, number>;

  // Metadata
  window_duration_seconds: number;
  event_count: number;
}

/**
 * Configuration for feature extraction
 */
export interface ExtractionConfig {
  windowSizeSeconds: number;
  pauseThresholdMs: number;
  burstThresholdMs: number;
  minEventsPerWindow: number;
  topNGrams: number;
}

/**
 * Feature Extraction Service
 */
export class FeatureExtractionService {
  private pool: Pool;
  private config: ExtractionConfig;

  constructor(pool: Pool, config?: Partial<ExtractionConfig>) {
    this.pool = pool;
    this.config = {
      windowSizeSeconds: config?.windowSizeSeconds || 30,
      pauseThresholdMs: config?.pauseThresholdMs || 2000,
      burstThresholdMs: config?.burstThresholdMs || 200,
      minEventsPerWindow: config?.minEventsPerWindow || 10,
      topNGrams: config?.topNGrams || 10
    };
  }

  /**
   * Extract features for a specific session and time window
   */
  public async extractFeaturesForWindow(
    sessionId: string,
    startTime: Date,
    endTime: Date
  ): Promise<KeystrokeFeatures | null> {
    const events = await this.fetchEventsForWindow(sessionId, startTime, endTime);

    if (events.length < this.config.minEventsPerWindow) {
      console.log(`Insufficient events (${events.length}) for feature extraction`);
      return null;
    }

    return this.computeFeatures(events, startTime, endTime);
  }

  /**
   * Extract features for all windows in a session
   */
  public async extractFeaturesForSession(sessionId: string): Promise<KeystrokeFeatures[]> {
    const sessionBounds = await this.getSessionBounds(sessionId);
    if (!sessionBounds) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const features: KeystrokeFeatures[] = [];
    let currentStart = sessionBounds.start;

    while (currentStart < sessionBounds.end) {
      const currentEnd = new Date(currentStart.getTime() + this.config.windowSizeSeconds * 1000);

      const windowFeatures = await this.extractFeaturesForWindow(
        sessionId,
        currentStart,
        currentEnd
      );

      if (windowFeatures) {
        features.push(windowFeatures);
      }

      currentStart = currentEnd;
    }

    return features;
  }

  /**
   * Batch extract features for multiple sessions and persist to database
   */
  public async batchExtractAndStore(sessionIds: string[]): Promise<number> {
    let totalWindows = 0;

    for (const sessionId of sessionIds) {
      try {
        const features = await this.extractFeaturesForSession(sessionId);
        await this.persistFeatures(features);
        totalWindows += features.length;
        console.log(`Extracted ${features.length} windows for session ${sessionId}`);
      } catch (error) {
        console.error(`Failed to extract features for session ${sessionId}:`, error);
      }
    }

    return totalWindows;
  }

  /**
   * Fetch events from database for a time window
   */
  private async fetchEventsForWindow(
    sessionId: string,
    startTime: Date,
    endTime: Date
  ): Promise<KeystrokeEvent[]> {
    const query = `
      SELECT
        event_id,
        session_id,
        user_id,
        timestamp_ms,
        server_timestamp,
        event_type,
        key_code,
        key_value,
        cursor_offset,
        shift_pressed,
        ctrl_pressed,
        alt_pressed,
        meta_pressed
      FROM keystroke_events
      WHERE session_id = $1
        AND server_timestamp >= $2
        AND server_timestamp < $3
      ORDER BY timestamp_ms ASC
    `;

    const result = await this.pool.query(query, [sessionId, startTime, endTime]);
    return result.rows;
  }

  /**
   * Get session start and end times
   */
  private async getSessionBounds(sessionId: string): Promise<{ start: Date; end: Date } | null> {
    const query = `
      SELECT
        start_time,
        COALESCE(end_time, NOW()) AS end_time
      FROM coding_sessions
      WHERE session_id = $1
    `;

    const result = await this.pool.query(query, [sessionId]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      start: result.rows[0].start_time,
      end: result.rows[0].end_time
    };
  }

  /**
   * Main feature computation function
   */
  private computeFeatures(
    events: KeystrokeEvent[],
    windowStart: Date,
    windowEnd: Date
  ): KeystrokeFeatures {
    const dwellTimes = this.calculateDwellTimes(events);
    const flightTimes = this.calculateFlightTimes(events);
    const pressPressIntervals = this.calculatePressPressIntervals(events);
    const releaseReleaseIntervals = this.calculateReleaseReleaseIntervals(events);
    const pauses = this.detectPauses(events);
    const bursts = this.detectBursts(events);
    const keyUsage = this.analyzeKeyUsage(events);
    const digraphs = this.extractDigraphs(events);
    const trigraphs = this.extractTrigraphs(events);

    return {
      user_id: events[0].user_id,
      session_id: events[0].session_id,
      time_window_start: windowStart,
      time_window_end: windowEnd,

      // Static Features
      avg_dwell_time_ms: this.mean(dwellTimes),
      std_dwell_time_ms: this.standardDeviation(dwellTimes),
      min_dwell_time_ms: Math.min(...dwellTimes),
      max_dwell_time_ms: Math.max(...dwellTimes),
      median_dwell_time_ms: this.median(dwellTimes),

      avg_flight_time_ms: this.mean(flightTimes),
      std_flight_time_ms: this.standardDeviation(flightTimes),
      min_flight_time_ms: Math.min(...flightTimes),
      max_flight_time_ms: Math.max(...flightTimes),

      avg_press_press_time_ms: this.mean(pressPressIntervals),
      std_press_press_time_ms: this.standardDeviation(pressPressIntervals),

      avg_release_release_time_ms: this.mean(releaseReleaseIntervals),
      std_release_release_time_ms: this.standardDeviation(releaseReleaseIntervals),

      // Dynamic Features
      typing_speed_wpm: this.calculateWPM(events, windowStart, windowEnd),
      typing_speed_cpm: this.calculateCPM(events, windowStart, windowEnd),
      backspace_frequency: this.calculateKeyFrequency(events, 'Backspace'),
      delete_frequency: this.calculateKeyFrequency(events, 'Delete'),
      error_correction_rate: this.calculateErrorCorrectionRate(events),
      arrow_key_usage: this.calculateArrowKeyUsage(events),

      // Pause & Burst
      pause_count: pauses.length,
      avg_pause_duration_ms: pauses.length > 0 ? this.mean(pauses) : 0,
      max_pause_duration_ms: pauses.length > 0 ? Math.max(...pauses) : 0,
      burst_count: bursts.length,
      avg_burst_length: bursts.length > 0 ? this.mean(bursts) : 0,

      // Key Usage
      total_keystrokes: keyUsage.total,
      alphanumeric_ratio: keyUsage.alphanumeric / keyUsage.total,
      special_char_ratio: keyUsage.specialChars / keyUsage.total,
      whitespace_ratio: keyUsage.whitespace / keyUsage.total,
      modifier_usage_ratio: keyUsage.modifiers / keyUsage.total,

      // N-grams
      common_digraphs: this.topN(digraphs, this.config.topNGrams),
      common_trigraphs: this.topN(trigraphs, this.config.topNGrams),

      // Metadata
      window_duration_seconds: (windowEnd.getTime() - windowStart.getTime()) / 1000,
      event_count: events.length
    };
  }

  /**
   * Calculate dwell times (key hold duration)
   */
  private calculateDwellTimes(events: KeystrokeEvent[]): number[] {
    const dwellTimes: number[] = [];
    const keyDownMap = new Map<string, number>();

    for (const event of events) {
      const key = event.key_code;

      if (event.event_type === 'keyDown') {
        keyDownMap.set(key, event.timestamp_ms);
      } else if (event.event_type === 'keyUp' && keyDownMap.has(key)) {
        const downTime = keyDownMap.get(key)!;
        dwellTimes.push(event.timestamp_ms - downTime);
        keyDownMap.delete(key);
      }
    }

    return dwellTimes;
  }

  /**
   * Calculate flight times (release-to-press intervals)
   */
  private calculateFlightTimes(events: KeystrokeEvent[]): number[] {
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

  /**
   * Calculate press-to-press intervals
   */
  private calculatePressPressIntervals(events: KeystrokeEvent[]): number[] {
    const intervals: number[] = [];
    let lastPressTime: number | null = null;

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        if (lastPressTime !== null) {
          intervals.push(event.timestamp_ms - lastPressTime);
        }
        lastPressTime = event.timestamp_ms;
      }
    }

    return intervals;
  }

  /**
   * Calculate release-to-release intervals
   */
  private calculateReleaseReleaseIntervals(events: KeystrokeEvent[]): number[] {
    const intervals: number[] = [];
    let lastReleaseTime: number | null = null;

    for (const event of events) {
      if (event.event_type === 'keyUp') {
        if (lastReleaseTime !== null) {
          intervals.push(event.timestamp_ms - lastReleaseTime);
        }
        lastReleaseTime = event.timestamp_ms;
      }
    }

    return intervals;
  }

  /**
   * Detect pauses (gaps in typing)
   */
  private detectPauses(events: KeystrokeEvent[]): number[] {
    const pauses: number[] = [];
    let lastEventTime: number | null = null;

    for (const event of events) {
      if (lastEventTime !== null) {
        const gap = event.timestamp_ms - lastEventTime;
        if (gap > this.config.pauseThresholdMs) {
          pauses.push(gap);
        }
      }
      lastEventTime = event.timestamp_ms;
    }

    return pauses;
  }

  /**
   * Detect typing bursts (rapid sequences)
   */
  private detectBursts(events: KeystrokeEvent[]): number[] {
    const bursts: number[] = [];
    let burstLength = 0;
    let lastEventTime: number | null = null;

    for (const event of events) {
      if (lastEventTime !== null) {
        const gap = event.timestamp_ms - lastEventTime;
        if (gap < this.config.burstThresholdMs) {
          burstLength++;
        } else {
          if (burstLength > 1) {
            bursts.push(burstLength);
          }
          burstLength = 1;
        }
      } else {
        burstLength = 1;
      }
      lastEventTime = event.timestamp_ms;
    }

    if (burstLength > 1) {
      bursts.push(burstLength);
    }

    return bursts;
  }

  /**
   * Analyze key usage patterns
   */
  private analyzeKeyUsage(events: KeystrokeEvent[]): {
    total: number;
    alphanumeric: number;
    specialChars: number;
    whitespace: number;
    modifiers: number;
  } {
    const counts = {
      total: 0,
      alphanumeric: 0,
      specialChars: 0,
      whitespace: 0,
      modifiers: 0
    };

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        counts.total++;

        const key = event.key_value;
        if (/^[a-zA-Z0-9]$/.test(key)) {
          counts.alphanumeric++;
        } else if (/^[\s\t\n]$/.test(key)) {
          counts.whitespace++;
        } else if (event.shift_pressed || event.ctrl_pressed || event.alt_pressed || event.meta_pressed) {
          counts.modifiers++;
        } else {
          counts.specialChars++;
        }
      }
    }

    return counts;
  }

  /**
   * Extract digraph frequencies (two-key sequences)
   */
  private extractDigraphs(events: KeystrokeEvent[]): Record<string, number> {
    const digraphs: Record<string, number> = {};
    let lastKey: string | null = null;

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        if (lastKey !== null) {
          const digraph = `${lastKey}-${event.key_code}`;
          digraphs[digraph] = (digraphs[digraph] || 0) + 1;
        }
        lastKey = event.key_code;
      }
    }

    return digraphs;
  }

  /**
   * Extract trigraph frequencies (three-key sequences)
   */
  private extractTrigraphs(events: KeystrokeEvent[]): Record<string, number> {
    const trigraphs: Record<string, number> = {};
    const keySequence: string[] = [];

    for (const event of events) {
      if (event.event_type === 'keyDown') {
        keySequence.push(event.key_code);

        if (keySequence.length === 3) {
          const trigraph = keySequence.join('-');
          trigraphs[trigraph] = (trigraphs[trigraph] || 0) + 1;
          keySequence.shift();
        }
      }
    }

    return trigraphs;
  }

  /**
   * Calculate typing speed in words per minute
   */
  private calculateWPM(events: KeystrokeEvent[], start: Date, end: Date): number {
    const keyDowns = events.filter(e => e.event_type === 'keyDown');
    const alphanumericKeys = keyDowns.filter(e => /^[a-zA-Z0-9]$/.test(e.key_value));

    const words = alphanumericKeys.length / 5; // Standard: 5 characters = 1 word
    const minutes = (end.getTime() - start.getTime()) / 60000;

    return minutes > 0 ? words / minutes : 0;
  }

  /**
   * Calculate typing speed in characters per minute
   */
  private calculateCPM(events: KeystrokeEvent[], start: Date, end: Date): number {
    const keyDowns = events.filter(e => e.event_type === 'keyDown');
    const minutes = (end.getTime() - start.getTime()) / 60000;

    return minutes > 0 ? keyDowns.length / minutes : 0;
  }

  /**
   * Calculate frequency of a specific key
   */
  private calculateKeyFrequency(events: KeystrokeEvent[], keyCode: string): number {
    const totalKeyDowns = events.filter(e => e.event_type === 'keyDown').length;
    const specificKeyCount = events.filter(
      e => e.event_type === 'keyDown' && e.key_code === keyCode
    ).length;

    return totalKeyDowns > 0 ? specificKeyCount / totalKeyDowns : 0;
  }

  /**
   * Calculate error correction rate (backspaces/deletes relative to total)
   */
  private calculateErrorCorrectionRate(events: KeystrokeEvent[]): number {
    const totalKeyDowns = events.filter(e => e.event_type === 'keyDown').length;
    const corrections = events.filter(
      e => e.event_type === 'keyDown' && (e.key_code === 'Backspace' || e.key_code === 'Delete')
    ).length;

    return totalKeyDowns > 0 ? corrections / totalKeyDowns : 0;
  }

  /**
   * Calculate arrow key usage rate
   */
  private calculateArrowKeyUsage(events: KeystrokeEvent[]): number {
    const totalKeyDowns = events.filter(e => e.event_type === 'keyDown').length;
    const arrowKeys = events.filter(
      e => e.event_type === 'keyDown' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key_code)
    ).length;

    return totalKeyDowns > 0 ? arrowKeys / totalKeyDowns : 0;
  }

  /**
   * Persist extracted features to database
   */
  private async persistFeatures(features: KeystrokeFeatures[]): Promise<void> {
    if (features.length === 0) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    features.forEach((feature, index) => {
      const baseIdx = index * 31;
      placeholders.push(
        `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, ` +
        `$${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, ` +
        `$${baseIdx + 11}, $${baseIdx + 12}, $${baseIdx + 13}, $${baseIdx + 14}, $${baseIdx + 15}, ` +
        `$${baseIdx + 16}, $${baseIdx + 17}, $${baseIdx + 18}, $${baseIdx + 19}, $${baseIdx + 20}, ` +
        `$${baseIdx + 21}, $${baseIdx + 22}, $${baseIdx + 23}, $${baseIdx + 24}, $${baseIdx + 25}, ` +
        `$${baseIdx + 26}, $${baseIdx + 27}, $${baseIdx + 28}, $${baseIdx + 29}, $${baseIdx + 30}, $${baseIdx + 31})`
      );

      values.push(
        feature.user_id,
        feature.session_id,
        feature.time_window_start,
        feature.time_window_end,
        feature.avg_dwell_time_ms,
        feature.std_dwell_time_ms,
        feature.avg_flight_time_ms,
        feature.std_flight_time_ms,
        feature.avg_press_press_time_ms,
        feature.typing_speed_wpm,
        feature.backspace_frequency,
        feature.delete_frequency,
        feature.error_correction_rate,
        feature.pause_count,
        feature.avg_pause_duration_ms,
        feature.burst_count,
        feature.total_keystrokes,
        feature.window_duration_seconds,
        feature.median_dwell_time_ms,
        feature.min_dwell_time_ms,
        feature.max_dwell_time_ms,
        feature.std_press_press_time_ms,
        feature.avg_release_release_time_ms,
        feature.std_release_release_time_ms,
        feature.min_flight_time_ms,
        feature.max_flight_time_ms,
        feature.max_pause_duration_ms,
        feature.avg_burst_length,
        feature.alphanumeric_ratio,
        feature.special_char_ratio,
        feature.whitespace_ratio
      );
    });

    const insertQuery = `
      INSERT INTO keystroke_features (
        user_id, session_id, time_window_start, time_window_end,
        avg_dwell_time_ms, std_dwell_time_ms, avg_flight_time_ms, std_flight_time_ms,
        avg_press_press_time_ms, typing_speed_wpm, backspace_frequency, delete_frequency,
        error_correction_rate, pause_count, avg_pause_duration_ms, burst_count,
        total_keystrokes, window_duration_seconds, median_dwell_time_ms, min_dwell_time_ms,
        max_dwell_time_ms, std_press_press_time_ms, avg_release_release_time_ms,
        std_release_release_time_ms, min_flight_time_ms, max_flight_time_ms,
        max_pause_duration_ms, avg_burst_length, alphanumeric_ratio, special_char_ratio,
        whitespace_ratio
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (user_id, session_id, time_window_start) DO UPDATE SET
        avg_dwell_time_ms = EXCLUDED.avg_dwell_time_ms,
        std_dwell_time_ms = EXCLUDED.std_dwell_time_ms,
        typing_speed_wpm = EXCLUDED.typing_speed_wpm
    `;

    await this.pool.query(insertQuery, values);
  }

  // Statistical helper functions

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private topN(record: Record<string, number>, n: number): Record<string, number> {
    const entries = Object.entries(record);
    entries.sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(entries.slice(0, n));
  }
}

/**
 * Scheduled feature extraction job
 */
export async function runFeatureExtractionJob(pool: Pool, config?: Partial<ExtractionConfig>): Promise<void> {
  const service = new FeatureExtractionService(pool, config);

  // Get sessions from last hour that don't have features extracted
  const query = `
    SELECT DISTINCT cs.session_id
    FROM coding_sessions cs
    LEFT JOIN keystroke_features kf ON cs.session_id = kf.session_id
    WHERE cs.start_time >= NOW() - INTERVAL '1 hour'
      AND kf.session_id IS NULL
  `;

  const result = await pool.query(query);
  const sessionIds = result.rows.map(row => row.session_id);

  console.log(`Found ${sessionIds.length} sessions for feature extraction`);

  const windowCount = await service.batchExtractAndStore(sessionIds);
  console.log(`Extracted features for ${windowCount} time windows`);
}

export default FeatureExtractionService;
