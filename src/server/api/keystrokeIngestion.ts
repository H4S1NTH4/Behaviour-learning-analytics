/**
 * Keystroke Data Ingestion API
 *
 * Server-side endpoint for receiving, validating, and storing
 * keystroke event data from the client-side capture module.
 *
 * @module KeystrokeIngestionAPI
 * @version 1.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod'; // Zod for runtime validation
import { Pool, PoolClient } from 'pg'; // PostgreSQL client
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

/**
 * Validation schema for keystroke events using Zod
 */
const KeystrokeEventSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  event_type: z.enum(['keyDown', 'keyUp']),
  timestamp_ms: z.number().positive(),
  key_code: z.string().min(1).max(50),
  key_value: z.string().max(50),
  cursor_offset: z.number().int().nonnegative(),
  modifier_state: z.object({
    shift: z.boolean(),
    ctrl: z.boolean(),
    alt: z.boolean(),
    meta: z.boolean()
  })
});

/**
 * Validation schema for batch payload
 */
const BatchPayloadSchema = z.object({
  session_id: z.string().uuid(),
  user_id: z.string().uuid(),
  assignment_id: z.string().optional(),
  events: z.array(KeystrokeEventSchema).min(1).max(500), // Max 500 events per batch
  metadata: z.object({
    batch_size: z.number().int().positive(),
    client_timestamp: z.number().positive(),
    browser: z.object({
      userAgent: z.string().optional(),
      language: z.string().optional(),
      platform: z.string().optional(),
      screenResolution: z.string().optional()
    }).optional(),
    session_end: z.boolean().optional()
  }).optional()
});

type BatchPayload = z.infer<typeof BatchPayloadSchema>;
type KeystrokeEvent = z.infer<typeof KeystrokeEventSchema>;

/**
 * Database connection pool configuration
 */
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number; // Max connections in pool
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

/**
 * Keystroke Ingestion Service
 *
 * Responsibilities:
 * - Validate incoming payloads
 * - Ensure session exists or create new
 * - Batch insert events into TimescaleDB
 * - Handle transaction failures gracefully
 */
export class KeystrokeIngestionService {
  private pool: Pool;

