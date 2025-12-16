/**
 * Keystroke API Routes
 *
 * Handles keystroke data ingestion endpoints
 */

import { Router, Request, Response } from 'express';
import { KeystrokeIngestionService } from '../../services/keystrokeIngestion.js';
import { Pool } from 'pg';

/**
 * Create keystroke routes
 */
export function createKeystrokeRoutes(pool: Pool): Router {
  const router = Router();
  const ingestionService = new KeystrokeIngestionService({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'behavioral_analytics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_SIZE || '20'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  /**
   * POST /api/v1/keystrokes/log
   * Ingest a batch of keystroke events
   */
  router.post('/log', async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body;
      const result = await ingestionService.ingestBatch(payload);

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
      console.error('Keystroke ingestion error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to ingest keystroke data',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/keystrokes/health
   * Check service health
   */
  router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
      const healthy = await ingestionService.healthCheck();

      res.status(healthy ? 200 : 503).json({
        success: healthy,
        message: healthy ? 'Service healthy' : 'Service unavailable',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/keystrokes/session/:sessionId/stats
   * Get statistics for a session
   */
  router.get('/session/:sessionId/stats', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const query = `
        SELECT
          COUNT(*) as total_events,
          COUNT(CASE WHEN event_type = 'keyDown' THEN 1 END) as key_downs,
          COUNT(CASE WHEN event_type = 'keyUp' THEN 1 END) as key_ups,
          MIN(server_timestamp) as first_event,
          MAX(server_timestamp) as last_event
        FROM keystroke_events
        WHERE session_id = $1
      `;

      const result = await pool.query(query, [sessionId]);

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching session stats:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch session statistics',
        error: error.message
      });
    }
  });

  return router;
}

export default createKeystrokeRoutes;
