/**
 * Analytics API Routes
 *
 * Handles feature extraction and analytics endpoints
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { FeatureExtractionService } from '../../services/featureExtraction.js';
import { ContinuousAuthenticationService } from '../../services/continuousAuth.js';

/**
 * Create analytics routes
 */
export function createAnalyticsRoutes(pool: Pool): Router {
  const router = Router();
  const featureService = new FeatureExtractionService(pool);
  const authService = new ContinuousAuthenticationService(pool);

  /**
   * POST /api/v1/analytics/features/extract
   * Extract features for a specific session
   */
  router.post('/features/extract', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
        return;
      }

      const features = await featureService.extractFeaturesForSession(sessionId);

      res.status(200).json({
        success: true,
        message: `Extracted ${features.length} feature windows`,
        data: {
          session_id: sessionId,
          window_count: features.length,
          features
        }
      });
    } catch (error: any) {
      console.error('Feature extraction error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to extract features',
        error: error.message
      });
    }
  });

  /**
   * POST /api/v1/analytics/features/batch
   * Extract features for multiple sessions
   */
  router.post('/features/batch', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionIds } = req.body;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Session IDs array is required'
        });
        return;
      }

      const windowCount = await featureService.batchExtractAndStore(sessionIds);

      res.status(200).json({
        success: true,
        message: `Extracted features for ${windowCount} time windows across ${sessionIds.length} sessions`,
        data: {
          session_count: sessionIds.length,
          window_count: windowCount
        }
      });
    } catch (error: any) {
      console.error('Batch feature extraction error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to extract features',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/analytics/features/session/:sessionId
   * Get extracted features for a session
   */
  router.get('/features/session/:sessionId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;

      const query = `
        SELECT *
        FROM keystroke_features
        WHERE session_id = $1
        ORDER BY time_window_start ASC
      `;

      const result = await pool.query(query, [sessionId]);

      res.status(200).json({
        success: true,
        data: {
          session_id: sessionId,
          window_count: result.rows.length,
          features: result.rows
        }
      });
    } catch (error: any) {
      console.error('Error fetching features:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch features',
        error: error.message
      });
    }
  });

  /**
   * POST /api/v1/analytics/auth/enroll
   * Enroll a user for continuous authentication
   */
  router.post('/auth/enroll', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, sessionIds } = req.body;

      if (!userId || !Array.isArray(sessionIds)) {
        res.status(400).json({
          success: false,
          message: 'User ID and session IDs array are required'
        });
        return;
      }

      const profile = await authService.enrollUser(userId, sessionIds);

      res.status(200).json({
        success: true,
        message: `User enrolled successfully (status: ${profile.enrollmentStatus})`,
        data: {
          user_id: userId,
          enrollment_status: profile.enrollmentStatus,
          training_sessions: profile.trainingSessionsCount
        }
      });
    } catch (error: any) {
      console.error('Enrollment error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to enroll user',
        error: error.message
      });
    }
  });

  /**
   * POST /api/v1/analytics/auth/authenticate
   * Authenticate a session
   */
  router.post('/auth/authenticate', async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, userId } = req.body;

      if (!sessionId || !userId) {
        res.status(400).json({
          success: false,
          message: 'Session ID and User ID are required'
        });
        return;
      }

      const result = await authService.authenticate(sessionId, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Authentication error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to authenticate',
        error: error.message
      });
    }
  });

  /**
   * GET /api/v1/analytics/auth/profile/:userId
   * Get user's biometric profile
   */
  router.get('/auth/profile/:userId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const query = `
        SELECT
          user_id,
          enrollment_status,
          training_sessions_count,
          last_updated,
          similarity_threshold,
          anomaly_threshold
        FROM biometric_profiles
        WHERE user_id = $1
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  });

  return router;
}

export default createAnalyticsRoutes;