  constructor(dbConfig: DatabaseConfig) {
    this.pool = new Pool(dbConfig);

    // Monitor pool health
    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error', err);
    });
  }

  /**
   * Main ingestion handler
   */
  public async ingestBatch(payload: BatchPayload): Promise<{ success: boolean; message: string; eventCount: number }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Ensure session exists
      await this.ensureSessionExists(client, payload);

      // 2. Insert keystroke events in bulk
      const insertedCount = await this.insertKeystrokeEvents(client, payload.events);

      // 3. Update session end time if flagged
      if (payload.metadata?.session_end) {
        await this.updateSessionEndTime(client, payload.session_id);
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: `Successfully ingested ${insertedCount} events`,
        eventCount: insertedCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Ingestion error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ensure coding session exists in database
   */
  private async ensureSessionExists(client: PoolClient, payload: BatchPayload): Promise<void> {
    const checkQuery = `
      SELECT session_id FROM coding_sessions WHERE session_id = $1
    `;

    const result = await client.query(checkQuery, [payload.session_id]);

    if (result.rows.length === 0) {
      // Session doesn't exist, create it
      const insertQuery = `
        INSERT INTO coding_sessions (
          session_id,
          user_id,
          assignment_id,
          start_time,
          editor_type,
          browser_info
        ) VALUES ($1, $2, $3, NOW(), $4, $5)
        ON CONFLICT (session_id) DO NOTHING
      `;

      await client.query(insertQuery, [
        payload.session_id,
        payload.user_id,
        payload.assignment_id || null,
        'monaco', // Default editor type
        payload.metadata?.browser ? JSON.stringify(payload.metadata.browser) : null
      ]);

      console.log(`Created new session: ${payload.session_id}`);
    }
  }

  /**
   * Bulk insert keystroke events using COPY or multi-row INSERT
   */
  private async insertKeystrokeEvents(client: PoolClient, events: KeystrokeEvent[]): Promise<number> {
    if (events.length === 0) {
      return 0;
    }

    // Use parameterized multi-row INSERT for better performance
    const values: any[] = [];
    const placeholders: string[] = [];

    events.forEach((event, index) => {
      const baseIdx = index * 12;
      placeholders.push(
        `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, ` +
        `$${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, ` +
        `$${baseIdx + 11}, $${baseIdx + 12})`
      );

      values.push(
        event.session_id,
        event.user_id,
        event.timestamp_ms,
        event.event_type,
        event.key_code,
        event.key_value,
        event.cursor_offset,
        event.modifier_state.shift,
        event.modifier_state.ctrl,
        event.modifier_state.alt,
        event.modifier_state.meta,
        new Date() // server_timestamp
      );
    });

    const insertQuery = `
      INSERT INTO keystroke_events (
        session_id,
        user_id,
        timestamp_ms,
        event_type,
        key_code,
        key_value,
        cursor_offset,
        shift_pressed,
        ctrl_pressed,
        alt_pressed,
        meta_pressed,
        server_timestamp
      ) VALUES ${placeholders.join(', ')}
    `;

    const result = await client.query(insertQuery, values);

    return result.rowCount || 0;
  }

  /**
   * Update session end time when session closes
   */
  private async updateSessionEndTime(client: PoolClient, sessionId: string): Promise<void> {
    const updateQuery = `
      UPDATE coding_sessions
      SET end_time = NOW(),
          duration_seconds = EXTRACT(EPOCH FROM (NOW() - start_time))
      WHERE session_id = $1
        AND end_time IS NULL
    `;

    await client.query(updateQuery, [sessionId]);
  }

  /**
   * Health check query
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT 1');
      return result.rows.length === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Close database pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Express middleware for request validation
 */
export function validateKeystrokeBatch(req: Request, res: Response, next: NextFunction): void {
  try {
    const validatedPayload = BatchPayloadSchema.parse(req.body);
    req.body = validatedPayload; // Replace with validated data
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid request payload',
        errors: error.issues
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  }
}

/**
 * Express middleware for rate limiting (basic implementation)
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.headers['x-session-id'] as string;

  if (!sessionId || !uuidValidate(sessionId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid or missing X-Session-ID header'
    });
    return;
  }

  // TODO: Implement Redis-based rate limiting
  // For now, just validate session ID format
  next();
}

/**
 * Express route handler for POST /api/v1/keystrokes/log
 */
export function createIngestionHandler(service: KeystrokeIngestionService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const payload: BatchPayload = req.body;

      const result = await service.ingestBatch(payload);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          session_id: payload.session_id,
          events_ingested: result.eventCount,
          server_timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Ingestion handler error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to ingest keystroke data',
        error: error.message
      });
    }
  };
}

/**
 * Express route setup example
 */
export function setupKeystrokeRoutes(app: any, dbConfig: DatabaseConfig): void {
  const service = new KeystrokeIngestionService(dbConfig);

  // POST /api/v1/keystrokes/log
  app.post(
    '/api/v1/keystrokes/log',
    rateLimitMiddleware,
    validateKeystrokeBatch,
    createIngestionHandler(service)
  );

  // GET /api/v1/keystrokes/health
  app.get('/api/v1/keystrokes/health', async (req: Request, res: Response) => {
    const healthy = await service.healthCheck();

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      message: healthy ? 'Service healthy' : 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown handler
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing database connections...');
    await service.close();
    process.exit(0);
  });
}

/**
 * Standalone server example using Express
 */
export async function startIngestionServer(port: number, dbConfig: DatabaseConfig): Promise<void> {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '1mb' }));

  // Enable CORS for development
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Session-ID');
    next();
  });

  // Setup routes
  setupKeystrokeRoutes(app, dbConfig);

  // Start server
  app.listen(port, () => {
    console.log(`Keystroke ingestion API listening on port ${port}`);
  });
}

/**
 * Configuration loader from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'behavioral_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  };
}

// Export main service for testing
export default KeystrokeIngestionService;
