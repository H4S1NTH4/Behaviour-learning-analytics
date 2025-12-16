/**
 * Behavioral Analytics Server
 *
 * Main entry point for the server application
 * Handles keystroke ingestion, feature extraction, and continuous authentication
 */

import express, { Express, Request, Response } from 'express';
import { getEnvironment, isDevelopment } from './config/environment.js';
import { createPool, testConnection, setupGracefulShutdown, runMigrations } from './config/database.js';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateKeystrokeBatch, validateSessionHeader } from './middleware/validation.js';
import { createKeystrokeRoutes } from './api/keystroke/routes.js';
import { createAnalyticsRoutes } from './api/analytics/routes.js';
import { createHealthRoutes } from './api/health/routes.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();
  const env = getEnvironment();

  // Basic middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware
  app.use(corsMiddleware);

  // Request logging in development
  if (isDevelopment()) {
    app.use((req: Request, res: Response, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Create database pool
  const pool = createPool();

  // API Routes
  app.use('/api/v1/keystrokes', validateSessionHeader, validateKeystrokeBatch, createKeystrokeRoutes(pool));
  app.use('/api/v1/analytics', createAnalyticsRoutes(pool));
  app.use('/api/v1/health', createHealthRoutes(pool));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Behavioral Analytics API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/api/v1/health',
        keystroke_ingestion: '/api/v1/keystrokes/log',
        feature_extraction: '/api/v1/analytics/features/extract',
        authentication: '/api/v1/analytics/auth/authenticate'
      },
      documentation: 'https://github.com/your-repo/behavioral-analytics',
      timestamp: new Date().toISOString()
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
export async function startServer(): Promise<void> {
  try {
    const env = getEnvironment();

    console.log('Starting Behavioral Analytics Server...');
    console.log(`Environment: ${env.NODE_ENV}`);

    // Create database pool
    const pool = createPool();

    // Test database connection
    const connected = await testConnection(pool);
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Run migrations check
    await runMigrations(pool);

    // Setup graceful shutdown
    setupGracefulShutdown(pool);

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.API_PORT, () => {
      console.log('\n=================================');
      console.log('Server started successfully!');
      console.log(`Port: ${env.API_PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`API Base URL: http://localhost:${env.API_PORT}/api/v1`);
      console.log('=================================\n');

      console.log('Available endpoints:');
      console.log(`  - Health: http://localhost:${env.API_PORT}/api/v1/health`);
      console.log(`  - Keystroke Log: http://localhost:${env.API_PORT}/api/v1/keystrokes/log`);
      console.log(`  - Feature Extract: http://localhost:${env.API_PORT}/api/v1/analytics/features/extract`);
      console.log(`  - Auth Enroll: http://localhost:${env.API_PORT}/api/v1/analytics/auth/enroll`);
      console.log('');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${env.API_PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default { createApp, startServer };
