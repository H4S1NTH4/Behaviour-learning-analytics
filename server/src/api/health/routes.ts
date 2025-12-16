/**
 * Health Check Routes
 *
 * Provides system health and status endpoints
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

/**
 * Create health check routes
 */
export function createHealthRoutes(pool: Pool): Router {
  const router = Router();

  /**
   * GET /api/v1/health
   * Basic health check
   */
  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
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
   * GET /api/v1/health/database
   * Database connection health check
   */
  router.get('/database', async (req: Request, res: Response): Promise<void> => {
    try {
      const startTime = Date.now();
      const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
      const responseTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        message: 'Database connection is healthy',
        data: {
          current_time: result.rows[0].current_time,
          db_version: result.rows[0].db_version,
          response_time_ms: responseTime
        }
      });
    } catch (error: any) {
      console.error('Database health check failed:', error);

      res.status(503).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/health/stats
   * System statistics
   */
  router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
      // Get database statistics
      const sessionCountQuery = 'SELECT COUNT(*) as count FROM coding_sessions';
      const eventCountQuery = 'SELECT COUNT(*) as count FROM keystroke_events';
      const featureCountQuery = 'SELECT COUNT(*) as count FROM keystroke_features';

      const [sessionResult, eventResult, featureResult] = await Promise.all([
        pool.query(sessionCountQuery),
        pool.query(eventCountQuery),
        pool.query(featureCountQuery)
      ]);

      // Get memory usage
      const memoryUsage = process.memoryUsage();

      res.status(200).json({
        success: true,
        data: {
          database: {
            total_sessions: parseInt(sessionResult.rows[0].count),
            total_events: parseInt(eventResult.rows[0].count),
            total_features: parseInt(featureResult.rows[0].count)
          },
          system: {
            uptime_seconds: process.uptime(),
            memory: {
              rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
              heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
              heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
            },
            node_version: process.version,
            platform: process.platform
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Stats fetch failed:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/health/ready
   * Readiness probe (for Kubernetes/Docker)
   */
  router.get('/ready', async (req: Request, res: Response): Promise<void> => {
    try {
      // Check database connection
      await pool.query('SELECT 1');

      res.status(200).json({
        success: true,
        message: 'Server is ready',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'Server not ready',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/health/live
   * Liveness probe (for Kubernetes/Docker)
   */
  router.get('/live', (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'Server is alive',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

export default createHealthRoutes;
