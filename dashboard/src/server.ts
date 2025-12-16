/**
 * Dashboard Server
 *
 * Express server that serves the React dashboard frontend
 * and provides backend API endpoints for dashboard data.
 *
 * @module server
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'behavioral-analytics-dashboard',
    environment: NODE_ENV,
  });
});

// API proxy endpoints (forward to backend)
app.use('/api', async (req: Request, res: Response) => {
  try {
    const backendUrl = `${API_BACKEND_URL}${req.path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Copy relevant headers
    Object.keys(req.headers).forEach(key => {
      const value = req.headers[key];
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });

    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({
      error: 'Failed to proxy request to backend',
      message: (error as Error).message,
    });
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // Handle client-side routing
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Development mode - Vite dev server handles the frontend
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Dashboard server running in development mode',
      note: 'Frontend is served by Vite dev server (usually on port 5173)',
      api: 'API endpoints available at /api/*',
      health: 'Health check at /health',
    });
  });
}

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   Behavioral Analytics Dashboard Server                       ║
╚════════════════════════════════════════════════════════════════╝

  Environment:  ${NODE_ENV}
  Server URL:   http://localhost:${PORT}
  API Backend:  ${API_BACKEND_URL}

  ${NODE_ENV === 'production'
    ? 'Serving production build from /dist'
    : 'Running in development mode - use Vite dev server for frontend'
  }

  Health Check: http://localhost:${PORT}/health
  API Proxy:    http://localhost:${PORT}/api/*

  Press Ctrl+C to stop
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
